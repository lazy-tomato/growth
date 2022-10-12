var html = '<!DOCTYPE html> 213'

var output = html.match(/^<!DOCTYPE [^>]+>/i)

console.log(output)
/* 

[
  '<!DOCTYPE html>',
  index: 0,
  input: '<!DOCTYPE html> 213',
  groups: undefined
]

*/

/* 

1. match ，匹配规则没有使用`g`, 第一个参数:第一个完整匹配,所以返回 `'<!DOCTYPE html>'`

2. 上述逻辑很简单。匹配html的开头标识；

3.  /^<!DOCTYPE [^>]+>/

+ `i` : 忽略大小写匹配
+ `//`: 左右两个右斜杠，表示正则；
+ `^` : 这里的`^<!DOCTYPE ` 表示以`<!DOCTYPE `卡开头头
+ `[^>]` : 表示匹配除了`>`的字符  （在中括号中的 ^ , 表示排除这些字符串）
+ `+>` : 表示 重复一次或更多次（至少有一次）`>`
*/
