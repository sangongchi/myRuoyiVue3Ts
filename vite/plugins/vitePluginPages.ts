import path from 'path'
import pages from 'vite-plugin-pages'

export default function createPages() {
  return pages({
    dirs: 'src/pages',
    exclude: [
      '**/components/**' // 排除在外的目录，上面配置目录的例子，里面有 components 目录，我们不希望他被解析为路由
    ],
    extendRoute(route) {
      return {
        ...route,
        path: '/pages' + route.path,
        meta: {
          title: route.name
        }
      }
    }
  })
}
