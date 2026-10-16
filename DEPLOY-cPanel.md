# cPanel 部署说明（PROG2002 A3 - Kindred City Charity Events）

本项目为一个 Node.js 应用同时提供三种内容：

- RESTful API：`/api/...`
- 客户端网站（AngularJS）：`/`
- 管理后台（AngularJS）：`/admin`

## 部署步骤

### 1. 上传代码

将此部署包解压后上传到 cPanel 的文件管理器，例如：

```
/home/<cpanel-user>/charityevents/
├── api/
├── clientside/
├── adminside/
├── database/
├── README.md
└── DEPLOY-cPanel.md
```

> 不需要上传 `node_modules`，依赖在服务器上安装。

### 2. 创建 MySQL 数据库

1. cPanel → **MySQL® Databases**：新建数据库，例如 `<user>_charityevents_db`
2. 新建数据库用户并设置密码，把用户加入该数据库，授予 **ALL PRIVILEGES**
3. cPanel → **phpMyAdmin**：选中新数据库 → Import → 选择
   `database/charityevents_db.sql` → 执行（脚本含建表与全部样例数据，
   字符集 utf8mb4）

### 3. 配置 Node.js 应用

cPanel → **Setup Node.js App** → **Create Application**：

| 配置项 | 值 |
|---|---|
| Node.js version | 18.x（本机开发验证版本为 18.20.8） |
| Application mode | Production |
| Application root | `charityevents/api`（即 api 文件夹的路径） |
| Application URL | 你的域名或子域名 |
| Application startup file | `app.js` |

创建后在应用页面：

1. 点 **Run NPM Install**（安装 express、mysql2、cors）
2. 在 **Environment variables** 中添加：

| 变量 | 说明 | 示例 |
|---|---|---|
| `DB_HOST` | 数据库主机 | `localhost` |
| `DB_PORT` | 数据库端口 | `3306` |
| `DB_USER` | cPanel 数据库用户 | `<user>_charity` |
| `DB_PASSWORD` | 数据库密码 | （你设置的密码） |
| `DB_NAME` | 数据库名 | `<user>_charityevents_db` |
| `PORT` | 一般无需设置，cPanel/Passenger 自动分配 | - |

3. 点 **Restart** 重启应用

### 4. 验证

- 客户端网站：`https://<你的域名>/`
- 管理后台：`https://<你的域名>/admin`
- API 健康检查：`https://<你的域名>/api/events/upcoming`
- 天气接口（外部 Open-Meteo API 代理）：`https://<你的域名>/api/weather?lat=-33.87&lon=151.21&days=3`

## 注意事项

- `api/app.js` 通过 `path.join(__dirname, "..", "clientside")` 提供静态网站，
  因此 **api、clientside、adminside 三个文件夹必须保持同级目录结构**。
- 端口与数据库配置全部支持环境变量覆盖（见 `api/event_db.js` 与
  `api/app.js`），本地默认值仅供开发使用。
- 天气功能需要服务器能访问外网 `api.open-meteo.com`；若外网受限，
  网站其余功能不受影响，仅天气卡片显示不可用提示。
