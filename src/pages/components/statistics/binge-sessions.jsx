import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import "../../css/stats.css";
import { Trans, useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import { Link } from "react-router-dom";

function formatDuration(seconds) {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function pad(n) {
  return String(n ?? 0).padStart(2, "0");
}

function SessionItems({ userId, sessionStart, sessionEnd }) {
  const [items, setItems] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(
        `/stats/getSessionItems?userId=${encodeURIComponent(userId)}&sessionStart=${encodeURIComponent(sessionStart)}&sessionEnd=${encodeURIComponent(sessionEnd)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(({ data }) => setItems(data))
      .catch(console.log);
  }, [userId, sessionStart, sessionEnd, token]);

  if (!items) return <div style={{ padding: "8px 0", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item, i) => {
        const hasEpisode = item.season_number != null && item.episode_number != null;
        const episodeTag = hasEpisode ? `S${pad(item.season_number)}E${pad(item.episode_number)}` : null;

        return (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", borderRadius: 4, backgroundColor: "rgba(255,255,255,0.04)", fontSize: 13 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", overflow: "hidden", minWidth: 0 }}>
              <span style={{ color: "rgba(255,255,255,0.35)", minWidth: 24, flexShrink: 0 }}>{i + 1}.</span>
              <Link to={`/libraries/item/${item.item_id}`} className="item-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.series_name ? (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{item.title}</span>
                    {episodeTag && <span style={{ color: "#00A4DC", margin: "0 4px", fontSize: 11 }}>{episodeTag}</span>}
                    {" — "}{item.episode_name}
                  </>
                ) : item.title}
              </Link>
            </div>
            <span style={{ color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", marginLeft: 12 }}>
              {formatDuration(item.duration_seconds)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const efficiency = session.span_seconds > 0
    ? Math.round((session.play_seconds / session.span_seconds) * 100)
    : 0;

  return (
    <div style={{ backgroundColor: "var(--secondary-background-color)", borderRadius: 8, borderLeft: "4px solid #5a2da5", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", cursor: "pointer" }} onClick={() => setExpanded((v) => !v)}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
          <span style={{ fontWeight: "bold", fontSize: 15 }}>{session.UserName}</span>
          <div className="d-flex align-items-center gap-2">
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{formatDate(session.session_start)}</span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
        <div className="d-flex gap-3 mt-1 flex-wrap" style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
          <span>🎬 {session.items_count} <Trans i18nKey="STAT_PAGE.ITEMS_WATCHED" /></span>
          <span>⏱ {formatDuration(session.span_seconds)} <Trans i18nKey="STAT_PAGE.SESSION_DURATION" /></span>
          <span>▶ {formatDuration(session.play_seconds)} <Trans i18nKey="STAT_PAGE.PLAY_TIME" /></span>
        </div>
        <Tooltip title={t("STAT_PAGE.BINGE_EFFICIENCY_TOOLTIP", { efficiency })} placement="top" arrow>
          <div style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min(100, efficiency)}%`, backgroundColor: "#5a2da5", transition: "width 0.3s ease" }} />
          </div>
        </Tooltip>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <SessionItems userId={session.UserId} sessionStart={session.session_start} sessionEnd={session.session_end} />
        </div>
      )}
    </div>
  );
}

function BingeSessions({ days }) {
  const [data, setData] = useState(null);
  const [currentDays, setCurrentDays] = useState(days);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = () => {
      axios
        .get(`/stats/getBingeSessions?days=${days}&minItems=3`, {
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
        <Trans i18nKey="STAT_PAGE.BINGE_SESSIONS" /> — <Trans i18nKey="LAST" /> {days}{" "}
        <Trans i18nKey={`UNITS.DAY${days > 1 ? "S" : ""}`} />
      </h2>

      {data.length === 0 ? (
        <h5><Trans i18nKey="ERROR_MESSAGES.NO_STATS" /></h5>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.slice(0, 15).map((session) => (
            <SessionCard key={`${session.UserId}-${session.session_id}`} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

export default BingeSessions;
