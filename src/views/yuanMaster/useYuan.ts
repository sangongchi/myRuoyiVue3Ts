import { ElMessage } from "element-plus"

function getRandom() {
  return Math.floor(Math.random() * 100000000) + ''.slice(-6)
}
export function useYuan(port: number) {
  const random = getRandom()
  // sid 表示本次会话唯一id可以是字符串，或者数字，确保唯一即可
  // flag flag 为连接标识掩码，设置为 1 表示输出调试日志，设置为 2 表示通讯采用GZip 压缩
  const wsUrl = `ws://127.0.0.1:${port}?sid=${random}&flag=1`

  const instance = new WebSocket(wsUrl)

  instance.onopen = () => {
    console.log(`${wsUrl}->WebSocket连接成功`)
  }

  instance.onerror = () => {
    console.log(`${wsUrl}->WebSocket连接失败`)
    ElMessage.warning('加载出错请稍后再试')
  }

  instance.onclose = () => {
    console.log(`${wsUrl}->WebSocket连接关闭`)
  }

  function sendMsg(obj: any) {
    instance.send(JSON.stringify(obj))
  }
  return {
    instance,
    sendMsg
  }
}
