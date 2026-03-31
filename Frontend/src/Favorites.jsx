import { UseLinkContext } from "./LinkContext";
import { motion } from "motion/react"
import { useLanguage, getLocalizedValue, getLocalizedCategoryLabel } from "./LanguageContext";
import { useDraggable } from "@dnd-kit/core";

function hasCjk(text = "") {
    return /[\u3400-\u9fff]/.test(text);
}

function hasEnglishMapping(item) {
    const enLabel = (item?.label_en || "").trim();
    const zhLabel = (item?.label || "").trim();

    if (!enLabel) return false;
    if (enLabel === zhLabel && hasCjk(enLabel)) return false;

    return true;
}

// 每個可拖曳的連結卡片
function DraggableCard({ item, lang }) {
    const linkLabel = getLocalizedValue(item, lang, "label", "");
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `fav-${item.url}`,
        data: { item },
    });

    return (
        <a
            ref={setNodeRef}
            href={isDragging ? undefined : item.url}  // 拖曳中停用連結
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
    const visibleLinks = (activeCat?.links || []).filter((item) => {
        if (lang !== "en") return true;
        return hasEnglishMapping(item);
    });

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