const {
  run,
} = require(`./`)

run(`
  echo 你好
`, {
  close(arg) {
    console.log(`ok`, arg.stdout.match(`你好`))
  },
})