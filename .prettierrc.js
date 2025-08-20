export default {
  semi: false, // 语句末尾不增加分号
  useTabs: false,
  bracketSpacing: true, // 对象字面量的括号间是否加空格
  arrowParens: 'avoid', // 箭头函数
  tabWidth: 2,
  singleQuote: true, // 使用单引号
  printWidth: 120, // 每行最多120个字符
  quoteProps: 'as-needed', // 更改引用对象属性的时间 可选值"<as-needed|consistent|preserve>"
  trailingComma: 'none', // 多行时尽可能打印尾随逗号。（例如，单行数组永远不会出现逗号结尾。） 可选值"<none|es5|all>"，默认none
  endOfLine: 'auto',
  vueIndentScriptAndStyle: false, // Vue文件脚本和样式标签缩进
  singleAttributePerLine: false, // 允许每行多个属性
  arrayBracketNewline: 'auto',
  jsxBracketSameLine: false, // jsx 标签的反尖括号需要换行
  htmlWhitespaceSensitivity: 'ignore' // 忽略 HTML 空白敏感度
}
