# ✨最新可用 - 完美解决【头歌 / 学习通】禁复制/粘贴问题

一个强大的油猴脚本,用于解决头歌和超星学习通的复制粘贴限制问题。

## 📋 功能特性

### 核心功能

- ✅ **解除复制限制** - 允许在页面任意位置复制文本
- ✅ **解除粘贴限制** - 恢复正常的粘贴功能(Ctrl+V / Cmd+V)
- ✅ **全选快捷键** - 恢复 Ctrl+A / Cmd+A 快捷键
- ✅ **防剪贴板污染** - 阻止网页往剪贴板写入空白内容
- ✅ **智能缩进处理** - 在代码编辑器中粘贴时自动清理光标前的多余缩进

### 技术亮点

- 🚀 在 `document-start` 阶段注入,确保最早执行
- 🛡️ 拦截网页的复制/粘贴事件监听器
- 📝 保留粘贴内容的原始格式和缩进
- 🔒 阻止网页显示"禁止复制"提示
- 💡 允许全站文本选中

## 🚀 安装使用

### 前置要求

- 安装浏览器扩展管理器(任选其一):
  - [Tampermonkey](https://www.tampermonkey.net/)
  - [Violentmonkey](https://violentmonkey.github.io/)
  - [Greasemonkey](https://www.greasespot.net/)

### 安装步骤

1. 安装上述任一扩展管理器
2. 点击 [安装脚本](https://greasyfork.org/zh-CN/scripts/558152-2026%E6%9C%80%E6%96%B0%E5%8F%AF%E7%94%A8-%E5%AE%8C%E7%BE%8E%E8%A7%A3%E5%86%B3-%E5%A4%B4%E6%AD%8C%E5%B9%B3%E5%8F%B0-%E7%A6%81%E5%A4%8D%E5%88%B6-%E7%B2%98%E8%B4%B4%E9%97%AE%E9%A2%98)
3. 在弹出的页面点击"安装"按钮
4. 访问 [头歌平台](https://www.educoder.net/) 即可使用

## 📖 工作原理

### 1. 快捷键拦截

脚本在捕获阶段拦截 Ctrl+C、Ctrl+V、Ctrl+A 等快捷键,阻止平台的监听器接收这些事件。

### 2. 剪贴板保护

- 重写 `navigator.clipboard.writeText()` 和 `clipboard.write()` 方法
- 检测并拦截尝试写入空白内容的操作
- 保护用户剪贴板不被恶意清空

### 3. 智能粘贴

- 识别代码编辑器环境
- 粘贴前清理光标前的纯空格/Tab缩进
- 保留粘贴内容本身的原始格式

### 4. 文本选择

- 全局启用 `user-select: text`
- 隐藏平台的"禁止复制"提示框

## 🎯 适用范围

### 支持的域名

- `https://www.educoder.net/*`
- `https://educoder.net/*`
- `https://*.educoder.net/*`
- `https://www.educoder.net/*`
- `https://educoder.net/*`
- `https://*.educoder.net/*`
- `*://*.chaoxing.com/*`
- `*://chaoxing.com/*`
- `*://*.xueyinonline.com/*`
- `*://xueyinonline.com/*`
- `*://*.chaoxingerya.com/*`
- `*://chaoxingerya.com/*`

### 支持的编辑器

- Monaco Editor
- ACE Editor
- CodeMirror
- 原生 textarea
- contenteditable 元素

## ⚠️ 注意事项

1. **浏览器兼容性**: 推荐使用 Chrome、Edge、Firefox 最新版本
2. **权限要求**: 脚本需要访问剪贴板 API
3. **其他脚本冲突**: 如有其他修改剪贴板的脚本,可能产生冲突
4. **平台更新**: 如平台更新反制措施,脚本可能需要更新

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**免责声明**: 本脚本仅用于改善用户体验,使用者需遵守平台相关规定,因使用本脚本造成的任何后果由使用者自行承担。
