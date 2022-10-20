class A {
  constructor() {}
  static foo() {
    console.log('A父类自身的foo方法', this.a)
  }

  foo() {
    console.log('A父类的原型上的foo方法', this.a)
  }
}

class B extends A {
  static a = 111
  a = 222

  constructor() {
    super()
  }

  static say() {
    super.foo()
  }

  say() {
    console.log(1)
    super.foo()
  }
}

var b1 = new B()

/* 1 普通方法中的super以对象的形式使用，指向父类的原型，this指向子类的实例。*/
b1.say() // A父类的原型上的foo方法 222

/* 2 静态方法中的super以对象的形式使用，指向父类的原型，this指向子类的实例。*/
B.say() // A父类自身的foo方法 111
