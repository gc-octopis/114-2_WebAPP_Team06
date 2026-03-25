# Calendar 前後端分離架構實現文檔

## 概述
本文檔說明如何將 Calendar Events 從靜態ICS檔案遷移到後端資料庫，實現完整的前後端分離。

## 架構變更

### 舊架構
```
Frontend (靜態ICS檔案)
├── calendar.ics (中文)
└── calendar.en.ics (英文)
     ↓
Calendar.jsx / SideBar.jsx
     ↓
ICSParser (客戶端解析)
```

### 新架構
```
Backend (資料庫)
└── CalendarEvent Model
     ↓
     API: GET /api/calendar/?lang=zh|en
     ↓
Frontend (API呼叫)
└── Calendar.jsx / SideBar.jsx
     ↓
     CalendarEventAPI (HTTP client)
```

## 後端改造

### 1. Django App 建立
- **App名稱**: `events` (避免與Python標庫`calendar`衝突)
- **位置**: `Backend/events/`

### 2. 資料庫Model
檔案: `Backend/events/models.py`

```python
class CalendarEvent(models.Model):
    language = CharField(choices=[('zh', '中文'), ('en', 'English')])
    summary = CharField(max_length=500)           # 事件標題
    date_start = DateField()                      # 開始日期
    date_end = DateField(blank=True, null=True)   # 結束日期
    location = CharField(max_length=500)          # 地點
    description = TextField()                     # 描述
    uid = CharField(unique=True)                  # 唯一識別符
```

### 3. REST API
檔案: `Backend/events/views.py`

**Endpoint**: `GET /api/calendar/`

**查詢參數**:
- `lang`: 'zh' 或 'en' (必填)
- `start_date`: 'YYYY-MM-DD' (可選)
- `end_date`: 'YYYY-MM-DD' (可選)

**響應格式**:
```json
{
    "count": 297,
    "language": "zh",
    "events": [
        {
            "id": 1,
            "summary": "校園馬拉松賽",
            "dateStart": "2025-03-29",
            "dateEnd": "2025-03-30",
            "location": "",
            "description": ""
        }
    ]
}
```

### 4. 資料同步腳本修改

#### calendar_zh_builder.py
- **來源**: OWA 已發佈日曆 (https://mail.ntu.edu.tw/owa/calendar/.../calendar.ics)
- **操作**: 下載ICS → 解析事件 → 存入資料庫
- **指令**: `python scripts/calendar_zh_builder.py`

#### calendar_en_builder.py
- **來源**: acaEN 行事曆 Excel (xls/xlsx)
- **操作**: 下載Excel → 解析行 → 存入資料庫
- **指令**: `python scripts/calendar_en_builder.py`

**兩個腳本的改變**:
1. 添加 Django 初始化代碼 (`os.environ.setdefault`, `django.setup()`)
2. 移除ICS檔案寫入邏輯
3. 添加 `CalendarEvent.objects.update_or_create()` 寫入資料庫
4. 移除 `--output` 參數

### 5. 資料庫遷移
```bash
python manage.py makemigrations events
python manage.py migrate
```

## 前端改造

### 1. 新API Service
檔案: `Frontend/src/calendarAPI.js`

主要方法:
- `CalendarEventAPI.getEvents(lang, options)` - 獲取所有events
- `CalendarEventAPI.getEventsForDate(date, lang)` - 獲取特定日期的events
- `CalendarEventAPI.getEventsForMonth(year, month, lang)` - 獲取月份events

### 2. Calendar.jsx 修改
- ❌ 移除 `ICSParser` 依賴
- ✅ 添加 `CalendarEventAPI` 導入
- ✅ 使用 `useEffect` 在組件掛載時從API獲取events
- ✅ 添加 `loading` 狀態指示
- ✅ 將ISO date字符串轉換為Date對象 (parseDate helper)

### 3. SideBar.jsx 修改
- ❌ 移除 `ICSParser` 依賴
- ✅ 添加 `CalendarEventAPI` 導入
- ✅ 僅載入當月份的events（最佳化）
- ✅ 使用 `hasEventsOnDate()` 檢查日期是否有events

## CORS 設定

`Backend/core/settings.py` 已配置允許以下源:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",      # Vite 開發伺服器
    "http://127.0.0.1:5173",
]
```

開發時無需額外配置。部署時應更新為實際的前端URL。

## 開發工作流程

### 啟動開發環境

**終端1 - 後端**:
```bash
cd Backend
source .venv/bin/activate
python manage.py runserver 8000
```

**終端2 - 前端**:
```bash
cd Frontend
npm run dev
```

### 同步資料

```bash
cd Backend
source .venv/bin/activate

# 同步中文calendar到資料庫
python scripts/calendar_zh_builder.py

# 同步英文calendar到資料庫  
python scripts/calendar_en_builder.py

# 查看同步結果
curl "http://localhost:8000/api/calendar/?lang=zh" | jq '.count'
curl "http://localhost:8000/api/calendar/?lang=en" | jq '.count'
```

## 數據驗證

### 資料庫檢查
```bash
cd Backend
python manage.py shell

from events.models import CalendarEvent
CalendarEvent.objects.filter(language='zh').count()  # 應返回 297
CalendarEvent.objects.filter(language='en').count()  # 應返回 149
```

### API 測試
```bash
# 獲取中文events總數
curl "http://localhost:8000/api/calendar/?lang=zh" | jq '.count'

# 獲取特定日期範圍的中文events
curl "http://localhost:8000/api/calendar/?lang=zh&start_date=2025-03-28&end_date=2025-03-31" | jq '.count'

# 獲取英文events
curl "http://localhost:8000/api/calendar/?lang=en" | jq '.count'
```

## 效能考慮

### 優化
1. **日期索引**: `date_start` 和 `date_start+date_end` 組合索引加快查詢
2. **語言過濾**: API層面就過濾語言避免無謂傳輸
3. **月份級別同步**: 前端Calendar.jsx只載入當月events
4. **複合索引**: `(language, date_start)` 索引針對最常見查詢

### 未來優化
- [ ] 實現分頁（如果events數量增長）
- [ ] 添加事件快取（Redis）
- [ ] 實現WebSocket推送更新（實時日曆同步）
- [ ] 添加事件搜尋功能

## 已知限制與未來改進

### 當前
- ICSParser.js 仍存在於前端，但已不使用（可選）
- 靜態ICS檔案（calendar.ics/.en.ics）不再更新（可選）

### 建議移除
如不再需要ICS檔案支持，可移除：
1. `Frontend/src/icsParser.js`
2. `Frontend/public/calendar.ics` 和 `calendar.en.ics`

### 未來功能
- [ ] 事件提醒功能
- [ ] 個人化日曆訂閱
- [ ] 多語言支持擴展
- [ ] iCal 匯出功能

## 故障排除

### API 無法連接
1. 確認Django伺服器運行: `python manage.py runserver 8000`
2. 檢查CORS設定: 
   ```bash
   curl -i "http://localhost:8000/api/calendar/?lang=zh"
   ```
3. 查看瀏覽器console是否有CORS錯誤

### 日期查詢無結果
- 檢查日期格式是否為 `YYYY-MM-DD`
- 查詢資料庫中實際的日期範圍:
  ```bash
  python manage.py shell
  from events.models import CalendarEvent
  CalendarEvent.objects.filter(language='zh').values_list('date_start', flat=True).first()
  CalendarEvent.objects.filter(language='zh').values_list('date_start', flat=True).last()
  ```

### 資料不同步
1. 確認虛擬環境啟動: `source .venv/bin/activate`
2. 檢查Django設定: `echo $DJANGO_SETTINGS_MODULE`
3. 手動運行同步腳本並查看輸出:
   ```bash
   python scripts/calendar_zh_builder.py -v  # (如果支援)
   ```
