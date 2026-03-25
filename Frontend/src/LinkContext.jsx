import React, { useState, useContext, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

const LinkContext = React.createContext({});

export function UseLinkContext()
{
    return useContext(LinkContext);
}

export default function LinkProvider({ children })
{
    const { lang } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [activeCatIdx, setActiveCatIdx] = useState(0);

    useEffect(() => {
        (async function () {
            try {
                const selectedCatIdFromUrl = new URLSearchParams(window.location.search).get('cat');
                const prevSelectedCatId = categories[activeCatIdx]?.id;

                const dataFile = lang === 'en' ? 'links.en.json' : 'links.json';
                let res = await fetch(dataFile);

                if (!res.ok && dataFile !== 'links.json') {
                    res = await fetch('links.json');
                }

                let nextCategories = await res.json();

                if (dataFile !== 'links.json' && Array.isArray(nextCategories) && nextCategories.length === 0) {
                    const fallbackRes = await fetch('links.json');
                    nextCategories = await fallbackRes.json();
                }

                setCategories(nextCategories);

                const preferredCatId = selectedCatIdFromUrl || prevSelectedCatId;
                const resolvedIdx = nextCategories.findIndex((cat) => cat.id === preferredCatId);
                setActiveCatIdx(resolvedIdx >= 0 ? resolvedIdx : 0);
            } catch (error) {
                // Keep UI stable even when static files are missing.
                setCategories([]);
                setActiveCatIdx(0);
            }
        })()
    }, [lang])

    return (
        <LinkContext.Provider value={{categories, activeCatIdx, setActiveCatIdx}}>
            {children}
        </LinkContext.Provider>
    )
}