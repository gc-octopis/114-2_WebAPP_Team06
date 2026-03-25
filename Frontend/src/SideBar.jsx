import { UseLinkContext } from "./LinkContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ICSParser } from "./icsParser";

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function SideBar({ toggled = false }) {
    const toggledClass = toggled ? ' toggled' : '';
    const navigate = useNavigate();
    const location = useLocation();
    const { categories, activeCatIdx, setActiveCatIdx } = UseLinkContext();

    const [events, setEvents] = useState([]);
    const [parser] = useState(new ICSParser());
    
    // 側邊欄固定顯示當前真實時間的月份
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    useEffect(() => {
        parser.loadICS('calendar.ics').then(() => {
            setEvents([...parser.events]);
        });
    }, [parser]);

    const miniCalendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const days = [];
        
        // 上個月
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
        }
        
        // 本月
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const hasEvents = parser.getEventsForDate(dateObj).length > 0;
            const isToday = now.toDateString() === dateObj.toDateString();
            
            days.push({ day, isCurrentMonth: true, dateObj, hasEvents, isToday });
        }
        
        // 下個月
        const remaining = 42 - days.length;
        for (let day = 1; day <= remaining; day++) {
            days.push({ day, isCurrentMonth: false });
        }
        
        return days;
    }, [year, month, events, parser]);

    const handleDayClick = (dateObj) => {
        const y = String(dateObj.getFullYear()).padStart(4, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        
        navigate(`/calendar?date=${y}${m}${d}`);
    };

    return (
        <aside className={'sidebar-wrapper' + toggledClass}>
            {/* 1. 搜尋區*/}
            <div className="sidebar-header">
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input type="text" placeholder="搜尋" className="search-input"/>
            </div>

            {/* 2. 導覽區：分類按鈕由 favorites.js 動態填充*/}
            <nav className="sidebar-nav" id="categoryNav">
                {
                    categories.map((cat, index) => 
                        <button className={"cat-btn" + (index === activeCatIdx ? ' active' : '')} key={index}
                                onClick={() => {
                                    navigate(`/?cat=${cat.id}`);
                                    setActiveCatIdx(index);}}>
                            <span className="cat-btn-icon">{cat.icon}</span>
                            <span className="cat-btn-label">{cat.label}</span>
                        </button>
                    )
                }
                
            </nav>
            
            <div className="sidebar-footer">
                <div className="calendar-month">{year}年 {monthNames[month]}</div>
                <div className="calendar-grid">
                    {/* 星期標題 */}
                    {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                        <div key={d} className="calendar-day-header">{d}</div>
                    ))}
                    
                    {/* 日期網格 */}
                    {miniCalendarDays.map((d, idx) => (
                        <div 
                            key={idx}
                            className={
                                !d.isCurrentMonth ? 'calendar-day-inactive' : 
                                `calendar-day ${d.isToday ? 'calendar-day-active' : ''} ${d.hasEvents ? 'has-events' : ''}`
                            }
                            onClick={() => d.isCurrentMonth && handleDayClick(d.dateObj)}
                        >
                            {d.day}
                        </div>
                    ))}
                </div>
                <Link to="/calendar" className="calendar-link">行事曆</Link>
            </div>
        </aside>
    );
}

export default SideBar;