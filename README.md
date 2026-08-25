# 魔丸小助手

给思怡的上海生活地图，以及慢慢收好的纪念日。

- `/`：魔丸小助手首页
- `/guide`：日常攻略与“魔丸小助手”搜索
- `/anniversaries`：纪念日归档
- `/anniversaries/qixi`：完整保留的七夕互动星图

攻略资料维护在 `data/guide.ts`。思怡的收藏、完成状态、备注与有限轮次对话仅保存在浏览器本机。

## 本地预览

```bash
npm run dev
```

## 魔丸小助手的联网能力

不配置 key 时，助手会始终从本地攻略资料库回答。若要启用 DeepSeek 的实时网页检索，在服务器创建仅 root 可读的 `/etc/qixi-siyi.env`：

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
