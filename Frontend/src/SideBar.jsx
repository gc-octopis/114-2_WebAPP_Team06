import { UseLinkContext } from "./LinkContext";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { CalendarEventAPI } from "./calendarAPI";
import { useText, useLanguage, getLocalizedCategoryLabel } from "./LanguageContext";
import { useDraggable } from "@dnd-kit/core";
import { getLocalizedValue } from "./LanguageContext";
import './SideBar.css';

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function DraggableSearchResult({ item, lang }) {
    const linkLabel = getLocalizedValue(item, lang, "label", "");
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        // Using 'fav-' prefix allows LinkContext to treat this as a pinnable item
        id: `fav-search-${item.url}`, 
        data: { item },
    });

    const style = {
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? "grabbing" : "grab",
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="search-result-item">
            <img src={item.icon} alt="" className="search-result-icon" />
            <div className="search-result-info">
                <div className="search-result-label">{linkLabel}</div>
            </div>
        </div>
    );
}

function SideBar({ toggled = false }) {
    const { lang } = useLanguage();
    const t = useText();
    const toggledClass = toggled ? ' toggled' : '';
    const navigate = useNavigate();
    const { categories, activeCatIdx, setActiveCatIdx } = UseLinkContext();

    const [events, setEvents] = useState([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // 側邊欄固定顯示當前真實時間的月份
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Helper function to parse API date string to Date object
    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    useEffect(() => {
        // 從API載入該月份的events
        CalendarEventAPI.getEventsForMonth(year, month, lang).then(apiEvents => {
            // Convert API events to internal format
            const convertedEvents = apiEvents.map(evt => ({
                ...evt,
                dateStart: parseDate(evt.dateStart),
            }));
            setEvents(convertedEvents);
        });
    }, [year, month, lang]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`http://localhost:8000/api/search/?q=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Helper function to check if a date has events
    const hasEventsOnDate = (dateObj) => {
        const dateStr = dateObj.toISOString().split('T')[0];
        return events.some(event => event.dateStart.toISOString().split('T')[0] === dateStr);
    };

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
            const hasEvents = hasEventsOnDate(dateObj);
            const isToday = now.toDateString() === dateObj.toDateString();
            
            days.push({ day, isCurrentMonth: true, dateObj, hasEvents, isToday });
        }
        
        // 下個月
        const remaining = 42 - days.length;
        for (let day = 1; day <= remaining; day++) {
            days.push({ day, isCurrentMonth: false });
        }
        
        return days;
    }, [year, month, events]);

    const handleDayClick = (dateObj) => {
        const y = String(dateObj.getFullYear()).padStart(4, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        
        navigate(`/calendar?date=${y}${m}${d}`);
    };

    return (
        <aside className={'sidebar-wrapper' + toggledClass}>
            {/* 1. 搜尋區*/}
            <div className="sidebar-header" style={{ position: 'relative' }}>
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input 
                    type="text" 
                    placeholder={t.searchPlaceholder} 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Floating Search Results */}
                {searchQuery && (
                    <div className="search-results-float">
                        {isSearching ? (
                            <div className="search-status">Searching...</div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((item) => (
                                <DraggableSearchResult 
                                    key={item.url} 
                                    item={item} 
                                    lang={lang} 
                                />
                            ))
                        ) : (
                            <div className="search-status">No results found</div>
                        )}
                    </div>
                )}
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
                            <span className="cat-btn-label">{getLocalizedCategoryLabel(cat, lang)}</span>
                        </button>
                    )
                }
                
            </nav>
            
            <div className="sidebar-footer">
                <div className="calendar-month">{lang === 'en' ? `${monthNamesEn[month]} ${year}` : `${year}年 ${monthNames[month]}`}</div>
                <div className="calendar-grid">
                    {/* 星期標題 */}
                    {(lang === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['日', '一', '二', '三', '四', '五', '六']).map((d, idx) => (
                        <div key={`${lang}-weekday-${idx}`} className="calendar-day-header">{d}</div>
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
                <Link to="/calendar" className="calendar-link">{t.calendar}</Link>
            </div>
        </aside>
    );
}

export default SideBar;