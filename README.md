# 旅遊行程手冊：GitHub 無資料庫多人房號版

## 架構

- `index.html`：完整前端，保留原有版面/風格，並將旅遊資料與視圖分離。
- `data/rooms.txt`：GitHub 上的共同房號資料。
- `worker/worker.js`：Cloudflare Worker，唯一負責把導遊修改寫回 GitHub；不使用資料庫。
- `worker/wrangler.toml.example`：Worker 設定範例。

## 房號資料格式

```text
1|
2|302
3|303
...
15|
```

左邊是固定團員 ID，右邊是房號。

## 部署前必改

### 1. index.html

找到：

```js
writeEndpoint: 'https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/room'
```

改成實際 Cloudflare Worker `/room` 網址。

### 2. worker/worker.js

修改：

```js
owner: 'YOUR_GITHUB_OWNER',
repo: 'YOUR_GITHUB_REPO',
branch: 'main',
path: 'data/rooms.txt',
tourId: '26091304D',
```

### 3. Cloudflare Worker Secrets

建立：

- `GITHUB_TOKEN`：GitHub fine-grained token；至少需要該 Repository 的 Contents: write。只放 Cloudflare Worker Secret。
- 導遊密碼直接記錄在 `data/rooms.txt` 的 `# GUIDE_PASSWORD=...`。由於該檔案公開可讀，因此只適合低重要性用途。

### 4. CORS

將 `ALLOWED_ORIGIN` 設為 GitHub Pages 網址，例如：

```text
https://your-user.github.io
```

## 使用方式

- 一般團員：直接展開「團員房號分配表」即可查閱。
- 導遊：點「導遊修改」→輸入密碼→即可修改全部 15 位團員。
- 修改成功後會寫入 GitHub `data/rooms.txt`。
- 其他手機會在 15 秒輪詢中自動取得新資料，重新整理也會立即取得。
- 沒有導遊密碼的人永遠只能查閱，前端編輯模式也不會開啟。

## 個人資料

行前 Checklist 與日幣換算輸入仍保存在每台裝置自己的 localStorage，不會寫入 GitHub。
