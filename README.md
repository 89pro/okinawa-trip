# GitHub 無資料庫旅遊行程框架

## 架構

- `index.html`：固定 UI / Tailwind / Font Awesome / JavaScript 視圖框架
- `data/tour.json`：航班、行程、住宿、團員、聯絡資訊、工具等旅遊資料
- `data/rooms.txt`：全團共同房號資料；導遊密碼也依需求記錄於此

不使用資料庫、不使用 Cloudflare、不使用 API Token。

## GitHub 使用方式

1. 將整個資料夾放入 GitHub Repository。
2. 開啟 GitHub Pages。
3. 網頁讀取 `data/tour.json` 與 `data/rooms.txt`。
4. 一般團員僅需瀏覽 GitHub Pages。
5. 導遊需要修改房號時，直接在 GitHub 編輯 `data/rooms.txt` 後 Commit changes。
6. 其他手機會自動每 15 秒重新讀取一次，或在房號表按「重新讀取」。

## rooms.txt 格式

```text
# GUIDE_PASSWORD=26091304
1|林X塗|301
2|林X福|302
3|林X雄|
```

注意：因為密碼位於公開文字檔，這不是安全認證，只是防君子用途。真正的 GitHub 修改權限仍由 GitHub 帳號權限控制。

## 導遊修改按鈕

若網站是標準 GitHub Pages 網址，例如：

`https://OWNER.github.io/REPO/`

程式會自動推導 `https://github.com/OWNER/REPO/edit/main/data/rooms.txt`。

若 Repository 名稱或 branch 不同，直接在 `index.html` 的：

```javascript
const GITHUB_EDIT_URL = '';
```

填入實際的 GitHub `rooms.txt` 編輯網址。

## 未來更換旅遊團

正常只需要修改：

- `data/tour.json`
- `data/rooms.txt`

不需要修改 UI、Tailwind、CSS、主要 JavaScript。
