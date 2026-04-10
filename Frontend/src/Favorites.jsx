import { UseLinkContext } from "./LinkContext";
import { motion } from "motion/react"
import { useLanguage, getLocalizedValue, getLocalizedCategoryLabel } from "./LanguageContext";
import { useDraggable } from "@dnd-kit/core";

// 每個可拖曳的連結卡片import { useLanguage } from './LanguageContext';
function DraggableCard({ item, lang }) {
    const linkLabel = getLocalizedValue(item, lang, "label", "");
    // 英文模式優先使用 url_en（若有），否則回退 url
    const linkUrl = getLocalizedValue(item, lang, "url", item.url) || item.url;
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `fav-${item.url}`,  // id 固定用中文 url，保持 pinned 記憶穩定
        data: { item },
    });

    return (
        <a
            ref={setNodeRef}
            href={isDragging ? undefined : linkUrl}
            className="card-anchor-item"
            target="_blank"
            rel="noopener noreferrer"
            title={linkLabel}
            style={{ opacity: isDragging ? 0.35 : 1, cursor: isDragging ? "grabbing" : "grab" }}
            onClick={isDragging ? (e) => e.preventDefault() : undefined}
            {...listeners}
            {...attributes}
        >
            <div className="card-icon-box">
                <img src={item.icon} alt={linkLabel} className="card-icon-img" loading="lazy" />
            </div>
            <span className="card-label">{linkLabel}</span>
        </a>
    );
}

function Favorites()
{
    const { lang } = useLanguage();
    const { categories, activeCatIdx } = UseLinkContext();
    const activeCat = categories[activeCatIdx];

    const activeCategoryLabel = activeCat ? getLocalizedCategoryLabel(activeCat, lang) : "";
    const visibleLinks = activeCat?.links || [];

    return (
    <>
    {/*favorite section*/}
    <section className="general-section">
        <h2 className="section-title" id="favoritesTitle">{activeCat ? (activeCat.icon + "  " + activeCategoryLabel) : ""}</h2>

            <motion.div
            key={activeCatIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="cards-grid" id="favoritesGrid">
                {
                    activeCat && visibleLinks.map((item, iter) =>
                        <DraggableCard key={item.url || iter} item={item} lang={lang} />
                    )
                }
            </motion.div>

    </section>
    </>
    )
}

export default Favorites;