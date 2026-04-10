declare module '*.vue' {
  import { defineComponent } from 'vue'
  const Component: ReturnType<typeof defineComponent>
  export default Component
}

declare module 'pagedjs';

declare module '@vivliostyle/viewer'
// declare module 'virtual:svg-icons-register'