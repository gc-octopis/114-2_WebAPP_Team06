import React, { useState, useContext, useEffect } from 'react';

const LinkContext = React.createContext({});

export function UseLinkContext()
{
    return useContext(LinkContext);
}

export default function LinkProvider({ children })
{
    const [categories, setCategories] = useState([]);
    const [activeCatIdx, setActiveCatIdx] = useState(0);

    useEffect(() => {
        (async function () {
            const res = await fetch("links.json");
            const categories = await res.json();
            setCategories(categories);
        })()
    }, [])

    return (
        <LinkContext.Provider value={{categories, activeCatIdx, setActiveCatIdx}}>
            {children}
        </LinkContext.Provider>
    )
}