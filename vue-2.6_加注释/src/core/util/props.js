/* @flow */

import { warn } from "./debug";
import { observe, toggleObserving, shouldObserve } from "../observer/index";
import {
  hasOwn,
  isObject,
  toRawType,
  hyphenate,
  capitalize,
  isPlainObject,
} from "shared/util";

type PropOptions = {
  type: Function | Array<Function> | null,
  default: any,
  required: ?boolean,
  validator: ?Function,
};

export function validateProp(
  key: string, // 属性名
  propOptions: Object, // 子组件用户设置的props选项
  propsData: Object, // 父组件或用户提供的props
  vm?: Component // this
): any {
  // 1.存储当前key的 props 选项 （存配置）
  const prop = propOptions[key];

  // 2.当前key在用户提供的propsData是否存在  （是否传递了数据） true没传数据
  const absent = !hasOwn(propsData, key);

  // 3. 拿到父组件传递的数据  （存数据）
  let value = propsData[key];
  // boolean casting
  const booleanIndex = getTypeIndex(Boolean, prop.type);

  //
  if (booleanIndex > -1) {
    // 没有传递数据，且也没有默认的default
    if (absent && !hasOwn(prop, "default")) {
      // 值默认为 false
      value = false;
    } else if (value === "" || value === hyphenate(key)) {
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      // 只将空字符串/同名转换为布尔值
      // 布尔值优先级更高
      const stringIndex = getTypeIndex(String, prop.type);
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true;
      }
    }
  }

  // check default value
  // 检查默认值
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key);
    // since the default value is a fresh copy,
    // make sure to observe it.
    const prevShouldObserve = shouldObserve;
    toggleObserving(true);
    observe(value);
    toggleObserving(prevShouldObserve);
  }

  // 验证失败，提出警告
  if (
    process.env.NODE_ENV !== "production" &&
    // skip validation for weex recycle-list child component props
    !(__WEEX__ && isObject(value) && "@binding" in value)
  ) {
    // 断言 props
    assertProp(prop, key, value, vm, absent);
  }

  // 返回真实的vue
  return value;
}

/**
 * Get the default value of a prop.
 */
function getPropDefaultValue(
  vm: ?Component,
  prop: PropOptions,
  key: string
): any {
  // no default, return undefined
  if (!hasOwn(prop, "default")) {
    return undefined;
  }
  const def = prop.default;
  // warn against non-factory defaults for Object & Array
  if (process.env.NODE_ENV !== "production" && isObject(def)) {
    warn(
      'Invalid default value for prop "' +
        key +
        '": ' +
        "Props with type Object/Array must use a factory function " +
        "to return the default value.",
      vm
    );
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (
    vm &&
    vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key];
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === "function" && getType(prop.type) !== "Function"
    ? def.call(vm)
    : def;
}

/**
 * Assert whether a prop is valid.
 */
function assertProp(
  prop: PropOptions, // prop的配置
  name: string, //  prop选项的key
  value: any, // prop数据
  vm: ?Component, // this
  absent: boolean // 传入的数据中 是否不存在 key 属性
) {
  // 校验是否必填 但是为船只
  if (prop.required && absent) {
    warn('Missing required prop: "' + name + '"', vm);
    return;
  }

  // 非必填且没有传入值的情况直接return  (注意一下这里是双等于， null或者undefined都会为true)
  if (value == null && !prop.required) {
    return;
  }

  // 类型
  let type = prop.type;

  //!type || type === true; 如何理解？
  // 首先执行 `!type` 再执行 `type === true`
  // 当 `!type` 为true，则执行 `type === true`
  // 简单来说:
  // 1. 如果没有传入类型，则  !false为true，执行`type === true`，此时valid为true；
  // 2. 如果传入了类型，数组或者对象类型，例如 !['string','array']为false , 此时valid 为 false；
  let valid = !type || type === true;

  // 用来保存 type的列表
  const expectedTypes = [];

  // 存在需要校验的类型
  /* 
      type: Object,
      // 对象或数组默认值必须从一个工厂函数获取
      default: function () {
        return { message: 'hello' }
      }
      
  */
  if (type) {
    // 不是数组，转换成数组
    if (!Array.isArray(type)) {
      type = [type];
    }

    // 遍历
    for (let i = 0; i < type.length && !valid; i++) {
      // assertType校验 value,返回一个对象，对象两个属性，valid为是否校验成功，后者表示类型
      const assertedType = assertType(value, type[i], vm);

      // 存储
      expectedTypes.push(assertedType.expectedType || "");

      // 校验成功
      valid = assertedType.valid;
    }
  }

  // 是否有类型
  const haveExpectedTypes = expectedTypes.some((t) => t);

  // 校验不成功，报错
  if (!valid && haveExpectedTypes) {
    warn(getInvalidTypeMessage(name, value, expectedTypes), vm);
    return;
  }

  // 自定义校验器
  const validator = prop.validator;
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      );
    }
  }
}

const simpleCheckRE = /^(String|Number|Boolean|Function|Symbol|BigInt)$/;

function assertType(
  value: any,
  type: Function,
  vm: ?Component
): {
  valid: boolean,
  expectedType: string,
} {
  let valid;
  const expectedType = getType(type);
  if (simpleCheckRE.test(expectedType)) {
    const t = typeof value;
    valid = t === expectedType.toLowerCase();
    // for primitive wrapper objects
    if (!valid && t === "object") {
      valid = value instanceof type;
    }
  } else if (expectedType === "Object") {
    valid = isPlainObject(value);
  } else if (expectedType === "Array") {
    valid = Array.isArray(value);
  } else {
    try {
      valid = value instanceof type;
    } catch (e) {
      warn(
        'Invalid prop type: "' + String(type) + '" is not a constructor',
        vm
      );
      valid = false;
    }
  }
  return {
    valid,
    expectedType,
  };
}

const functionTypeCheckRE = /^\s*function (\w+)/;

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType(fn) {
  const match = fn && fn.toString().match(functionTypeCheckRE);
  return match ? match[1] : "";
}

function isSameType(a, b) {
  return getType(a) === getType(b);
}

function getTypeIndex(type, expectedTypes): number {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1;
  }
  for (let i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i;
    }
  }
  return -1;
}

function getInvalidTypeMessage(name, value, expectedTypes) {
  let message =
    `Invalid prop: type check failed for prop "${name}".` +
    ` Expected ${expectedTypes.map(capitalize).join(", ")}`;
  const expectedType = expectedTypes[0];
  const receivedType = toRawType(value);
  // check if we need to specify expected value
  if (
    expectedTypes.length === 1 &&
    isExplicable(expectedType) &&
    isExplicable(typeof value) &&
    !isBoolean(expectedType, receivedType)
  ) {
    message += ` with value ${styleValue(value, expectedType)}`;
  }
  message += `, got ${receivedType} `;
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += `with value ${styleValue(value, receivedType)}.`;
  }
  return message;
}

function styleValue(value, type) {
  if (type === "String") {
    return `"${value}"`;
  } else if (type === "Number") {
    return `${Number(value)}`;
  } else {
    return `${value}`;
  }
}

const EXPLICABLE_TYPES = ["string", "number", "boolean"];
function isExplicable(value) {
  return EXPLICABLE_TYPES.some((elem) => value.toLowerCase() === elem);
}

function isBoolean(...args) {
  return args.some((elem) => elem.toLowerCase() === "boolean");
}
