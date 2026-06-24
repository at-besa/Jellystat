import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import "../../css/stats.css";
import "./activity-heatmap.css";
import { Trans, useTranslation } from "react-i18next";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function ActivityHeatmap({ days }) {
  const [data, setData] = useState(null);
  const [currentDays, setCurrentDays] = useState(days);
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  const DAY_KEYS = [
    t("STAT_PAGE.WEEKDAY_SUN"),
    t("STAT_PAGE.WEEKDAY_MON"),
    t("STAT_PAGE.WEEKDAY_TUE"),
    t("STAT_PAGE.WEEKDAY_WED"),
    t("STAT_PAGE.WEEKDAY_THU"),
    t("STAT_PAGE.WEEKDAY_FRI"),
    t("STAT_PAGE.WEEKDAY_SAT"),
  ];

  useEffect(() => {
    const fetchData = () => {
      axios
        .get(`/stats/getActivityHeatmap?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(({ data }) => setData(data))
        .catch(console.log);
    };

    if (!data || currentDays !== days) {
      setCurrentDays(days);
      fetchData();
    }
    const id = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(id);
  }, [data, days, currentDays, token]);

  if (!data) return <></>;

  const matrix = {};
  let max = 0;
  data.forEach(({ day_of_week, hour, count }) => {
    if (!matrix[day_of_week]) matrix[day_of_week] = {};
    matrix[day_of_week][hour] = count;
    if (count > max) max = count;
  });

  // Multi-stop gradient: dark bg → deep blue → cyan → amber
  const COLOR_STOPS = [
    { r: 46,  g: 44,  b: 50  }, // 0.00 — near background
    { r: 13,  g: 71,  b: 161 }, // 0.33 — deep blue
    { r: 0,   g: 188, b: 212 }, // 0.66 — cyan
    { r: 249, g: 168, b: 37  }, // 1.00 — amber
  ];

  const getColor = (count) => {
    if (!count || max === 0) return `rgb(${COLOR_STOPS[0].r}, ${COLOR_STOPS[0].g}, ${COLOR_STOPS[0].b})`;
    const t = count / max;
    const n = COLOR_STOPS.length - 1;
    const scaled = t * n;
    const i = Math.min(Math.floor(scaled), n - 1);
    const frac = scaled - i;
    const c0 = COLOR_STOPS[i];
    const c1 = COLOR_STOPS[i + 1];
    const r = Math.round(c0.r + (c1.r - c0.r) * frac);
    const g = Math.round(c0.g + (c1.g - c0.g) * frac);
    const b = Math.round(c0.b + (c1.b - c0.b) * frac);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="statistics-widget">
      <h2 className="text-start my-2">
        <Trans i18nKey="STAT_PAGE.ACTIVITY_HEATMAP" /> — <Trans i18nKey="LAST" /> {days}{" "}
        <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
      </h2>
      <div className="heatmap-container">
        <div className="heatmap-grid">
          <div className="heatmap-corner" />
          {HOURS.map((h) => (
            <div key={h} className="heatmap-hour-label">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
          {DAY_KEYS.map((day, dayIndex) => (
            <div key={day} style={{ display: "contents" }}>
              <div className="heatmap-day-label">{day}</div>
              {HOURS.map((hour) => {
                const count = matrix[dayIndex]?.[hour] ?? 0;
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(count) }}
                    title={`${day} ${String(hour).padStart(2, "0")}:00 — ${count} plays`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
