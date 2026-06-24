import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "../../css/stats.css";
import { Trans } from "react-i18next";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const CONTENT_TYPES = ["Movie", "Series", "Audio"];
const BAR_COLOR = "#5a2da5";

function TopContent({ days }) {
  const [data, setData] = useState(null);
  const [type, setType] = useState("Movie");
  const [currentDays, setCurrentDays] = useState(days);
  const [currentType, setCurrentType] = useState("Movie");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = () => {
      axios
        .post(
          "/stats/getMostViewedByType",
          { days, type },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        )
        .then(({ data }) => setData(data))
        .catch(console.log);
    };

    if (!data || currentDays !== days || currentType !== type) {
      setCurrentDays(days);
      setCurrentType(type);
      fetchData();
    }
    const id = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(id);
  }, [data, days, type, currentDays, currentType, token]);

  const handleTypeChange = (_, newType) => {
    if (newType) {
      setType(newType);
      setData(null);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <div style={{ backgroundColor: "rgba(0,0,0,0.85)", color: "white", borderRadius: 6, padding: "8px 12px" }}>
        <p style={{ margin: 0, fontWeight: "bold" }}>{item.Name}</p>
        <p style={{ margin: 0 }}>{item.Plays} plays</p>
      </div>
    );
  };

  return (
    <div className="statistics-widget">
      <div className="d-flex align-items-center justify-content-between my-2 flex-wrap gap-2">
        <h2 className="m-0">
          <Trans i18nKey="STAT_PAGE.TOP_CONTENT" /> — <Trans i18nKey="LAST" /> {days}{" "}
          <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
        </h2>
        <ToggleButtonGroup value={type} exclusive onChange={handleTypeChange} size="small">
          {CONTENT_TYPES.map((t) => (
            <ToggleButton
              key={t}
              value={t}
              sx={{ color: "white", borderColor: "rgba(255,255,255,0.2)", "&.Mui-selected": { backgroundColor: "#5a2da5", color: "white" } }}
            >
              <Trans i18nKey={`STAT_PAGE.TYPE_${t.toUpperCase()}`} />
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {!data ? (
        <></>
      ) : data.length === 0 ? (
        <h5><Trans i18nKey="ERROR_MESSAGES.NO_STATS" /></h5>
      ) : (
        <div className="graph">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <XAxis type="number" stroke="rgba(255,255,255,0.4)" tick={{ fill: "white" }} />
              <YAxis
                type="category"
                dataKey="Name"
                width={200}
                tick={{ fill: "white", fontSize: 13 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="Plays" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.Id} fill={BAR_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default TopContent;
