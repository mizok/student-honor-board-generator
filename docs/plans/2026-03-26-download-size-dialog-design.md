# Download Size Dialog Design

## Goal

將預覽頁面上的匯出尺寸選擇，從 header 常駐控制改成下載前的確認 dialog，讓 toolbar 更精簡，並維持既有 PDF / PNG 匯出尺寸能力。

## Scope

- `PDF`、`PNG` 下載前先開 dialog 選擇尺寸
- `HTML` 下載維持直接下載
- 移除 header 上的尺寸 `SelectButton`
- 尺寸狀態仍沿用 `BoardService.exportWidth`

## Interaction

1. 使用者點擊 `下載 PDF` 或 `下載 PNG`
2. 畫面開啟 modal dialog
3. dialog 顯示目前要下載的格式與尺寸選項 `800 / 1024 / 1280 / 1920`
4. 使用者按下確認後才開始下載
5. 取消則關閉 dialog，不執行下載

## Component Design

變更集中在 `PreviewComponent`：

- 新增 dialog 顯示狀態
- 新增待下載格式狀態
- `SplitButton` 主按鈕與 menu item 都改為先呼叫 `openDownloadDialog(format)`
- dialog 內使用 PrimeNG `DialogModule` + `SelectButtonModule`
- 確認按鈕呼叫既有 `ExportService`

## Data Flow

- `board.exportWidth()` 作為 dialog 的目前選值
- dialog 內改變尺寸時直接寫回 `board.exportWidth`
- 確認下載時根據 pending format 決定：
  - `pdf` -> `downloadPdf(el, board.exportWidth())`
  - `png` -> `downloadPng(el, board.exportWidth())`
  - `html` -> `downloadHtml(el)`

## Error Handling

- 若找不到 `app-template-outlet`，維持現有錯誤提示
- 若匯出失敗，維持現有 toast
- dialog 在確認下載前不先關閉；只有成功進入下載流程時才關閉，避免使用者誤以為沒反應

## Testing

- 補 `PreviewComponent` 規格測試
- 驗證 `PDF` / `PNG` 會先進 dialog，不會立刻呼叫 `ExportService`
- 驗證 `HTML` 仍直接下載
- 驗證 dialog 確認後會帶目前 `exportWidth`
