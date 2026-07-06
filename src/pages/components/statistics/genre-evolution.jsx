import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../../css/stats.css";
import { Trans } from "react-i18next";

const GENRE_COLORS = [
  "#00A4DC", "#5a2da5", "#4caf50", "#ff9800",
  "#e91e63", "#26c6da", "#ff5722", "#9c27b0",
];

// Minimum fraction of period elapsed before showing a prediction (avoids 10× extrapolation on Monday morning)
const MIN_FRACTION_FOR_PREDICTION = 0.15;

function GenreEvolution({ days }) {
  const [data, setData] = useState(null);
  const [genres, setGenres] = useState([]);
  const [granularity, setGranularity] = useState("month");
  const [fractionComplete, setFractionComplete] = useState(1);
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
          setFractionComplete(resp.fractionComplete ?? 1);
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

  const tickAngle = granularity === "day" ? -45 : granularity === "week" ? -30 : 0;
  const bottomMargin = granularity === "day" ? 50 : granularity === "week" ? 30 : 10;

  // Build chart data with optional prediction point
  const chartData = (() => {
    if (!data || data.length === 0) return data;

    const showPrediction = fractionComplete >= MIN_FRACTION_FOR_PREDICTION && fractionComplete < 0.99;
    if (!showPrediction) return data;

    const n = data.length;
    const last = data[n - 1];
    const prevLast = data[n - 2];

    const result = data.map((b, i) => {
      if (i === n - 1) {
        // Current incomplete bucket: null out solid values so the solid line
        // stops at the previous bucket, keep only _pred (= predicted full value)
        const bucket = { month: b.month, month_ts: b.month_ts };
        genres.forEach((g) => {
          bucket[g] = null;
          bucket[g + "_pred"] = Math.round((b[g] / fractionComplete) * 10) / 10;
        });
        return bucket;
      }
      if (i === n - 2) {
        // Last complete bucket: anchor for the dashed line (same value as solid)
        const bucket = { ...b };
        genres.forEach((g) => { bucket[g + "_pred"] = b[g]; });
        return bucket;
      }
      return b;
    });

    // Use the last TWO complete buckets as extra context for the spline tangent
    // (only if they exist — gives smoother curve direction into the prediction)
    if (n >= 3 && prevLast) {
      const prevPrev = result[n - 3];
      genres.forEach((g) => { prevPrev[g + "_pred"] = prevPrev[g]; });
    }

    return result;
  })();

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const predEntries = payload.filter((p) => p.dataKey.endsWith("_pred") && p.value > 0);
    const isPredicted = predEntries.length > 0 && payload.every((p) => p.dataKey.endsWith("_pred") || p.value == null || p.value === 0);
    return (
      <div style={{ backgroundColor: "rgba(0,0,0,0.85)", color: "white", borderRadius: 6, padding: "8px 12px", minWidth: 140 }}>
        <p style={{ margin: "0 0 4px", fontWeight: "bold" }}>
          {isPredicted ? `${label} (predicted)` : label}
        </p>
        {payload
          .filter((p) => !p.dataKey.endsWith("_pred") && p.value > 0)
          .sort((a, b) => b.value - a.value)
          .map((p) => (
            <p key={p.dataKey} style={{ margin: 0, color: p.color }}>
              {p.dataKey}: {p.value}h
            </p>
          ))}
        {isPredicted && predEntries
          .sort((a, b) => b.value - a.value)
          .map((p) => (
            <p key={p.dataKey} style={{ margin: 0, color: p.color, opacity: 0.8 }}>
              {p.dataKey.replace("_pred", "")}: ~{p.value}h
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

      {!chartData ? <></> : chartData.length === 0 ? (
        <h5><Trans i18nKey="ERROR_MESSAGES.NO_STATS" /></h5>
      ) : (
        <div className="graph">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: bottomMargin }}>
              <XAxis
                dataKey="month"
                tick={{ fill: "white", fontSize: 12 }}
                angle={tickAngle}
                textAnchor={tickAngle < 0 ? "end" : "middle"}
              />
              <YAxis tick={{ fill: "white" }} tickFormatter={(v) => `${v}h`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: "white" }}
                formatter={(value) => value.endsWith("_pred") ? null : value}
              />

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

              {/* Dashed prediction lines — one per genre, only visible for last→predicted segment */}
              {fractionComplete < 0.99 && fractionComplete >= MIN_FRACTION_FOR_PREDICTION && genres.map((genre, i) => (
                <Line
                  key={genre + "_pred"}
                  type="monotone"
                  dataKey={genre + "_pred"}
                  stroke={GENRE_COLORS[i % GENRE_COLORS.length]}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  opacity={0.65}
                  dot={false}
                  activeDot={{ r: 3 }}
                  legendType="none"
                  connectNulls={false}
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
