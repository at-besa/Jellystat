import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../../css/stats.css";
import { Trans } from "react-i18next";

const COLORS = {
  DirectPlay: "#4caf50",
  DirectStream: "#00A4DC",
  Transcode: "#ff9800",
};

function TranscodeRatio({ days }) {
  const [data, setData] = useState(null);
  const [currentDays, setCurrentDays] = useState(days);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = () => {
      axios
        .post(
          "/stats/getPlaybackMethodStats",
          { days },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        )
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

  if (data.length === 0) {
    return (
      <div className="statistics-widget small">
        <h2 className="text-start my-2">
          <Trans i18nKey="STAT_PAGE.TRANSCODE_RATIO" /> — <Trans i18nKey="LAST" /> {days}{" "}
          <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
        </h2>
        <h5><Trans i18nKey="ERROR_MESSAGES.NO_STATS" /></h5>
      </div>
    );
  }

  return (
    <div className="statistics-widget">
      <h2 className="text-start my-2">
        <Trans i18nKey="STAT_PAGE.TRANSCODE_RATIO" /> — <Trans i18nKey="LAST" /> {days}{" "}
        <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
      </h2>
      <div className="graph small">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="Count" nameKey="Name" cx="50%" cy="45%" innerRadius="35%" outerRadius="60%">
              {data.map((entry) => (
                <Cell key={entry.Name} fill={COLORS[entry.Name] ?? "#8884d8"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name) => [val, name]}
              contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", color: "white", border: "none", borderRadius: 6 }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TranscodeRatio;
