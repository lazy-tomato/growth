console.time()
let arr = []
for (let i = 0; i < 10000; ++i) {
  arr.push(i)
}
arr.reverse()
console.timeEnd() // 0.553ms

console.time()
let arr2 = []
for (let i = 0; i < 10000; ++i) {
  arr2.unshift(i)
}
console.timeEnd() // 9.784ms
