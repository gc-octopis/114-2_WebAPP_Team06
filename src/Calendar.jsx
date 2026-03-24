import Layout from "./Layout";

import './calendar.css';

import { useEffect } from "react";

function Calendar()
{
    const title = "行事曆";
    useEffect(() => {
        document.title = "MyNTU++ | " + title;
    }, []);

    return (
        <Layout title={title}>
            <div className="calendar-content">

                {/* 行事曆控制區 */}
                <section className="calendar-controls">
                    <button id="prevMonth" className="calendar-nav-btn">← 前月</button>
                    <h1 id="currentMonth" className="calendar-title">2026年 3月</h1>
                    <button id="nextMonth" className="calendar-nav-btn">後月 →</button>
                </section>

                {/* 行事曆網格 */}
                <section className="calendar-month-view">
                    <div className="calendar-weekdays">
                        <div className="weekday">日</div>
                        <div className="weekday">一</div>
                        <div className="weekday">二</div>
                        <div className="weekday">三</div>
                        <div className="weekday">四</div>
                        <div className="weekday">五</div>
                        <div className="weekday">六</div>
                    </div>
                    <div className="calendar-days" id="calendarDays">
                        {/* 由 JavaScript 填充 */}
                    </div>
                </section>

                {/* 事件列表 */}
                <section className="events-section">
                    <h2 className="section-title">活動清單</h2>
                    <div className="events-list" id="eventsList">
                        <p className="no-events">選擇日期查看活動</p>
                    </div>
                </section>

            </div>
        </Layout>
    )
}

export default Calendar;