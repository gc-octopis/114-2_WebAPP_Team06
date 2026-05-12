import React, { useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

const LinkContext = React.createContext({});

export function UseLinkContext()
{
    return useContext(LinkContext);
}

export default function LinkProvider({ children })
{
    const auth = useAuth();
    const authApiBase = import.meta.env.VITE_AUTH_API_BASE || '';
    const [categories, setCategories] = useState([]);
    const [activeCatIdx, setActiveCatIdx] = useState(0);
    const [pinnedLinks, setPinnedLinks] = useState([]);
    const [activeItem, setActiveItem] = useState(null); // 拖曳中的項目 (for DragOverlay)
    const [dragOverPinnedUrl, setDragOverPinnedUrl] = useState(null); // 外來拖曳懸停在哪個 pinned item 上

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }, // 至少拖 5px 才觸發，避免誤觸
        })
    );

    const updatePinnedLinks = async (newLinks) => {
        if (!auth?.user) return;
        setPinnedLinks(newLinks);
        try {
            await fetch(`${authApiBase}/api/preferences/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ pinned_links: newLinks })
            });
        } catch (e) {
            console.error("Failed to save pinned links", e);
        }
    };

    // DnD 事件處理
    const handleDragStart = (event) => {
        const { active } = event;
        setActiveItem(active.data.current?.item || null);
        setDragOverPinnedUrl(null);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) { setDragOverPinnedUrl(null); return; }

        const isFromFavorites = active.id.toString().startsWith("fav-");
        if (!isFromFavorites) { setDragOverPinnedUrl(null); return; }

        // 懸停在某個 pinned item 或 dropzone 上
        if (over.id === 'pinned-dropzone' || pinnedLinks.some(l => l.url === over.id)) {
            setDragOverPinnedUrl(over.id);
        } else {
            setDragOverPinnedUrl(null);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveItem(null);
        setDragOverPinnedUrl(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Favorites 來的 id 有 fav- 前置; TopBar 金釘的 id 直接是 url
        const isFromFavorites = activeId.startsWith("fav-");
        const actualUrl = isFromFavorites ? activeId.slice(4) : activeId;

        const isPinnedSort = !isFromFavorites &&
                             (pinnedLinks.some(l => l.url === overId) || overId === 'pinned-dropzone');

        const isNewPin = isFromFavorites &&
                         (overId === 'pinned-dropzone' || pinnedLinks.some(l => l.url === overId));

        if (isNewPin) {
            // 新增金釘
            if (pinnedLinks.some(l => l.url === actualUrl)) return; // 避免重複
            const overIdx = pinnedLinks.findIndex(l => l.url === overId);
            const insertAt = overIdx >= 0 ? overIdx : pinnedLinks.length;
            const newPins = [...pinnedLinks];
            newPins.splice(insertAt, 0, active.data.current.item);
            updatePinnedLinks(newPins);
        } else if (isPinnedSort && activeId !== overId) {
            // 選單內部排序
            const oldIdx = pinnedLinks.findIndex(l => l.url === activeId);
            const newIdx = pinnedLinks.findIndex(l => l.url === overId);
            if (oldIdx !== -1 && newIdx !== -1) {
                updatePinnedLinks(arrayMove(pinnedLinks, oldIdx, newIdx));
            }
        }
    };

    useEffect(() => {
        (async function fetchPreferences() {
            if (!auth?.user) {
                setPinnedLinks([]);
                return;
            }
            try {
                const res = await fetch(`${authApiBase}/api/preferences/`, { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    setPinnedLinks(data.pinned_links || []);
                } else {
                    setPinnedLinks([]);
                }
            } catch (e) {
                console.error("Failed to load pinned links", e);
                setPinnedLinks([]);
            }
        })();
    }, [auth?.user?.id]);

    useEffect(() => {
        (async function () {
            try {
                const selectedCatIdFromUrl = new URLSearchParams(window.location.search).get('cat');
                const prevSelectedCatId = categories[activeCatIdx]?.id;

                let res = await fetch('/api/links/')

                let nextCategories = await res.json();

                setCategories(nextCategories);

                const preferredCatId = selectedCatIdFromUrl || prevSelectedCatId;
                const resolvedIdx = nextCategories.findIndex((cat) => cat.id === preferredCatId);
                setActiveCatIdx(resolvedIdx >= 0 ? resolvedIdx : 0);
            } catch (error) {
                setCategories([]);
                setActiveCatIdx(0);
            }
        })()
    }, [])

    const isDuplicateDrag = activeItem !== null && pinnedLinks.some(l => l.url === activeItem.url);
    const duplicateUrl = isDuplicateDrag ? activeItem.url : null;

    return (
        <LinkContext.Provider value={{categories, activeCatIdx, setActiveCatIdx, pinnedLinks, updatePinnedLinks, activeItem, dragOverPinnedUrl, isDuplicateDrag, duplicateUrl, isAuthed: !!auth?.user}}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {children}
                {/* DragOverlay：跟著滑鼠移動的縮小 Ghost 圖示 */}
                <DragOverlay dropAnimation={null}>
                    {activeItem ? (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            background: "var(--bg-surface, #fff)",
                            border: "1px solid var(--border-color, #e2e8f0)",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            fontSize: "13px",
                            pointerEvents: "none",
                            opacity: 0.95,
                        }}>
                            <img src={activeItem.icon} alt="" style={{width: "18px", height: "18px"}} />
                            <span style={{color: "var(--text-main)"}}>{activeItem.label}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </LinkContext.Provider>
    )
}
