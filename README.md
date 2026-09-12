# 沖繩旅遊網站：GitHub + Google Apps Script（無資料庫）

## 架構
- `index.html`：固定 UI 與視圖。
- `data/tour.json`：旅遊內容與 Google Apps Script Web App URL。
- `data/rooms.txt`：公開共同房號與導遊密碼；**不放 GitHub Token**。
- `Code.gs`：Google Apps Script Web App；GitHub Token 僅放在 Script Properties。

## 1. GitHub
將下列檔案放入 Repository：
```
index.html
data/tour.json
data/rooms.txt
```

## 2. Google Apps Script Script Properties
在 Apps Script：Project Settings → Script properties，新增：
- `GITHUB_TOKEN` = GitHub Fine-grained PAT
- `GITHUB_OWNER` = `89pro`
- `GITHUB_REPO` = `okinawa-trip`
- `GITHUB_BRANCH` = `main`
- `ROOMS_PATH` = `data/rooms.txt`

GitHub Token 建議只授權 `89pro/okinawa-trip`，Repository permission 只給 `Contents: Read and write`，並設較短到期。GitHub 官方的 Contents API 更新既有檔案需要 `sha`，程式會自動取得最新 `sha`。

## 3. Apps Script 程式
把 `Code.gs` 全部貼入 Apps Script。

## 4. 部署
Deploy → New deployment → Web app：
- Execute as：Me（部署者）
- Who has access：Anyone

部署後複製 `/exec` URL，確認 `data/tour.json` 的 `appsScriptUrl` 相同。

直接用瀏覽器開啟：
`https://script.google.com/macros/s/你的部署ID/exec?action=ping`
應看到 JSON，且 `ok` 為 `true`。

## 5. 房號操作
一般團員：直接查看房號。
導遊：團員房號分配表 → 導遊密碼 → 輸入正確密碼 → 一次修改全部房號 → 儲存全部房號。

## 6. 重要
- 導遊不需要 GitHub 帳號。
- 房號查閱不需要 Token。
- Token 只存在 Apps Script Script Properties。
- 本方案沒有資料庫。
- 旅遊結束後可撤銷 GitHub Token 並刪除 Apps Script Web App。
