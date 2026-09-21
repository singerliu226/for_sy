# 魔族小窝

大魔王和小魔王一起留话、写手账、收纪念日的小窝。小魔丸是共用的问答小伙伴。

- `/`：小窝首页
- `/first-year`：第一年双人手账、按日期的小约定
- `/assistant`：小魔丸通用问答
- `/messages`：双向小留言
- `/anniversaries`：纪念日归档
- `/anniversaries/qixi`：完整保留的七夕互动星图
- `/guide`：旧上海攻略，数据和代码保留，不在公开导航展示

首次使用时在右上角选择「大魔王」或「小魔王」。这个选择用于给留言、手账、小约定和访问行为署名；它是浏览器里的身份卡，不是安全登录，不能当作访问控制。

手账、小约定和新增纪念日以服务器文件持久化。环境变量可按需要指定：

```ini
FIRST_YEAR_FILE=/path/to/first-year.json
ANNIVERSARY_FILE=/path/to/anniversaries.json
MESSAGE_BOARD_FILE=/path/to/messages.json
ASSISTANT_AUDIT_LOG_FILE=/path/to/conversations.json
```

## 本地预览

```bash
npm run dev
```

## 小魔丸的联网能力

不配置 key 时，小魔丸会诚实说明这次无法查准。若要启用 DeepSeek 的实时网页检索，在服务器创建仅 root 可读的 `/etc/qixi-siyi.env`：

```ini
DEEPSEEK_API_KEY=你的真实密钥
SITE_URL=http://47.103.122.202:3001
```

然后重启 `qixi-siyi` 服务。密钥不得写入仓库、前端代码或浏览器。

## 自有服务器部署

网站仅监听服务器本机的 `127.0.0.1:3000`，由现有 Nginx 反向代理。示例：

```nginx
server {
  listen 80;
  server_name qixi.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

将 `qixi.example.com` 换成你的域名，再通过 Certbot 或既有的 Caddy 配置启用 HTTPS。当前数字网址可使用，但含实时助手时建议后续迁移到 HTTPS 子域名。
