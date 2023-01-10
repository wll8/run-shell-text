一个在 js 中运行系统脚本的工具, 处理不同平台的一些差异.


``` js
const {
  run,
} = require(`run-shell`)

run(`
  echo 你好
`, {
  close(arg) {
    console.log(`ok`, arg.stdout.match(`你好`))
  },
})
```