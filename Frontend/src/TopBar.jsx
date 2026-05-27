import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage, useText, getLocalizedValue } from "./LanguageContext";
import { useAuth } from './AuthContext';
import { UseLinkContext } from "./LinkContext";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const THEME_STORAGE_KEY = "myntu_theme";

// 單一個可排序的釘選項目
function SortablePinItem({ item, lang, onRemove, isHighlighted, isGrayedOut }) {
    const linkLabel = getLocalizedValue(item, lang, "label", "");
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.url,
        data: { item },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : isGrayedOut ? 0.3 : 1,
        height: isDragging ? 0 : undefined,
        overflow: isDragging ? "hidden" : undefined,
        outline: isHighlighted ? "2px solid var(--primary-color)" : undefined,
        borderRadius: isHighlighted ? "0.4rem" : undefined,
        background: isHighlighted ? "var(--primary-light)" : undefined,
    };

    return (
        <a
            ref={setNodeRef}
            style={style}
            href={isDragging ? undefined : item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="pinned-link-item"
            onClick={isDragging ? (e) => e.preventDefault() : undefined}
            {...attributes}
            {...listeners}
        >
            <span style={{ display: "flex", alignItems: "center", gap: "8px", pointerEvents: "none" }}>
                <img src={item.icon} alt={linkLabel} style={{width: "16px", height: "16px"}} />
                {linkLabel}
            </span>
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(item.url); }}
                className="remove-pin-btn"
                title={lang === "en" ? "Remove pin" : "移除釘選"}
                // 按鈕不傳遞拖曳事件
                onPointerDown={(e) => e.stopPropagation()}
            >
                ✕
            </button>
        </a>
    );
}

// 空選單時的 droppable 容器
function EmptyDropZone({ lang }) {
    const { setNodeRef, isOver } = useDroppable({ id: "pinned-dropzone" });
    return (
        <div
            ref={setNodeRef}
            className="empty-pin-placeholder"
            style={isOver ? { borderColor: "var(--primary-color)", background: "var(--primary-light)" } : {}}
        >
            {lang === "en" ? "Drop here to pin" : "放開以釘選捷徑"}
        </div>
    );
}

function TopBar({setSideBarToggled, title})
{
    const { lang, toggleLanguage } = useLanguage();
    const t = useText();
    const auth = useAuth();
    const navigate = useNavigate();
    const authApiBase = import.meta.env.VITE_AUTH_API_BASE || '';
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        if (typeof window === "undefined") {
            return false;
        }

        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
            return savedTheme === "dark";
        }

        return document.body.classList.contains("dark");
    });
    const { pinnedLinks, updatePinnedLinks, activeItem, dragOverPinnedUrl, isDuplicateDrag, duplicateUrl, isAuthed } = UseLinkContext();
    const canPin = !!auth?.user && !!isAuthed;

    const isFromFavorites = activeItem !== null && !pinnedLinks.some(l => l.url === activeItem.url);
    const isDragging = activeItem !== null;

    const handleRemovePin = (urlToRemove) => {
        const newPins = pinnedLinks.filter(link => link.url !== urlToRemove);
        updatePinnedLinks(newPins);
    };

    useEffect(() => {
        document.body.className = isDarkTheme ? "dark" : "light";
        window.localStorage.setItem(THEME_STORAGE_KEY, isDarkTheme ? "dark" : "light");
    }, [isDarkTheme]);

    const pinnedIds = pinnedLinks.map(l => l.url);

    const emailPrefix = auth && auth.user && auth.user.email
        ? (auth.user.email.split('@')[0] || '')
        : (auth && auth.user && auth.user.name ? auth.user.name.split('@')[0] : '');

    return (
    <>
    {/*上方佈局：工具列 (Topbar)*/}

    <header className="topbar">

        {/*1. 左側按鈕區*/}
        <div className="topbar-actions">
            {/*漢堡按鈕*/}
            <button id="hamburger-btn" className="icon-btn" aria-label={lang === "en" ? "Open sidebar" : "開啟側邊欄"} onClick={() => setSideBarToggled(prev => !prev)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>

            {/*首頁按鈕*/}
            <Link to="/" className="icon-btn" aria-label={lang === "en" ? "Home" : "回首頁"}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
            </Link>

            {/*YouBike 按鈕*/}
            <Link to="/youbike" className="icon-btn" aria-label={lang === "en" ? "YouBike" : "YouBike 即時車況"}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="6.5" cy="17" r="3.5" strokeWidth="2"></circle>
                    <circle cx="17.5" cy="17" r="3.5" strokeWidth="2"></circle>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17l3-7h3l2.5 7M12 10l-3.5 7M12 10l3.5 7M10 7h3M14.5 7h2"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.5 7l-1.5 3"></path>
                </svg>
            </Link>
            {/*公車 按鈕*/}
            <Link to="/bus" className="icon-btn" aria-label={lang === "en" ? "Bus" : "公車即時車況"}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m746-584 30-30-76-74v-112h-40v128l86 88ZM178-720h225-225Zm62 280h-80 376-296ZM160-80q-17 0-28.5-11.5T120-120v-82q-20-21-30-46.5T80-300v-380q0-89 82.5-124.5T451-840q-13 18-22.5 38T412-761q-102 2-157.5 12T178-720h225q-3 20-3 40t3 40H160v120h291q17 24 38 44.5t47 35.5H160v120q0 33 23.5 56.5T240-240h320q33 0 56.5-23.5T640-320v-83q20 3 40 3t40-3v103q0 26-10 51.5T680-202v82q0 17-11.5 28.5T640-80h-40q-17 0-28.5-11.5T560-120v-40H240v40q0 17-11.5 28.5T200-80h-40Zm520-400q-83 0-141.5-58.5T480-680q0-82 58-141t142-59q83 0 141.5 58.5T880-680q0 83-58.5 141.5T680-480ZM302.5-297.5Q320-315 320-340t-17.5-42.5Q285-400 260-400t-42.5 17.5Q200-365 200-340t17.5 42.5Q235-280 260-280t42.5-17.5Zm280 0Q600-315 600-340t-17.5-42.5Q565-400 540-400t-42.5 17.5Q480-365 480-340t17.5 42.5Q515-280 540-280t42.5-17.5Z"/></svg>
            </Link>
        </div>

        {/*2. 本頁標題*/}
        <div className="topbar-title">{title}</div>

        {/*3. 右側按鈕區*/}
        <div className="topbar-actions">
            {/* 顯示註冊信箱前綴作為問候 */}
            {auth && auth.user ? (
                <div className="topbar-greeting" style={{ marginRight: "8px", alignSelf: "center" }}>
                    {lang === 'en' ? `Hello, ${emailPrefix}!` : `${emailPrefix}，您好！`}
                </div>
            ) : null}
            {/*網格按鈕 (快捷連結)*/}
            <div className={`dropdown-wrapper ${isDragging ? "force-open" : ""}`}>
                <button className="icon-btn" aria-label={t.quickLinks}>
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"></path>
                    </svg>
                </button>
                <div className="dropdown-menu">
                    <div className="dropdown-title">{t.quickServices}</div>
                    {!canPin ? (
                        <div className="empty-pin-placeholder" style={{ opacity: 0.8 }}>
                            {lang === "en" ? "Login to pin shortcuts" : "登入後才能釘選捷徑"}
                        </div>
                    ) : pinnedLinks.length === 0 ? (
                        <EmptyDropZone lang={lang} />
                    ) : (
                        (() => {
                            // 從 Favorites 拖入時，在 dragOverPinnedUrl 位置插入一個占位符
                            // 讓 SortableContext 驅動項目自動讓位
                            let displayList = [...pinnedLinks];
                            if (isFromFavorites && dragOverPinnedUrl) {
                                const overIdx = displayList.findIndex(l => l.url === dragOverPinnedUrl);
                                const placeholderItem = { url: "__placeholder__", icon: "", label: "", label_en: "" };
                                if (overIdx >= 0) {
                                    displayList.splice(overIdx, 0, placeholderItem);
                                } else {
                                    displayList.push(placeholderItem); // dropzone = 插到最後
                                }
                            }
                            const displayIds = displayList.map(l => l.url);
                            return (
                                <SortableContext items={displayIds} strategy={verticalListSortingStrategy}>
                                    {displayList.map((item) => {
                                        if (item.url === "__placeholder__") {
                                            return (
                                                <div key="__placeholder__" className="empty-pin-placeholder" style={{
                                                    minHeight: "36px",
                                                    padding: 0,
                                                    margin: "2px 4px",
                                                    pointerEvents: "none",
                                                }}></div>
                                            );
                                        }
                                        return (
                                            <SortablePinItem
                                                key={item.url}
                                                item={item}
                                                lang={lang}
                                                onRemove={handleRemovePin}
                                                isHighlighted={isDuplicateDrag && item.url === duplicateUrl}
                                                isGrayedOut={isDuplicateDrag && item.url !== duplicateUrl}
                                            />
                                        );
                                    })}
                                </SortableContext>
                            );
                        })()
                    )}
                </div>
            </div>

            {/*齒輪按鈕 (設定與登入)*/}
            <div className="dropdown-wrapper">
                <button className="icon-btn" aria-label={t.systemSettings}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                </button>
                <div className="dropdown-menu">
                    <div className="dropdown-title">{t.systemSettings}</div>
                    {auth && auth.user ? (
                        <>
                          
                          <Link to="/settings">{lang === 'en' ? 'Account settings' : '個人帳號設定'}</Link>
                          <a href="#" onClick={async (e) => {
                              e.preventDefault();
                              try {
                                                                await fetch(`${authApiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' });
                              } catch (err) {}
                              if (auth && auth.setUser) auth.setUser(null);
                              navigate('/login');
                          }}>{lang === 'en' ? 'Logout' : '登出'}</a>
                        </>
                    ) : (
                        <Link to="/login" className="login-link">{t.login}</Link>
                    )}
                    <a href="#" onClick={(e) => { e.preventDefault(); toggleLanguage(); }}>{t.switchLanguage}</a>
                    <a href="#" id="theme-btn" onClick={() => setIsDarkTheme(!isDarkTheme)}>{t.switchTheme}</a>
                    <div className="divider"></div>
                    <Link to="/about">{t.aboutUs}</Link>
                    <a href="https://github.com/gc-octopis/114-2_WebAPP_Team06" target="_blank" rel="noopener noreferrer">GitHub</a>
                </div>
            </div>
        </div>

    </header>
    </>
    )
}

export default TopBar;
