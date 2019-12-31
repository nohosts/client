# nohost-client
nohost pc 客户端，主要用来设置用户电脑代理，将用户系统代理设置为nohost 客户端。

主界面如图所示：

![app](https://user-images.githubusercontent.com/4689952/69595898-c906c380-103b-11ea-91a0-27a65abef436.png)

> 【重要提醒】本项目只是一个模板，不能直接使用，主要是方便大家快速开发本地连接 nohost 的 pc 客户端。

通过下面指引，简单替换几处代码，即可生成windows客户端和mac客户端。

pc客户端使用了 electron 技术，它允许使用Node.js（作为后端）和Chromium（作为前端）完成桌面GUI应用程序的开发。使用它，前端不需要了解过多的桌面技术，使用熟悉的前端技术栈即可开发出桌面应用。深入开发，可以详细了解一下[electron](https://github.com/electron/electron)知识。


# 项目目录结构

主要目录说明：
- app/assets: 客户端用到的图标
- app/lib: 公共代码

目录树状结构：
```
├─app 客户端代码
│  ├─assets 客户端用到的图标、静态资源
│  ├─index.html app界面
│  ├─main.js 管理app生命周期
│  └─package.json
```

项目核心是whistle提供代理抓包服务，客户端启动的时候会启用一个whistle服务。

# 开发

1. 在app/package.json 添加whistle插件 进 dependencies，插件如何开发请看[访问 nohost 的 whistle 插件](https://github.com/nohosts/whistle.nohost-imweb)

2. 修改app/index.html 中**选择环境**的链接 
![选择环境链接](https://user-images.githubusercontent.com/4689952/69938189-9a935780-1517-11ea-8630-552113232819.png)


# 安装依赖
项目初始，需要安装依赖

``` sh
npm install
```

# 本地调试

``` sh
npm run start
```


# 打包客户端
打包windows客户端

``` sh
npm run pack:win
```

打包生成的windows客户端在 dist/nohost-v0.0.1-win.exe

打包mac客户端

``` sh
npm run pack:mac
```

打包生成的mac客户端在 dist/nohost-v0.0.1-mac.dmg

打包生成的客户端即可提供给其他人安装使用。