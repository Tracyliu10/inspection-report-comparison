# Inspection Report Comparison v2

多人协作测试版。需要 Python 3.9+，无需第三方依赖。

## 在 Mac 测试
双击 `启动测试.command`。如系统不允许双击，在终端进入目录执行：

```sh
IRC_DEMO=1 python3 server.py
```

打开 http://127.0.0.1:8765 。先启动服务器，再刷新页面。

测试密码统一为 `Test-Only-2026!`。
管理员：admin@example.test
Junior：junior1@example.test 至 junior3@example.test
CM：cm1@example.test 至 cm8@example.test

演示房源1分配Junior1和CM1，房源2分配Junior2和CM2，房源3分配Junior3和CM3。管理员可创建新案件并分配。

测试流程：Junior1登录→打开演示房源1→补充说明、备注及照片→保存→提交CM审核→退出→CM1登录→查看同一案件→逐项审核→退回补充或完成。租客责任项目需要前后照片及对外说明。完成后可导出离线HTML租客报告，浏览器打印为PDF。不同浏览器登录不同账号可测试共享。

已实现：服务端身份认证、房源权限、共享SQLite数据库和照片、版本冲突校验、操作日志、按状态工作流、误加项目删除、图片压缩和租客报告。

本轮为功能测试版：账号创建/停用、调整负责人和改密码已有后台API，尚未提供对应管理表单；管理员页面目前提供创建及分配案件。照片点击单张放大，复杂对照工具仍待完善。未实现旧版备份导入、自动保存、邮件通知、自动PDF识别。

## 部署边界
不能只上传GitHub Pages实现多人共享。需运行此Python后台的服务器、持久化磁盘、HTTPS反向代理及备份。照片和记录在服务器data目录，不在GitHub。测试默认仅监听本机，正式部署须配置网络和HTTPS。

正式首次启动使用独立空数据目录，关闭IRC_DEMO，设置至少8位 IRC_ADMIN_PASSWORD，并设置 IRC_SECURE_COOKIE=1（HTTPS）。管理员初始邮箱 admin@example.test。不要将演示数据库用于正式业务。应由部署人员维护账号和数据库备份。本包不包含任何真实物业或客户资料。

测试数据目录和数据库请勿提交GitHub。停止服务后可备份整个数据目录。

## 最新界面更新
管理员账号管理支持创建、编辑姓名和邮箱、重设至少8位密码、启停账号，并可查看全部案件。CM按区域折叠审核，照片支持拖拽和放大对照。PDF报告仅包含确认的租客责任项目，通过浏览器打印另存为PDF。

本项目是带Python后台的软件，不能仅上传GitHub Pages实现多人共享；启动方法见上文。static/index.html是后台提供的页面入口，不能脱离后台直接双击使用。
