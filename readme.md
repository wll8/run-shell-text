一个在 js 中运行系统脚本的工具, 处理不同平台的一些差异.


``` js
const {
  run,
} = require(`run-shell-text`)

run(`
  echo 你好
`, {
  close(arg) {
    console.log(`ok`, arg.stdout.match(`你好`))
  },
})
```

## todo
- [ ] fix: 当使用含有中文的 commit msg 时无法运行 shell
  ``` bat
  git init
  git config user.name "sync"
  git config user.email "sync@sync.sync"
  git add .
  git commit -m "项目 - 作者 - commit - 描述 - 2023-01-18 08:55:25"
  ```
  - 这导致了当文件名为 `项目 - 文件名 - 时间 - 描述.js` 也出现了错误
  - 已使用 gb2312 也不行
  - 单独运行 *.cmd 文件也不行
  - 但是新建一个 cmd 文件复制上面代码使用 ansi 保存, 能运行