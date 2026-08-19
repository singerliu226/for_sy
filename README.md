# 今夜，银河为思怡降临

一张手机优先的七夕互动星图。照片放在 `public/photos/`，文字与照片顺序在 `app/page.tsx` 的 `memories` 中维护。

## 本地预览

```bash
npm run dev
```

## 部署到自己的服务器

服务器安装 Docker Compose 后，在项目目录运行：

```bash
docker compose up -d --build
```

网站会仅监听服务器本机的 `127.0.0.1:3000`，建议由现有 Nginx 或 Caddy 反向代理并签发 HTTPS 证书。Nginx 示例：

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

将 `qixi.example.com` 换成你的域名，再通过 Certbot 或既有的 Caddy 配置启用 HTTPS。若你把服务器 SSH 信息和域名告诉我，我可以继续完成上线。
