import { useEffect } from "react";
import Layout from "./Layout";
import Bus from "./Bus";
import './bus.css';

function BusPage() {
    useEffect(() => {
        document.title = "MyNTU++ | 公車即時到站";
    }, []);

    return (
        <Layout title="公車即時到站">
            <div className="content-width-limiter">
                <Bus />
            </div>
        </Layout>
    );
}

export default BusPage;
