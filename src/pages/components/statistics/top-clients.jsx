import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../../css/stats.css";
import { Trans } from "react-i18next";

const COLORS = [
  "#5a2da5", "#00A4DC", "#ff9800", "#4caf50", "#e91e63",
  "#26c6da", "#ff5722", "#9c27b0", "#607d8b", "#795548",
];

function TopClients({ days }) {
  const [data, setData] = useState(null);
  const [currentDays, setCurrentDays] = useState(days);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = () => {
      axios
        .post(
          "/stats/getMostUsedClient",
          { days },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        )
        .then(({ data }) => {
          setData(data.map((d) => ({ name: d.Client, value: Number(d.Plays) })));
        })
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
          <Trans i18nKey="STAT_PAGE.TOP_CLIENTS" /> — <Trans i18nKey="LAST" /> {days}{" "}
          <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
        </h2>
        <h5><Trans i18nKey="ERROR_MESSAGES.NO_STATS" /></h5>
      </div>
    );
  }

  return (
    <div className="statistics-widget">
      <h2 className="text-start my-2">
        <Trans i18nKey="STAT_PAGE.TOP_CLIENTS" /> — <Trans i18nKey="LAST" /> {days}{" "}
        <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
      </h2>
      <div className="graph small">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius="35%" outerRadius="60%">
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
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

export default TopClients;
