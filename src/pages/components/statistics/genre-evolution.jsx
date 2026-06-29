import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../../css/stats.css";
import { Trans } from "react-i18next";

const GENRE_COLORS = [
  "#00A4DC", "#5a2da5", "#4caf50", "#ff9800",
  "#e91e63", "#26c6da", "#ff5722", "#9c27b0",
];

function GenreEvolution({ days }) {
  const [data, setData] = useState(null);
  const [genres, setGenres] = useState([]);
  const [granularity, setGranularity] = useState("month");
  const [currentDays, setCurrentDays] = useState(days);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = () => {
      axios
        .get(`/stats/getGenreEvolution?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(({ data: resp }) => {
          setGenres(resp.genres);
          setData(resp.data);
          setGranularity(resp.granularity);
        })
        .catch(console.log);
    };

    if (!data || currentDays !== days) {
      setCurrentDays(days);
      fetchData();
    }
    const id = setInterval(fetchData, 60000 * 10);
    return () => clearInterval(id);
  }, [data, days, currentDays, token]);

  // Tilt labels when there are many daily/weekly buckets
  const tickAngle = granularity === "day" ? -45 : granularity === "week" ? -30 : 0;
  const bottomMargin = granularity === "day" ? 50 : granularity === "week" ? 30 : 10;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ backgroundColor: "rgba(0,0,0,0.85)", color: "white", borderRadius: 6, padding: "8px 12px", minWidth: 140 }}>
        <p style={{ margin: "0 0 4px", fontWeight: "bold" }}>{label}</p>
        {payload
          .filter((p) => p.value > 0)
          .sort((a, b) => b.value - a.value)
          .map((p) => (
            <p key={p.dataKey} style={{ margin: 0, color: p.color }}>
              {p.dataKey}: {p.value}h
            </p>
          ))}
      </div>
    );
  };

  return (
    <div className="statistics-widget">
      <h2 className="text-start my-2">
        <Trans i18nKey="STAT_PAGE.GENRE_EVOLUTION" /> — <Trans i18nKey="LAST" /> {days}{" "}
        <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
      </h2>

      {!data ? <></> : data.length === 0 ? (
        <h5><Trans i18nKey="ERROR_MESSAGES.NO_STATS" /></h5>
      ) : (
        <div className="graph">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: bottomMargin }}>
              <XAxis
                dataKey="month"
                tick={{ fill: "white", fontSize: 12 }}
                angle={tickAngle}
                textAnchor={tickAngle < 0 ? "end" : "middle"}
              />
              <YAxis tick={{ fill: "white" }} tickFormatter={(v) => `${v}h`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "white" }} />
              {genres.map((genre, i) => (
                <Line
                  key={genre}
                  type="monotone"
                  dataKey={genre}
                  stroke={GENRE_COLORS[i % GENRE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default GenreEvolution;
