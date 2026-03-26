export const examResultPrompt = `
你是一個資料轉換助手。請將以下 CSV 資料轉換為 JSON 格式。

目標 JSON 結構：
{
  "title": "榮譽榜標題（從資料推斷或使用預設'大考成績榜'）",
  "subtitle": "副標題（若無則留空字串）",
  "students": [
    {
      "subject": "科目（如英文、數學、社會、自然）",
      "juniorHighSchool": "國中名稱",
      "studentName": "學生姓名",
      "seniorHighSchool": "錄取高中名稱"
    }
  ]
}

規則：
- 若找不到對應欄位，請回傳純文字說明原因（不要回傳 JSON）
- 所有欄位值必須為字串
- students 陣列不可為空

CSV 資料如下：
`.trim()
