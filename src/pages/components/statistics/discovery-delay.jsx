import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "../../css/stats.css";
import { Trans, useTranslation } from "react-i18next";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const BUCKET_COLORS = {
  same_day:    "#4caf50",
  "1_week":    "#00A4DC",
  "1_month":   "#5a2da5",
  "3_months":  "#ff9800",
  "1_year":    "#e91e63",
  "1_year_plus": "#ff5722",
  never:       "#616161",
};

function DiscoveryDelay({ days }) {
  const [data, setData] = useState(null);
  const [type, setType] = useState("Movie");
  const [currentType, setCurrentType] = useState("Movie");
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  const BUCKET_LABELS = {
    same_day:     t("STAT_PAGE.BUCKET_SAME_DAY"),
    "1_week":     t("STAT_PAGE.BUCKET_1_WEEK"),
    "1_month":    t("STAT_PAGE.BUCKET_1_MONTH"),
    "3_months":   t("STAT_PAGE.BUCKET_3_MONTHS"),
    "1_year":     t("STAT_PAGE.BUCKET_1_YEAR"),
    "1_year_plus":t("STAT_PAGE.BUCKET_1_YEAR_PLUS"),
    never:        t("STAT_PAGE.BUCKET_NEVER"),
  };

  useEffect(() => {
    const fetchData = () => {
      axios
        .get(`/stats/getDiscoveryDelay?type=${type}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(({ data }) => setData(data.map((d) => ({ ...d, label: BUCKET_LABELS[d.bucket] ?? d.bucket }))))
        .catch(console.log);
    };

    if (!data || currentType !== type) {
      setCurrentType(type);
      fetchData();
    }
    const id = setInterval(fetchData, 60000 * 10);
    return () => clearInterval(id);
  }, [data, type, currentType, token]);

  const handleTypeChange = (_, v) => { if (v) { setType(v); setData(null); } };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { label, count } = payload[0].payload;
    return (
      <div style={{ backgroundColor: "rgba(0,0,0,0.85)", color: "white", borderRadius: 6, padding: "8px 12px" }}>
        <p style={{ margin: 0, fontWeight: "bold" }}>{label}</p>
        <p style={{ margin: 0 }}>{count} {type === "Movie" ? t("MOVIES") : t("SERIES")}</p>
      </div>
    );
  };

  return (
    <div className="statistics-widget">
      <div className="d-flex align-items-center justify-content-between my-2 flex-wrap gap-2">
        <h2 className="m-0">
          <Trans i18nKey="STAT_PAGE.DISCOVERY_DELAY" />
        </h2>
        <ToggleButtonGroup value={type} exclusive onChange={handleTypeChange} size="small">
          {["Movie", "Series"].map((t_) => (
            <ToggleButton
              key={t_} value={t_}
              sx={{ color: "white", borderColor: "rgba(255,255,255,0.2)", "&.Mui-selected": { backgroundColor: "#5a2da5", color: "white" } }}
            >
              <Trans i18nKey={`STAT_PAGE.TYPE_${t_.toUpperCase()}`} />
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {!data ? <></> : (
        <div className="graph small">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.filter((d) => d.bucket !== "never")} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <XAxis dataKey="label" tick={{ fill: "white", fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: "white" }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket] ?? "#8884d8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default DiscoveryDelay;
