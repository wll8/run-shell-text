#!/usr/bin/env node

const spawn = require('cross-spawn')
const iconv = require('iconv-lite')
const treeKill = require('tree-kill')
const os = require('os')
const fs = require('fs')

/**
 * 运行命令
 * @param {string} sh 要运行的命令, 支持多行
 * @param {object} [cfg]
 * @param {function} cfg.stdout 输出时的回调
 * @param {function} cfg.stderr 错误时的回调
 * @param {function} cfg.close 关闭成功后的回调
 * @param {function} cfg.alone 在单独的 shell 中运行每行命令, 避免主进程被退出
 * @param {object} cfg.opt spawn 选项
 * @param {object} cfg.saveCmdFile 运行结束后是否保留命令文件, 默认 true
 * @returns {cp} 子进程, 可以使用 cp.fkill() 退出
 */
function run(sh = `echo hello`, cfg = {}){
  const {stdout, stderr, close, exit, opt = {}} = cfg
  const isWin = os.type() === 'Windows_NT'
  const suffix = isWin ? 'cmd' : 'sh' // 解释器和后缀名都可以使用
  const file = `${os.tmpdir()}/qs_raw_shell_${uuid()}.${suffix}`
  const codePage = isZh() ? `gbk` : `utf8`
  const lineTag = isWin ? `\r\n` : `\n`

  if(cfg.alone) {
    sh = sh.split(`\n`)
      .filter(item => item.trim())
      .map(item => isWin ? `cmd /c ${item}` : `sh -c '${item}'`).join(lineTag)
  }
  sh = isWin ? `@echo off${lineTag}${sh}` : sh // 如果是 win 平台则关闭命令本身的显示
  fs.writeFileSync(file, iconv.encode(sh, codePage))
  const arr = [...(isWin ? [suffix, '/c'] : [suffix]), file]
  const [bin, ...arg] = arr
  const cp = spawn(bin, arg, {
    ...opt,
  })
  let stdoutData = ``
  cp.stdout.on(`data`, (data) => {
    const decode = iconv.decode(data, codePage)
    stdoutData += decode
    stdout && stdout(decode)
  });
  let stderrData = ``
  cp.stderr.on(`data`, (data) => {
    const decode = iconv.decode(data, codePage)
    stderrData += decode
    stderr && stderr(decode)
  });
  cp.on(`close`, (code) => { // stdio 流已关闭
    cfg.saveCmdFile === false && fs.unlinkSync(file)
    close && close({code, stdout: stdoutData, stderr: stderrData})
  });
  cp.on(`exit`, (code) => { // 进程已退出, stdio 流 可能依然打开
    exit && exit({code, stdout: stdoutData, stderr: stderrData})
  });
  cp.fkill = () => treeKill(cp.pid)
  return cp
}

/**
 * 生成基于进程 pid 的 uuid
 * @param {*} sep 
 * @returns 
 */
function uuid(sep = '') {
  let increment = process.increment === undefined ? (process.increment = 1) : (process.increment = (process.increment + 1))
  return `${Number(String(Date.now()).slice(-5))}_${String(Math.random()).slice(-2)}_${process.pid}_${increment}`.replace(/_/g, sep)
}

/**
 * 判断当前系统是不是中文
 * @returns
 */
function isZh(){
  const isWin = require('os').type() === 'Windows_NT'
  return [
    // 代码页为 936
    () => isWin && require(`child_process`).execSync(`chcp`, {encoding: `utf8`}).match(/936/),
    // 注册表安装语言为 0804
    () => isWin && require(`child_process`).execSync(`reg query "HKEY_LOCAL_MACHINE\\SYSTEM\\ControlSet001\\Control\\Nls\\Language" /v InstallLanguage`, {encoding: `utf8`}).match(/0804/),
    // 查看版本时输出双字节字符
    () => isWin && require(`child_process`).execSync(`ver`, {encoding: `utf8`}).match(/[\u4e00-\u9fa5]/),
    // 控制台语言配置为 zh_CN
    () => process.env.LANG.match(`zh_CN`),
  ].some(item => {
    try {
      return item()
    } catch (error) {
      return false
    }
  })
}


module.exports = {
  spawn,
  iconv,
  treeKill,
  run,
}