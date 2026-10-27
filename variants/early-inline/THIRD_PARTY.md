# 来源与第三方条款

`index.html`、两套观察器脚本及原历史报告来自作者自行开发的早期主页文件；未发现外部模板标识、远程图片、字体导入或第三方视觉组件。内联 SVG/CSS/Canvas 为代码示意内容，不是真实作品照片。本次 MIT 仅覆盖作者拥有权利的内容。系统字体由用户设备提供，本仓库不再分发字体。

页面本身无运行依赖。以下软件仅在安装可选测量工具时通过 npm 下载，源码包/浏览器未捆绑：

| 组件 | 锁定版本 | 原许可与来源 |
| --- | --- | --- |
| Playwright | 1.64.1 | Apache-2.0；[Microsoft 官方项目](https://github.com/microsoft/playwright)，[npm 包](https://www.npmjs.com/package/playwright) |
| Playwright Core | 1.64.1 | Apache-2.0；[Microsoft 官方项目](https://github.com/microsoft/playwright)，[npm 包](https://www.npmjs.com/package/playwright-core) |

`licenses/playwright/` 与 `licenses/playwright-core/` 保留已安装原包的完整 `LICENSE`、`NOTICE`、`ThirdPartyNotices.txt` 原字节。原包还会在其 `lib/*.LICENSE` 中提供内嵌第三方完整通知；安装依赖时应保留原包全部内容。本仓库只分发自行编写的脚本和通知，不复制 Playwright 的 `lib`，不将其内嵌代码改授 MIT。

Google Chrome 由使用者自行安装并按其条款使用；这里不再分发浏览器。Web 指标定义的官方链接仅用于方法说明，不复制文章或将文章内容视作本项目代码。
