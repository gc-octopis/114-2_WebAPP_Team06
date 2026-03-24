import { useEffect, useState, useRef } from 'react';
import './announcement.css';

function Announcement()
{
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
        const res = await fetch("announcements.json"); // 你的 JSON
        const rawData = await res.json();
        const data = rawData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setData(data);
        setFilteredData(data);
        })();
    }, []);

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
        if (filteredData)
        {
            if (category != '')
            {
                setFilteredData(data.filter(item => item.category === category));
            }
            else
            {
                setFilteredData(data);
            }

            setCurrentPage(1);
        }
    }, [category])

    if (data)
    {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
        if (totalPages === 0) {
            setCurrentPage(1);
        }
    }

    function formatDate(dateString) {
        if (!dateString) return "日期未提供";
        return dateString.replaceAll("-", "/");
    }

    function getCategoryBadgeClass(category) {
        const categoryMap = {
            "緊急": "category-badge--urgent",
            "一般": "category-badge--general",
            "徵才": "category-badge--recruit",
            "標案": "category-badge--tender"
        };
        return categoryMap[category] || "category-badge--default";
    }

    function goToPage(inputValue) {
        // if (totalPages.current === 0) {
        //     setCurrentPage(1);
        //     return;
        // }

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
        <h2 className="section-title">公告清單</h2>
        { data && <>
        <div className="announcement-toolbar">
            <select className="announcement-select" onChange={(e) => setCategory(e.target.value)}>
                <option value="">全部類別</option>
                {[...new Set(data.map(item => item.category))]
                    .map((category) => <option value={category} key={category}>{category}</option>)}
            </select>
            <div className="announcement-pagination">
                <button type="button" className="announcement-page-btn"
                        disabled={totalPages.current === 0 || currentPage <= 1}
                        onClick={() => goToPage(currentPage - 1)}>上一頁</button>
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
                        onClick={() => goToPage(currentPage + 1)}>下一頁</button>
            </div>
        </div>
        <div className="announcement-list" id="announcementList">
            {
                pagedData.length === 0 ?
                <p className="announcement-empty">找不到符合條件的公告</p> :
                pagedData.map((item, iter) => 
                    <article className="announcement-item" key={iter}>
                        <span className={"category-badge " + getCategoryBadgeClass(item.category)}>{item.category || "一般"}</span>
                        <a href={item.link} className="announcement-link"
                           target='_blank' rel="noopener noreferrer">{item.title || "未命名公告"}</a>
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