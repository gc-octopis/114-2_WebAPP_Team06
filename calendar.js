// ============================================================================
// ICS 檔案解析器
// ============================================================================

class ICSParser {
    constructor() {
        this.events = [];
    }

    async loadICS(filePath) {
        try {
            const response = await fetch(filePath);
            const text = await response.text();
            this.parseICS(text);
        } catch (error) {
            console.error('無法載入 ICS 檔案:', error);
        }
    }

    parseICS(content) {
        this.events = [];
        const eventBlocks = content.split('BEGIN:VEVENT');
        
        for (let i = 1; i < eventBlocks.length; i++) {
            const blockContent = 'BEGIN:VEVENT' + eventBlocks[i];
            const event = this.parseEvent(blockContent);
            if (event) {
                this.events.push(event);
            }
        }

        // 按日期排序事件
        this.events.sort((a, b) => {
            const dateA = new Date(a.dateStart);
            const dateB = new Date(b.dateStart);
            return dateA - dateB;
        });

        console.log('成功載入 ' + this.events.length + ' 個活動');
    }

    parseEvent(blockContent) {
        const event = {};

        // 打開 line folding（ICS 中長行會被折叠成多行，第二行以空白開頭）
        const unfolded = this.unfoldICSLines(blockContent);

        // 解析 SUMMARY (活動標題)
        const summaryMatch = unfolded.match(/SUMMARY:([^\r\n]+)/);
        if (summaryMatch) {
            event.summary = summaryMatch[1].trim();
        }

        // 解析 DTSTART (開始日期)
        const dtStartMatch = unfolded.match(/DTSTART[^:]*:(\d{8})/);
        if (dtStartMatch) {
            const dateStr = dtStartMatch[1];
            event.dateStart = this.parseICSDate(dateStr);
        }

        // 解析 DTEND (結束日期)
        const dtEndMatch = unfolded.match(/DTEND[^:]*:(\d{8})/);
        if (dtEndMatch) {
            const dateStr = dtEndMatch[1];
            event.dateEnd = this.parseICSDate(dateStr);
        }

        // 解析 LOCATION (地點)
        const locationMatch = unfolded.match(/LOCATION:([^\r\n]*)/);
        event.location = locationMatch ? locationMatch[1].trim() : '';

        // 解析 DESCRIPTION (描述)
        const descMatch = unfolded.match(/DESCRIPTION:([^\r\n]+)/);
        event.description = descMatch ? descMatch[1].trim() : '';

        return event.summary ? event : null;
    }

    unfoldICSLines(text) {
        // ICS 檔案中，超長的行會被折疊到多行
        // 折疊的行會在下一行以空白字符（空格或 tab）開頭
        // 需要將這些行展開（移除換行和前導空白）
        return text.replace(/\r?\n[ \t]/g, '');
    }

    parseICSDate(dateStr) {
        // 將 YYYYMMDD 轉換為 Date 物件
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6));
        const day = parseInt(dateStr.substring(6, 8));
        return new Date(year, month - 1, day);
    }

    getEventsForDate(date) {
        // 取得特定日期的活動
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => {
            const eventDateStr = event.dateStart.toISOString().split('T')[0];
            return eventDateStr === dateStr;
        });
    }

    getEventsForMonth(year, month) {
        // 取得特定月份的所有活動
        return this.events.filter(event => {
            return event.dateStart.getFullYear() === year && 
                   event.dateStart.getMonth() === month;
        });
    }
}

// ============================================================================
// 行事曆管理器
// ============================================================================

class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.parser = new ICSParser();
        this.selectedDate = null;
    }

    async init() {
        // 載入 ICS 檔案
        await this.parser.loadICS('asset/calendar.ics');
        
        // 初始化側邊欄日曆
        this.initSidebarCalendar();
        
        // 初始化主日曆（如果在行事曆頁面）
        if (document.getElementById('calendarDays')) {
            // 檢查 URL 參數是否有日期
            const params = new URLSearchParams(window.location.search);
            const dateParam = params.get('date');
            if (dateParam && dateParam.length === 8) {
                const year = parseInt(dateParam.substring(0, 4));
                const month = parseInt(dateParam.substring(4, 6)) - 1;
                const day = parseInt(dateParam.substring(6, 8));
                this.currentDate = new Date(year, month, day);
                this.selectedDate = new Date(year, month, day);
            }
            
            this.renderCalendar();
            this.setupEventListeners();
            
            // 如果有預設日期，顯示該日期的活動
            if (this.selectedDate) {
                this.showEventsForDate(this.selectedDate);
            }
        }
    }

    initSidebarCalendar() {
        // 取得側邊欄日曆元素
        const sidebarMonth = document.getElementById('sidebarMonth');
        const sidebarCalendar = document.getElementById('sidebarCalendar');
        
        if (!sidebarCalendar) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        // 更新月份文字
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月',
                           '7月', '8月', '9月', '10月', '11月', '12月'];
        sidebarMonth.textContent = year + '年 ' + monthNames[month];

        // 清空並重新渲染日曆
        sidebarCalendar.innerHTML = '';

        // 添加星期標題
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const dayElem = document.createElement('div');
            dayElem.className = 'calendar-day-header';
            dayElem.textContent = day;
            sidebarCalendar.appendChild(dayElem);
        });

        // 渲染日期
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // 前月的日期 (灰色)
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayElem = document.createElement('div');
            dayElem.className = 'calendar-day-inactive';
            dayElem.textContent = daysInPrevMonth - i;
            sidebarCalendar.appendChild(dayElem);
        }

        // 本月日期 (可點擊)
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElem = document.createElement('div');
            dayElem.className = 'calendar-day';
            dayElem.textContent = day;
            
            const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            const dateObj = new Date(year, month, day);
            
            // 檢查是否有活動
            const eventsOnDay = this.parser.getEventsForDate(dateObj);
            if (eventsOnDay.length > 0) {
                dayElem.classList.add('has-events');
            }
            
            // 標記今天
            if (dateObj.toDateString() === now.toDateString()) {
                dayElem.classList.add('calendar-day-active');
            }
            
            // 點擊日期跳轉到主日曆
            dayElem.addEventListener('click', () => {
                // 如果不在行事曆頁面，則導航到行事曆頁面並傳遞日期參數
                const isCalendarPage = document.getElementById('calendarDays') !== null;
                if (!isCalendarPage) {
                    window.location.href = 'calendar.html?date=' + String(year).padStart(4, '0') + 
                                          String(month + 1).padStart(2, '0') + 
                                          String(day).padStart(2, '0');
                } else {
                    // 在行事曆頁面上，直接更新日曆視圖
                    this.currentDate = new Date(year, month, day);
                    this.selectedDate = dateObj;
                    this.renderCalendar();
                    this.showEventsForDate(dateObj);
                }
            });
            
            sidebarCalendar.appendChild(dayElem);
        }

        // 下月的日期 (灰色)
        const totalCells = 7 + firstDay + daysInMonth;
        for (let day = 1; day <= (42 - firstDay - daysInMonth); day++) {
            const dayElem = document.createElement('div');
            dayElem.className = 'calendar-day-inactive';
            dayElem.textContent = day;
            sidebarCalendar.appendChild(dayElem);
        }
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // 更新標題
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月',
                           '7月', '8月', '9月', '10月', '11月', '12月'];
        document.getElementById('currentMonth').textContent = year + '年 ' + monthNames[month];

        // 清空日期網格
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        // 計算第一天是星期幾
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // 添加前月的日期
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayElem = document.createElement('div');
            dayElem.className = 'calendar-date inactive';
            dayElem.textContent = daysInPrevMonth - i;
            calendarDays.appendChild(dayElem);
        }

        // 添加本月日期
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElem = document.createElement('div');
            dayElem.className = 'calendar-date';
            
            const dateObj = new Date(year, month, day);
            
            // 標記今天
            if (dateObj.toDateString() === today.toDateString()) {
                dayElem.classList.add('today');
            }

            // 檢查是否有活動
            const eventsOnDay = this.parser.getEventsForDate(dateObj);
            if (eventsOnDay.length > 0) {
                dayElem.classList.add('has-events');
            }

            // 創建日期号码
            const dayNumber = document.createElement('span');
            dayNumber.className = 'date-number';
            dayNumber.textContent = day;
            dayElem.appendChild(dayNumber);

            // 添加活動指示器
            if (eventsOnDay.length > 0) {
                const eventIndicator = document.createElement('div');
                eventIndicator.className = 'event-indicator';
                eventIndicator.textContent = eventsOnDay.length;
                dayElem.appendChild(eventIndicator);
            }

            // 點擊日期顯示活動
            dayElem.addEventListener('click', () => {
                this.selectedDate = dateObj;
                this.showEventsForDate(dateObj);
                
                // 更新視覺焦點
                document.querySelectorAll('.calendar-date.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                dayElem.classList.add('selected');
            });

            calendarDays.appendChild(dayElem);
        }

        // 添加下月日期
        const totalCells = firstDay + daysInMonth;
        for (let day = 1; day <= (42 - totalCells); day++) {
            const dayElem = document.createElement('div');
            dayElem.className = 'calendar-date inactive';
            dayElem.textContent = day;
            calendarDays.appendChild(dayElem);
        }

        // 顯示本月的活動
        this.showEventsForMonth(year, month);
    }

    showEventsForDate(date) {
        const events = this.parser.getEventsForDate(date);
        const eventsList = document.getElementById('eventsList');
        
        eventsList.innerHTML = '';

        if (events.length === 0) {
            eventsList.innerHTML = '<p class="no-events">' + 
                                 date.toLocaleDateString('zh-TW') + 
                                 ' 沒有活動</p>';
            return;
        }

        const dateTitle = document.createElement('h3');
        dateTitle.className = 'events-date-title';
        dateTitle.textContent = date.toLocaleDateString('zh-TW');
        eventsList.appendChild(dateTitle);

        events.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            
            let html = '<div class="event-title">' + this.escapeHtml(event.summary) + '</div>';
            
            if (event.location) {
                html += '<div class="event-detail"><strong>地點:</strong> ' + 
                        this.escapeHtml(event.location) + '</div>';
            }
            
            html += '<div class="event-date">' + 
                    event.dateStart.toLocaleDateString('zh-TW') + '</div>';
            
            if (event.description) {
                html += '<div class="event-detail"><strong>說明:</strong> ' + 
                        this.escapeHtml(event.description) + '</div>';
            }
            
            eventItem.innerHTML = html;
            eventsList.appendChild(eventItem);
        });
    }

    showEventsForMonth(year, month) {
        // 此功能可選：在月份視圖下方顯示該月所有活動
        // 目前由日期點擊來驅動
    }

    setupEventListeners() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        prevBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        nextBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// ============================================================================
// 頁面載入
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const calendar = new CalendarManager();
    calendar.init();
});
