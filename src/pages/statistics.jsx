import { Tabs, Tab } from "react-bootstrap";
import { useState } from "react";

import "./css/stats.css";

import DailyPlayStats from "./components/statistics/daily-play-count";
import PlayStatsByDay from "./components/statistics/play-stats-by-day";
import PlayStatsByHour from "./components/statistics/play-stats-by-hour";
import TranscodeRatio from "./components/statistics/transcode-ratio";
import ContentTypeBreakdown from "./components/statistics/content-type-breakdown";
import TopClients from "./components/statistics/top-clients";
import TopContent from "./components/statistics/top-content";
import ActivityHeatmap from "./components/statistics/activity-heatmap";
import { Trans } from "react-i18next";

function Statistics() {
  const [days, setDays] = useState(
    localStorage.getItem("PREF_STATISTICS_STAT_DAYS_INPUT") != undefined
      ? localStorage.getItem("PREF_STATISTICS_STAT_DAYS_INPUT")
      : localStorage.getItem("PREF_STATISTICS_STAT_DAYS") ?? 20
  );
  const [input, setInput] = useState(localStorage.getItem("PREF_STATISTICS_STAT_DAYS_INPUT") ?? 20);

  const handleOnChange = (event) => {
    setInput(event.target.value);
    localStorage.setItem("PREF_STATISTICS_STAT_DAYS_INPUT", event.target.value);
  };

  const [activeTab, setActiveTab] = useState(localStorage.getItem(`PREF_STATISTICS_LAST_SELECTED_TAB`) ?? "tabCount");

  function setTab(tabName) {
    setActiveTab(tabName);
    localStorage.setItem(`PREF_STATISTICS_LAST_SELECTED_TAB`, tabName);
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      if (input < 1) {
        setInput(1);
        setDays(0);
        localStorage.setItem("PREF_STATISTICS_STAT_DAYS", 0);
        localStorage.setItem("PREF_STATISTICS_STAT_DAYS_INPUT", 1);
      } else {
        setDays(parseInt(input));
        localStorage.setItem("PREF_STATISTICS_STAT_DAYS", parseInt(input));
        localStorage.setItem("PREF_STATISTICS_STAT_DAYS_INPUT", input);
      }

      console.log(days);
    }
  };

  return (
    <div className="watch-stats">
      <div className="Heading">
        <h1>
          <Trans i18nKey={"STAT_PAGE.STATISTICS"} />
        </h1>
        <div className="stats-tab-nav">
          <Tabs
            defaultActiveKey={activeTab}
            activeKey={activeTab}
            onSelect={setTab}
            variant="pills"
          >
            <Tab
              eventKey="tabCount"
              className="bg-transparent"
              title={<Trans i18nKey="STAT_PAGE.COUNT_VIEW" />}
            />
            <Tab
              eventKey="tabDuration"
              className="bg-transparent"
              title={<Trans i18nKey="STAT_PAGE.DURATION_VIEW" />}
            />
            <Tab
              eventKey="tabBreakdown"
              className="bg-transparent"
              title={<Trans i18nKey="STAT_PAGE.TAB_BREAKDOWN" />}
            />
            <Tab
              eventKey="tabTopContent"
              className="bg-transparent"
              title={<Trans i18nKey="STAT_PAGE.TAB_TOP_CONTENT" />}
            />
            <Tab
              eventKey="tabHeatmap"
              className="bg-transparent"
              title={<Trans i18nKey="STAT_PAGE.TAB_HEATMAP" />}
            />
          </Tabs>
        </div>
        <div className="date-range">
          <div className="header">
            <Trans i18nKey={"LAST"} />
          </div>
          <div className="days">
            <input type="number" min={1} value={input} onChange={handleOnChange} onKeyDown={handleKeyDown} />
          </div>
          <div className="trailer">
            <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
          </div>
        </div>
      </div>

      {activeTab === "tabCount" && (
        <div>
          <DailyPlayStats days={days} viewName="count" />
          <div className="statistics-graphs">
            <PlayStatsByDay days={days} viewName="count" />
            <PlayStatsByHour days={days} viewName="count" />
          </div>
        </div>
      )}

      {activeTab === "tabDuration" && (
        <div>
          <DailyPlayStats days={days} viewName="duration" />
          <div className="statistics-graphs">
            <PlayStatsByDay days={days} viewName="duration" />
            <PlayStatsByHour days={days} viewName="duration" />
          </div>
        </div>
      )}

      {activeTab === "tabBreakdown" && (
        <div className="statistics-graphs">
          <TranscodeRatio days={days} />
          <ContentTypeBreakdown days={days} />
          <TopClients days={days} />
        </div>
      )}

      {activeTab === "tabTopContent" && (
        <TopContent days={days} />
      )}

      {activeTab === "tabHeatmap" && (
        <ActivityHeatmap days={days} />
      )}
    </div>
  );
}

export default Statistics;
