import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "../../css/stats.css";
import { Trans } from "react-i18next";
import baseUrl from "../../../lib/baseurl";
import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";

const ZONES = [
  { key: "night",   label: "🌙", hours: [22, 23, 0, 1, 2, 3, 4, 5], color: "#1a237e", i18nKey: "STAT_PAGE.PROFILE_NIGHT_OWL" },
  { key: "morning", label: "🌅", hours: [6, 7, 8, 9],               color: "#ff9800", i18nKey: "STAT_PAGE.PROFILE_EARLY_BIRD" },
  { key: "day",     label: "☀️",  hours: [10,11,12,13,14,15,16,17], color: "#ffd54f", i18nKey: "STAT_PAGE.PROFILE_DAY_WATCHER" },
  { key: "evening", label: "🌆", hours: [18,19,20,21],              color: "#5a2da5", i18nKey: "STAT_PAGE.PROFILE_EVENING" },
];

function getZonePlays(hours) {
  return ZONES.map(({ key, hours: zoneHours, color, i18nKey, label }) => ({
    key, label, color, i18nKey,
    value: zoneHours.reduce((sum, h) => sum + (hours[h] ?? 0), 0),
  }));
}

function getDominantZone(zonePlays) {
  return zonePlays.reduce((best, z) => (z.value > best.value ? z : best), zonePlays[0]);
}

function UserCard({ user }) {
  const zonePlays = getZonePlays(user.hours).filter((z) => z.value > 0);
  const dominant = getDominantZone(zonePlays);

  return (
    <div style={{
      backgroundColor: "var(--secondary-background-color)",
      borderRadius: 10, padding: "14px 16px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      minWidth: 160,
    }}>
      <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
        <AccountCircleFillIcon size={48} style={{ position: "absolute", top: 0, left: 0 }} />
        {user.UserId && (
          <img
            src={`${baseUrl}/proxy/Users/Images/Primary?id=${user.UserId}&quality=50`}
            alt=""
            style={{ position: "absolute", top: 0, left: 0, width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <span style={{ position: "absolute", bottom: -4, right: -4, fontSize: 20, lineHeight: 1 }}>
          {dominant.label}
        </span>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 2 }}>{user.UserName}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
          <Trans i18nKey={dominant.i18nKey} />
        </div>
      </div>

      <div style={{ width: "100%", height: 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={zonePlays} dataKey="value" cx="50%" cy="50%" innerRadius="35%" outerRadius="65%" paddingAngle={2}>
              {zonePlays.map((z) => <Cell key={z.key} fill={z.color} />)}
            </Pie>
            <Tooltip
              formatter={(val, _, { payload }) => [val, ""]}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const z = payload[0].payload;
                return (
                  <div style={{ backgroundColor: "rgba(0,0,0,0.85)", color: "white", borderRadius: 4, padding: "4px 8px", fontSize: 11 }}>
                    {z.label} {z.value}
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function NightOwl({ days }) {
  const [data, setData] = useState(null);
  const [currentDays, setCurrentDays] = useState(days);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = () => {
      axios
        .get(`/stats/getUserTimeProfile?days=${days}`, {
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

  return (
    <div className="statistics-widget">
      <h2 className="text-start my-2">
        <Trans i18nKey="STAT_PAGE.NIGHT_OWL" /> — <Trans i18nKey="LAST" /> {days}{" "}
        <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
      </h2>
      {data.length === 0 ? (
        <h5><Trans i18nKey="ERROR_MESSAGES.NO_STATS" /></h5>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {data.map((user) => <UserCard key={user.UserId} user={user} />)}
        </div>
      )}
    </div>
  );
}

export default NightOwl;
