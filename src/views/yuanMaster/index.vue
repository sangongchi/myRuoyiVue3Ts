<template>
  <div class="word-container" ref="containerRef">
    <div id="wrl-applet" class="wrl-applet"></div>
  </div>
</template>

<script setup lang="ts">
import { useYuan } from './useYuan'
// import dataJson from './data.json'

const containerRef = ref<any>(null)
const contianerInfo = ref({
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  scale: 1
})
const middleSendHand = ref<any>(null)
const isConnMiddleService = ref<boolean>(false) //是否连接的中间件服务;
// 保存两个 WebSocket 实例引用
const middleWsInstance = ref<WebSocket | null>(null) // 中间件服务连接（端口83）
const officeWsInstance = ref<WebSocket | null>(null) // 办公组件连接（动态端口）
const applteId = ref<number>(0) //网页组件时返回 JSON 中的 ID 值

// 1. 初始化猿大师连接
function initMasterLink() {
  console.log('初始化猿大师连接')
  // 传入 isMiddleWare=true，表示这是中间件服务连接
  openWebSocket(
    83,
    () => {
      middleSendHand.value({ req: 'Wrl_Version', rid: 1, para: { Mac: 1, More: 1, Config: 1, Router: 1, IP: 1 } })
      middleSendHand.value({ req: 'Wrl_OfficeInfo', rid: 2, para: {} })
      middleSendHand.value({
        req: 'Wrl_OfficeApplet',
        rid: 6,
        para: {
          Type: '0', // 为浏览器类型，传 0 自动判断(前提是当前浏览器已启动并显示在最前端，
          Title: '办公网络组件测试',
          Version: 1,
          Flag: 72,
          Left: contianerInfo.value.left,
          Top: contianerInfo.value.top,
          Width: contianerInfo.value.width,
          Height: contianerInfo.value.height,
          IframeX: 0,
          IframeY: 0,
          BarW: 0, // 网页右侧预留区域
          BarH: 0, // 网页底部预留区域
          ScrollTop: 0,
          Web: {
            Edit: 0,
            Hide: 0, // 代表隐藏的界面元素(目前完整嵌入模式下只支持8和16) 1隐藏菜单 2隐藏标准工具栏 4 隐藏格式工具栏 8 隐藏状态栏 16 隐藏右键菜单
            User: '测试',
            Cookie: '',
            DataPath: 'c:/OfficeDoc' //指定文档查找和保存默认路径
          },
          Option: '1', //Option：1 是启动微软 Word 为 2 启动微软 Excel
          // Open: dataJson.worldUrl
          Open: 'C:/Users/yangpei/Desktop/test.docx'
        }
      })
    },
    true
  )
}

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
    console.log('res', res)
    // 网页组件创建成功
    if (res.event === 'Wrl_AppletOK') {
      console.log('rid', res.rid, 'data', res.data)
      // handleResize()
    } else if (res.event === 'WORD_LoadOK') {
      // 初始化后发现组件适配有问题，load成功后触发一次resize
      handleResize()
      resizeApplet()
    } else if (res.event === 'Wrl_Listen') {
      //网页组件建立侦听成功 这里得到当前网页组件返回的端口,创建另外一个websocket到办公网页组件端口 来实现重新打开文档、提取图片、保存、书签等操作
      // 注意：这里传入 isMiddleWare=false，表示这是办公组件连接
      openWebSocket(
        res.data.port,
        () => {
          console.log('办公组件 websocket 链接成功', res.data.port)
        },
        false
      )
    } else if (res.req === 'Wrl_OfficeApplet') {
      applteId.value = res.data.ID
      console.log('appletId', applteId.value)
    } else if (res.event === 'OFFICE_NetPercent') {
      console.log('下载进度Percent', res.data.Percent)
    }
    // 文件Save
    else if (res.event == 'WORD_Save' || res.event == 'EXCEL_Save') {
      console.log('文件保存')
    }
  }
  instance.onopen = () => {
    console.log(`${isMiddleWare ? '中间件' : '办公组件'} 连接成功，端口: ${port}`)
    if (handdle) {
      handdle()
    }
  }
}

// 全屏事件
function fullScreenHandle() {
  let msg = {
    req: 'Office_SwitchFullScreen',
    rid: 34,
    para: {}
  }
  middleSendHand.value(msg)
}

// 设置缩放比例
function resizeApplet() {
  sendMsg(
    {
      req: 'Office_PageZoom',
      rid: 83,
      para: { Scall: '100' }
    },
    false
  )
}

// 监听页面大小改变，重新设置区域
function handleResize() {
  console.log('resize')
  getAppletContentInfo()
  let msg = {
    req: 'Wrl_AppletResize',
    rid: 5,
    para: {
      ID: applteId.value,
      X: contianerInfo.value.left,
      y: contianerInfo.value.top,
      Width: contianerInfo.value.width,
      Height: contianerInfo.value.height
    }
  }
  middleSendHand.value(msg)
}

// 获取网页组件最终显示区域的信息
async function getAppletContentInfo() {
  await nextTick()
  const rect = containerRef.value.getBoundingClientRect() || {}
  contianerInfo.value = {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    scale: window.devicePixelRatio || 1
  }
  console.log('contianerInfo', contianerInfo.value)
}

function sendMsg(msg: any, isMiddleWare: boolean = true) {
  if (isMiddleWare) {
    middleWsInstance.value && middleWsInstance.value.send(JSON.stringify(msg))
  } else {
    officeWsInstance.value && officeWsInstance.value.send(JSON.stringify(msg))
  }
}
// 隐藏网页那组件
function hideApplet() {
  let msg = {
    req: 'Wrl_AppletControl',
    rid: 2,
    para: { ID: applteId.value, Code: 4 }
  }
  sendMsg(msg)
}

// 显示网页组件
function showApplet() {
  let msg = {
    req: 'Wrl_AppletControl',
    rid: 2,
    para: { ID: applteId.value, Code: 8 }
  }
  sendMsg(msg)
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    console.log('页面可见，显示网页组件')
    showApplet()
  } else {
    console.log('页面隐藏，隐藏网页组件')
    hideApplet()
  }
}

// ---------------------------
// 生命周期
// ---------------------------
onMounted(async () => {
  getAppletContentInfo()
  await initMasterLink()
  // 监听页面显隐
  document.addEventListener('visibilitychange', handleVisibilityChange)
  // 监听窗口变化
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  hideApplet()
  window.removeEventListener('resize', handleResize)
  // 组件卸载时关闭所有 WebSocket 连接
  if (middleWsInstance.value) {
    console.log('组件卸载，关闭中间件 WebSocket 连接')
    middleWsInstance.value.close()
    middleWsInstance.value = null
  }
  if (officeWsInstance.value) {
    console.log('组件卸载，关闭办公组件 WebSocket 连接')
    officeWsInstance.value.close()
    officeWsInstance.value = null
  }
})

onActivated(() => {
  console.log('组件被激活')
})

defineExpose({
  fullScreenHandle
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
