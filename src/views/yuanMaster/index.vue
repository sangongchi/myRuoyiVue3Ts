<template>
  <div class="word-container" ref="containerRef">
    <div id="wrl-applet" class="wrl-applet"></div>
  </div>
</template>

<script setup lang="ts">
import { useYuan } from './useYuan'
import dataJson from './data.json'

const containerRef = ref(null)
const contianerInfo = ref({
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  scale: 1
})
const middleSendHand = ref<any>(null)
const isConnMiddleService = ref<boolean>(false) //是否连接的中间件服务;
const appletId = ref(null)
// 保存两个 WebSocket 实例引用
const middleWsInstance = ref<WebSocket | null>(null) // 中间件服务连接（端口83）
const officeWsInstance = ref<WebSocket | null>(null) // 办公组件连接（动态端口）

function openWebSocket(port: number, handdle: any, isMiddleWare: boolean = false) {
  // 根据类型选择要关闭的旧连接
  const oldInstance = isMiddleWare ? middleWsInstance.value : officeWsInstance.value
  
  // 如果已存在同类型的连接，先关闭它
  if (oldInstance) {
    console.log(`关闭旧的 ${isMiddleWare ? '中间件' : '办公组件'} WebSocket 连接`)
    oldInstance.close()
    if (isMiddleWare) {
      middleWsInstance.value = null
    } else {
      officeWsInstance.value = null
    }
  }

  const { instance, sendMsg } = useYuan(port)
  
  // 保存新的 WebSocket 实例引用
  if (isMiddleWare) {
    middleWsInstance.value = instance
  } else {
    officeWsInstance.value = instance
  }

  if (port === 83) {
    middleSendHand.value = sendMsg
    isConnMiddleService.value = true
  }
  
  instance.onmessage = (e: any) => {
    const res = JSON.parse(e.data)

    // 网页组件创建成功
    if (res.event === 'Wrl_AppletOK') {
      console.log('rid', res.rid)
    } else if (res.event === 'Wrl_Listen') {
      console.log('res', res)
      //网页组件建立侦听成功 这里得到当前网页组件返回的端口,创建另外一个websocket到办公网页组件端口 来实现重新打开文档、提取图片、保存、书签等操作
      // 注意：这里传入 isMiddleWare=false，表示这是办公组件连接
      openWebSocket(res.data.port, () => {
        console.log('办公组件 websocket 链接成功', res.data.port)
      }, false)
    }
    console.log('子组件接收到消息', e)
  }
  instance.onopen = () => {
    console.log(`${isMiddleWare ? '中间件' : '办公组件'} 连接成功，端口: ${port}`)
    if (handdle) {
      handdle()
    }
  }
}

// ---------------------------
// 1. 初始化猿大师连接
// ---------------------------
function initWrl() {
  console.log('初始化猿大师连接')
  // 传入 isMiddleWare=true，表示这是中间件服务连接
  openWebSocket(83, () => {
    middleSendHand.value({ req: 'Wrl_Version', rid: 1, para: { Mac: 1, More: 1, Config: 1, Router: 1, IP: 1 } })
    middleSendHand.value({ req: 'Wrl_OfficeInfo', rid: 2, para: {} })
    middleSendHand.value({
      req: 'Wrl_OfficeApplet',
      rid: 6,
      para: {
        Type: '0',
        Title: '办公网络组件测试',
        Flag: 72,
        Left: contianerInfo.value.left,
        Top: contianerInfo.value.top,
        Width: contianerInfo.value.width,
        Height: contianerInfo.value.height,
        IframeX: 0,
        IframeY: 0,
        BarW: 0,
        BarH: 0,
        ScrollTop: 0,
        Web: {
          Edit: 0,
          Hide: 0,
          User: 'zorro',
          Cookie: '',
          DataPath: 'c:/OfficeDoc'
        },
        Option: '1',
        Open: dataJson.worldUrl
      }
    })
  }, true)
}

// ---------------------------
// 2. 打开 Word 文档
// ---------------------------
async function openWord(url: string) {
  const req = {
    req: 'Office_OpenFile',
    rid: 101,
    para: {
      FileUrl: url,
      Edit: true
    }
  }
  send(req)
}

// ---------------------------
// 3. 设置 Word 缩放（关键）
// ---------------------------
function setZoomFit() {
  send({
    req: 'Office_PageZoom',
    rid: 83,
    para: { Fit: '1' } // 适应页宽
  })
}

// ---------------------------
// 4. 浏览器窗口变化时自适应
// ---------------------------
function resizeApplet() {
  const scale = calcScale()
  send({
    req: 'Wrl_AppletScale',
    rid: 11,
    para: { ID: appletId.value, Scale: scale }
  })
}

function calcScale() {
  const width = containerRef.value.clientWidth
  const base = 1200 // 设计稿宽度
  return Math.floor((width / base) * 100)
}

// ---------------------------
// 5. 发送消息到猿大师
// ---------------------------
function send(json) {
  window.WRL_Send && window.WRL_Send(JSON.stringify(json))
}

// 获取网页组件最终显示区域的信息
async function getAppletContentInfo() {
  await nextTick()
  const rect = containerRef.value.getBoundingClientRect()
  contianerInfo.value = {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    scale: window.devicePixelRatio || 1
  }
  console.log('contianerInfo', contianerInfo.value)
}
// 获取本机Office软件安装信息
function getOfficeInfo() {
  send({
    req: 'Office_GetInfo',
    rid: 102
  })
}

// ---------------------------
// 生命周期
// ---------------------------
onMounted(async () => {
  getAppletContentInfo()
  await initWrl()

  // 创建 applet
  send({
    req: 'Wrl_CreateApplet',
    rid: 10,
    para: {
      ID: 1,
      Type: 'Office',
      Parent: 'wrl-applet'
    }
  })

  appletId.value = 1

  // 打开文档
  openWord('https://your-server.com/demo.docx')

  // 设置缩放
  setTimeout(setZoomFit, 500)

  // 监听窗口变化
  window.addEventListener('resize', resizeApplet)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeApplet)
  // 组件卸载时关闭 WebSocket 连接
  if (currentWsInstance.value) {
    console.log('组件卸载，关闭 WebSocket 连接')
    currentWsInstance.value.close()
    currentWsInstance.value = null
  }
})
</script>

<style scoped lang="scss">
.word-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f5f5;
  .wrl-applet {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
}
</style>
