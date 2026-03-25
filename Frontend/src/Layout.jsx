import TopBar from "./TopBar";
import SideBar from "./SideBar";

import { useState, useEffect } from "react";

function Layout({ title, children })
{
    const [sideBarToggled, setSideBarToggled] = useState(false);

    useEffect(() => {
        const checkForClickOutside = (e) => {
            if (!e.target.closest('.sidebar-wrapper') && !e.target.closest('#hamburger-btn')) {
                if (window.innerWidth <= 768) {
                    setSideBarToggled(prev => !prev);
                }
            }
        }
        document.addEventListener('click', checkForClickOutside);

        () => document.removeEventListener('click', checkForClickOutside);
    }, []);

    return (
    <>
    <TopBar title={title} setSideBarToggled={setSideBarToggled}/>
    {/*下方佈局：主畫面 (Main Wrapper)*/}
    <div className="main-wrapper">
        <SideBar toggled={sideBarToggled} />
        {/*右側 content*/}
        <main className="content-wrapper">{children}</main>
    </div>
    </>
    )
}

export default Layout;