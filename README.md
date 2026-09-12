# 26091304D 沖繩旅遊網站｜GitHub-only 版本

本版本不使用 Cloudflare、不使用資料庫。導遊不需要 GitHub 帳號，也不需要懂程式。

## GitHub Repository 結構

```text
index.html
README.md
data/
  tour.json
  rooms.txt
```

## 導遊操作方式

1. 開啟旅遊網站。
2. 點「團員房號分配表」展開。
3. 點右下角「導遊密碼」。
4. 輸入 `data/rooms.txt` 中的 `GUIDE_PASSWORD`。
5. 密碼正確後，一次編輯全部團員房號。
6. 點「儲存全部房號」。
7. 網頁會直接將 `rooms.txt` Commit 回 GitHub。
8. 其他團員重新整理或等待約 15 秒即可看到最新房號。

導遊不需要 GitHub 帳號。

## GitHub 一次性設定

### 1. 建立 `data/rooms.txt`

程式已提供範本。

### 2. 建立 Fine-grained Personal Access Token

GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens。

建議：

- Repository access：Only selected repository
- Repository：只選本旅遊 Repository
- Repository permissions：Contents = Read and write
- Expiration：設定旅遊結束前後的短期限

### 3. 把 Token 寫入 `data/rooms.txt`

將：

```text
# GITHUB_TOKEN=YOUR_FINE_GRAINED_GITHUB_TOKEN
```

改成真正 Token。

### 4. 設定 `data/tour.json`

找到：

```json
"github": {
  "owner": "YOUR_GITHUB_OWNER",
  "repo": "YOUR_GITHUB_REPOSITORY",
  "branch": "main",
  "roomsPath": "data/rooms.txt",
  "apiBase": "https://api.github.com"
}
```

只需填入 GitHub 帳號與 Repository 名稱。

### 5. GitHub Pages

將 Repository 的 GitHub Pages 指向 `main` branch / root。

## 安全性說明

這個方案刻意把 Token 放在公開 `rooms.txt`，因為你的需求是「臨時旅遊網站、方便導遊、不要求高安全性」。因此 Token 必須：

- 只授權這一個 Repository
- 只開 Contents: read/write
- 設定短期到期
- 旅遊結束後立即撤銷

不要把此方案拿去正式系統。

## 資料與視圖分離

`index.html` 負責 UI 與呈現；`data/tour.json` 負責旅遊內容；`data/rooms.txt` 負責全團共同房號。下一趟旅遊主要修改資料檔即可沿用同一套 UI。
