import Layout from "./Layout";
import './calendar.css';
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ICSParser } from "./icsParser"; // 引入剛才建立的工具

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function Calendar() {
    const title = "行事曆";
    const [searchParams] = useSearchParams();
    
    // 狀態管理
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [events, setEvents] = useState([]);
    const [parser] = useState(new ICSParser());

    useEffect(() => {
        document.title = "MyNTU++ | " + title;
        
        // 解析 URL 參數中的日期
        const dateParam = searchParams.get('date');
        if (dateParam && dateParam.length === 8) {
            const year = parseInt(dateParam.substring(0, 4));
            const month = parseInt(dateParam.substring(4, 6)) - 1;
            const day = parseInt(dateParam.substring(6, 8));
            const initDate = new Date(year, month, day);
            setCurrentDate(initDate);
            setSelectedDate(initDate);
        }

        // 載入 ICS 檔案
        parser.loadICS('calendar.ics').then(() => {
            // 強制觸發重新渲染以顯示載入後的事件
            setEvents([...parser.events]); 
        });
    }, [searchParams, parser]);

    // 切換月份
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // 計算日曆網格資料
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const days = [];
        
        // 上個月的日期
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
        }
        
        // 這個月的日期
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dayEvents = parser.getEventsForDate(dateObj);
            const isToday = new Date().toDateString() === dateObj.toDateString();
            const isSelected = selectedDate?.toDateString() === dateObj.toDateString();
            
            days.push({ day, isCurrentMonth: true, dateObj, dayEvents, isToday, isSelected });
        }
        
        // 下個月的日期
        const remaining = 42 - days.length;
        for (let day = 1; day <= remaining; day++) {
            days.push({ day, isCurrentMonth: false });
        }
        
        return days;
    }, [currentDate, events, selectedDate, parser]);

    const selectedEvents = useMemo(() => parser.getEventsForDate(selectedDate), [selectedDate, events, parser]);

    return (
        <Layout title={title}>
            <div className="calendar-content">
                <section className="calendar-controls">
                    <button onClick={prevMonth} className="calendar-nav-btn">← 前月</button>
                    <h1 className="calendar-title">{currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}</h1>
                    <button onClick={nextMonth} className="calendar-nav-btn">後月 →</button>
                </section>

                <section className="calendar-month-view">
                    <div className="calendar-weekdays">
                        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                            <div key={day} className="weekday">{day}</div>
                        ))}
                    </div>
                    <div className="calendar-days">
                        {calendarDays.map((d, idx) => (
                            <div 
                                key={idx} 
                                className={`calendar-date 
                                    ${!d.isCurrentMonth ? 'inactive' : ''} 
                                    ${d.isToday ? 'today' : ''} 
                                    ${d.isSelected ? 'selected' : ''} 
                                    ${d.dayEvents?.length > 0 ? 'has-events' : ''}`}
                                onClick={() => d.isCurrentMonth && setSelectedDate(d.dateObj)}
                            >
                                <span className="date-number">{d.day}</span>
                                {d.dayEvents?.length > 0 && (
                                    <div className="event-indicator">{d.dayEvents.length}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="events-section">
                    <h2 className="section-title">活動清單</h2>
                    <div className="events-list">
                        {!selectedDate ? (
                            <p className="no-events">選擇日期查看活動</p>
                        ) : selectedEvents.length === 0 ? (
                            <p className="no-events">{selectedDate.toLocaleDateString('zh-TW')} 沒有活動</p>
                        ) : (
                            <>
                                <h3 className="events-date-title">{selectedDate.toLocaleDateString('zh-TW')}</h3>
                                {selectedEvents.map((ev, i) => (
                                    <div key={i} className="event-item">
                                        <div className="event-title">{ev.summary}</div>
                                        {ev.location && <div className="event-detail"><strong>地點:</strong> {ev.location}</div>}
                                        <div className="event-date">{ev.dateStart.toLocaleDateString('zh-TW')}</div>
                                        {ev.description && <div className="event-detail"><strong>說明:</strong> {ev.description}</div>}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </section>
            </div>
        </Layout>
    );
}

export default Calendar;