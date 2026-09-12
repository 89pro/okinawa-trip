# GitHub-only 旅遊行程手冊

## 檔案
- `index.html`：固定 UI + 視圖程式，不放旅遊硬編碼資料。
- `data/tour.json`：團號、航班、行程、住宿、團員、Checklist、工具。
- `data/rooms.txt`：全團共同房號與導遊密碼。

## 房號修改
一般團員：只能查閱。

導遊：在網頁「團員房號分配表」按「導遊修改全部房號」，輸入 `data/rooms.txt` 的 `GUIDE_PASSWORD` 後，一次編輯 15 位團員，再按「完成並更新 GitHub」。網頁會整理完整 `rooms.txt`、複製到剪貼簿並下載備份，接著開啟 GitHub 對該檔案的編輯頁。導遊在 GitHub 按 `Commit changes` 即完成共同資料更新。

## 重要限制
純 GitHub / GitHub Pages 架構沒有後端，因此網頁不能代替導遊執行 GitHub Commit。真正的寫入權限仍由導遊自己的 GitHub 帳號控制。

## 部署
將本資料夾內容推送到 GitHub Repository，開啟 GitHub Pages。若 Repository 不是標準 `OWNER.github.io/REPO` 形式，可在 `data/tour.json` 的 `repository.roomsEditUrl` 填入該 `rooms.txt` 的 GitHub 編輯網址。
