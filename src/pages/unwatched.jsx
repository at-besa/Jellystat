import { useState, useEffect } from "react";
import axios from "../lib/axios_instance";
import Config from "../lib/config";
import { FormSelect, ButtonGroup, Button } from "react-bootstrap";
import { Trans } from "react-i18next";
import i18next from "i18next";

import Loading from "./components/general/loading";
import MoreItemCards from "./components/item-info/more-items/more-items-card";
import "./css/library/media-items.css";
import "./css/activity/activity-table.css";

const PAGE_SIZE = 24;

function Unwatched() {
  const [data, setData] = useState();
  const [config, setConfig] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState("");
  const [type, setType] = useState("Movie");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        console.log(error);
      }
    };
    if (!config) fetchConfig();
  }, [config]);

  useEffect(() => {
    if (!config) return;
    axios
      .get(`/api/getLibraries`, {
        headers: { Authorization: `Bearer ${config.token}` },
      })
      .then((res) => setLibraries(res.data.filter((l) => !l.archived)))
      .catch((err) => console.log(err));
  }, [config]);

  useEffect(() => {
    if (!config) return;
    setCurrentPage(1);
    fetchData(1);
    // eslint-disable-next-line
  }, [config, type, selectedLibrary]);

  const fetchData = async (page) => {
    try {
      setData(undefined);
      const params = { type, page, size: PAGE_SIZE };
      if (selectedLibrary) params.libraryid = selectedLibrary;

      const res = await axios.get(`/stats/getUnwatchedItems`, {
        params,
        headers: { Authorization: `Bearer ${config.token}` },
      });
      setData(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.log(error);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    fetchData(page);
  };

  if (!config) {
    return <Loading />;
  }

  const totalPages = data?.pages ?? 1;
  const rangeStart = data ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = data ? Math.min(currentPage * PAGE_SIZE, data.total) : 0;

  return (
    <div className="library-items">
      <div className="d-md-flex justify-content-between align-items-center">
        <h1 className="my-3">
          <Trans i18nKey="UNWATCHED_PAGE.TITLE" />
        </h1>

        <div className="d-flex flex-column flex-md-row gap-2 my-2 my-md-0">
          <div className="btn-group" role="group">
            <button
              className={`btn ${type === "Movie" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setType("Movie")}
            >
              <Trans i18nKey="UNWATCHED_PAGE.MOVIES" />
            </button>
            <button
              className={`btn ${type === "Series" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setType("Series")}
            >
              <Trans i18nKey="UNWATCHED_PAGE.SERIES" />
            </button>
          </div>

          <FormSelect
            value={selectedLibrary}
            onChange={(e) => setSelectedLibrary(e.target.value)}
            className="rounded"
            style={{ minWidth: "180px" }}
          >
            <option value="">{i18next.t("UNWATCHED_PAGE.ALL_LIBRARIES")}</option>
            {libraries.map((lib) => (
              <option key={lib.Id} value={lib.Id}>
                {lib.Name}
              </option>
            ))}
          </FormSelect>
        </div>
      </div>

      {!data ? (
        <Loading />
      ) : data.results.length === 0 ? (
        <p className="text-muted mt-4">
          <Trans i18nKey="UNWATCHED_PAGE.EMPTY" />
        </p>
      ) : (
        <>
          <div className="media-items-container">
            {data.results.map((item) => (
              <MoreItemCards
                data={item}
                base_url={config.settings?.EXTERNAL_URL ?? config.hostUrl}
                key={item.Id}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-end my-2">
              <ButtonGroup className="pagination-buttons">
                <Button className="page-btn" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                  <Trans i18nKey="TABLE_NAV_BUTTONS.FIRST" />
                </Button>
                <Button className="page-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                  <Trans i18nKey="TABLE_NAV_BUTTONS.PREVIOUS" />
                </Button>
                <div className="page-number d-flex align-items-center justify-content-center">
                  {`${rangeStart}-${rangeEnd} of ${data.total}`}
                </div>
                <Button className="page-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
                  <Trans i18nKey="TABLE_NAV_BUTTONS.NEXT" />
                </Button>
                <Button className="page-btn" onClick={() => goToPage(totalPages)} disabled={currentPage >= totalPages}>
                  <Trans i18nKey="TABLE_NAV_BUTTONS.LAST" />
                </Button>
              </ButtonGroup>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Unwatched;
