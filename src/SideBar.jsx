import { UseLinkContext } from "./LinkContext";
import { Link, useNavigate } from "react-router-dom";

function SideBar({toggled = false})
{
    const toggledClass = toggled ? ' toggled' : '';
    const navigate = useNavigate();
    const { categories, activeCatIdx, setActiveCatIdx } = UseLinkContext();

    return (
    <>
        {/* 左側 sidebar*/}
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

            {/* 3. 日曆區*/}
            <div className="sidebar-footer">
                <div className="calendar-month" id="sidebarMonth">MAR 2026</div>
                <div className="calendar-grid" id="sidebarCalendar">
                    {/* 由 JavaScript 填充*/}
                </div>
                <Link to="/calendar" className="calendar-link">行事曆</Link>
            </div>

        </aside>
    </>
    )
}

export default SideBar;