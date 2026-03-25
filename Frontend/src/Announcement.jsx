import { useEffect, useState, useRef } from 'react';
import './announcement.css';
import { useLanguage, useText, getLocalizedValue } from './LanguageContext';

function Announcement()
{
    const { lang } = useLanguage();
    const t = useText();
    const [data, setData] = useState(null);
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredData, setFilteredData] = useState(null);
    const [pagedData, setPagedData] = useState([]);
    const [category, setCategory] = useState("");
    const [inputVal, setInputVal] = useState(0);

    const totalItems = useRef(0);
    const totalPages = useRef(0);

    useEffect(() => {
        (async function () {
        try {
            const dataFile = lang === 'en' ? 'announcements.en.json' : 'announcements.json';
            let res = await fetch(dataFile);
            if (!res.ok && dataFile !== 'announcements.json') {
                res = await fetch('announcements.json');
            }

            let rawData = await res.json();
            if (dataFile !== 'announcements.json' && Array.isArray(rawData) && rawData.length === 0) {
                const fallbackRes = await fetch('announcements.json');
                rawData = await fallbackRes.json();
            }

            const nextData = rawData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setData(nextData);
            setFilteredData(nextData);
            setCurrentPage(1);
            setCategory("");
        } catch (error) {
            setData([]);
            setFilteredData([]);
        }
        })();
    }, [lang]);

    useEffect(() => {
        if (filteredData)
        {
            totalItems.current = filteredData.length;
            totalPages.current = Math.ceil(totalItems.current / ITEMS_PER_PAGE);
        }
    }, [filteredData]);

    useEffect(() => {
        if (filteredData)
        {
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            setPagedData(filteredData.slice(startIndex, endIndex));
            setInputVal(String(totalPages.current === 0 ? 0 : currentPage));
        }
    }, [currentPage, filteredData]);
    
    useEffect(() => {
        if (filteredData && data)
        {
            if (category !== '')
            {
                setFilteredData(data.filter(item => item.category === category));
            }
            else
            {
                setFilteredData(data);
            }

            setCurrentPage(1);
        }
    }, [category, data])

    useEffect(() => {
        if (!filteredData) {
            return;
        }

        if (totalPages.current === 0) {
            if (currentPage !== 1) {
                setCurrentPage(1);
            }
            return;
        }

        if (currentPage > totalPages.current) {
            setCurrentPage(totalPages.current);
        }
    }, [filteredData, currentPage]);

    function formatDate(dateString) {
        if (!dateString) return t.missingDate;
        return dateString.replaceAll("-", "/");
    }

    function normalizeCategoryType(category) {
        const categoryText = String(category || "").trim();
        const lower = categoryText.toLowerCase();

        const exactMap = {
            "緊急": "urgent",
            "一般": "general",
            "徵才": "recruit",
            "標案": "tender",
            "urgent": "urgent",
            "general": "general",
            "recruitment": "recruit",
            "job openings": "recruit",
            "tender": "tender",
            "activities": "general",
            "speech": "general",
        };

        if (exactMap[lower]) {
            return exactMap[lower];
        }

        if (lower.includes("urgent")) return "urgent";
        if (lower.includes("job") || lower.includes("recruit")) return "recruit";
        if (lower.includes("tender") || lower.includes("bid") || lower.includes("procurement")) return "tender";

        return "general";
    }

    function localizeCategory(category) {
        const normalized = normalizeCategoryType(category);
        const map = {
            urgent: t.categories.urgent,
            general: t.categories.general,
            recruit: t.categories.recruitment,
            tender: t.categories.tender,
        };

        return map[normalized] || category || t.genericCategory;
    }

    function getCategoryBadgeClass(category) {
        const type = normalizeCategoryType(category);
        const classMap = {
            urgent: "category-badge--urgent",
            general: "category-badge--general",
            recruit: "category-badge--recruit",
            tender: "category-badge--tender",
        };
        return classMap[type] || "category-badge--default";
    }

    function goToPage(inputValue) {
        if (totalPages.current === 0) {
            setCurrentPage(1);
            return;
        }

        const sanitized = String(inputValue).replace(/\D/g, "").slice(0, 3);
        let nextPage = Number.parseInt(sanitized, 10);
        if (Number.isNaN(nextPage)) {
            nextPage = currentPage;
        }

        if (nextPage < 1) nextPage = 1;
        if (nextPage > totalPages.current) nextPage = totalPages.current;

        setCurrentPage(nextPage);
    }


    return (
    <>
    {/*announcements section*/}
    <section className="general-section">
        <h2 className="section-title">{t.announcements}</h2>
        { data && <>
        <div className="announcement-toolbar">
            <select className="announcement-select" onChange={(e) => setCategory(e.target.value)}>
                <option value="">{t.allCategories}</option>
                {[...new Set(data.map(item => item.category))]
                    .map((itemCategory) => <option value={itemCategory} key={itemCategory}>{localizeCategory(itemCategory)}</option>)}
            </select>
            <div className="announcement-pagination">
                <button type="button" className="announcement-page-btn"
                        disabled={totalPages.current === 0 || currentPage <= 1}
                        onClick={() => goToPage(currentPage - 1)}>{t.prevPage}</button>
                <div className="announcement-page-status">
                    <input type="text" className="announcement-page-input" inputMode='numeric'
                           pattern='[0-9]*' maxLength={3}
                           value={inputVal}
                           disabled={totalPages.current === 0}
                           onInput={(e) => setInputVal(e.target.value.replace(/\D/g, "").slice(0, 3))}
                           onKeyDown={(e) => (e.key === "Enter") && goToPage(e.target.value)}
                           onBlur={(e) => goToPage(e.target.value)} />
                    <span className="announcement-page-total">/{totalPages.current}</span>
                </div>
                <button type='button' className="announcement-page-btn"
                        disabled={totalPages.current === 0 || currentPage >= totalPages.current}
                        onClick={() => goToPage(currentPage + 1)}>{t.nextPage}</button>
            </div>
        </div>
        <div className="announcement-list" id="announcementList">
            {
                pagedData.length === 0 ?
                <p className="announcement-empty">{t.noAnnouncement}</p> :
                pagedData.map((item, iter) => 
                    <article className="announcement-item" key={iter}>
                        <span className={"category-badge " + getCategoryBadgeClass(item.category)}>{localizeCategory(item.category)}</span>
                        <a href={item.link} className="announcement-link"
                           target='_blank' rel="noopener noreferrer">{getLocalizedValue(item, lang, 'title', t.untitledAnnouncement)}</a>
                        <time dateTime={item.date || ""} className="announcement-time">{formatDate(item.date)}</time>
                    </article>
                )
            }
        </div>
        </>}
    </section>
    </>
    );
}

export default Announcement;