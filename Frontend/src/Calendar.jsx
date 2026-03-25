import Layout from "./Layout";
import './calendar.css';
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarEventAPI } from "./calendarAPI";
import { useLanguage, useText } from "./LanguageContext";

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function Calendar() {
    const { lang } = useLanguage();
    const t = useText();
    const title = t.calendar;
    const [searchParams] = useSearchParams();
    
    // 狀態管理
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Helper function to parse API date string to Date object
    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Fetch events when language or month changes
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

        // 從API載入該月份的events
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        CalendarEventAPI.getEventsForMonth(year, month, lang).then(apiEvents => {
            // Convert API events to internal format
            const convertedEvents = apiEvents.map(evt => ({
                ...evt,
                dateStart: parseDate(evt.dateStart),
                dateEnd: evt.dateEnd ? parseDate(evt.dateEnd) : null,
            }));
            setEvents(convertedEvents);
            setLoading(false);
        });
    }, [currentDate, lang, searchParams, title]);

    // 切換月份
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Helper function to get events for a specific date
    const getEventsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(event => event.dateStart.toISOString().split('T')[0] === dateStr);
    };

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
            const dayEvents = getEventsForDate(dateObj);
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
    }, [currentDate, events, selectedDate]);

    const selectedEvents = useMemo(() => getEventsForDate(selectedDate), [selectedDate, events]);

    return (
        <Layout title={title}>
            <div className="calendar-content">
                {loading && <div className="loading-indicator">{t.loading || 'Loading...'}</div>}
                
                <section className="calendar-controls">
                    <button onClick={prevMonth} className="calendar-nav-btn">← {t.prevMonth}</button>
                    <h1 className="calendar-title">{lang === 'en' ? `${monthNamesEn[currentDate.getMonth()]} ${currentDate.getFullYear()}` : `${currentDate.getFullYear()}年 ${monthNames[currentDate.getMonth()]}`}</h1>
                    <button onClick={nextMonth} className="calendar-nav-btn">{t.nextMonth} →</button>
                </section>

                <section className="calendar-month-view">
                    <div className="calendar-weekdays">
                        {(lang === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['日', '一', '二', '三', '四', '五', '六']).map(day => (
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
                    <h2 className="section-title">{t.eventList}</h2>
                    <div className="events-list">
                        {!selectedDate ? (
                            <p className="no-events">{t.selectDateHint}</p>
                        ) : selectedEvents.length === 0 ? (
                            <p className="no-events">{selectedDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-TW')} {t.noEventsOnDate}</p>
                        ) : (
                            <>
                                <h3 className="events-date-title">{selectedDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-TW')}</h3>
                                {selectedEvents.map((ev, i) => (
                                    <div key={i} className="event-item">
                                        <div className="event-title">{ev.summary}</div>
                                        {ev.location && <div className="event-detail"><strong>{t.location}:</strong> {ev.location}</div>}
                                        <div className="event-date">{ev.dateStart.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-TW')}</div>
                                        {ev.description && <div className="event-detail"><strong>{t.description}:</strong> {ev.description}</div>}
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
