import request from '@/utils/request'

// 登录方法
export function login(username: string, password: string, code: string, uuid: string) {
  const data = {
    username,
    password,
    code,
    uuid
  }
  return request({
    url: '/auth/login',
    extrInfo: {
      isNeedToken: false
    },
    method: 'post',
    data: data
  })
}

// 注册方法
export function register(data: any) {
  return request({
    url: '/auth/register',
    extrInfo: {
      isNeedToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: '/system/user/getInfo',
    method: 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'delete'
  })
}

// 获取验证码
export function getCodeImg() {
  return request({
    url: '/code',
    extrInfo: {
      isNeedToken: false
    },
    method: 'get',
    timeout: 20000
  })
}
