import React, { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import { Form, Row, Col, ButtonGroup, Button } from "react-bootstrap";
import Alert from "react-bootstrap/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import "../../css/settings/backups.css";
import { Trans } from "react-i18next";
import i18next from "i18next";

const token = localStorage.getItem("token");

function AliasRow({ data, onDelete }) {
  async function handleDelete() {
    await axios
      .delete("/api/genreAliases", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        data: { alias: data.alias },
      })
      .then(() => onDelete())
      .catch((error) => console.log(error));
  }

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>{data.alias}</TableCell>
        <TableCell>{data.canonical}</TableCell>
        <TableCell>
          <div className="d-flex justify-content-center">
            <Button variant="primary" onClick={handleDelete}>
              <Trans i18nKey="DELETE" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function GenreAliases() {
  const [aliases, setAliases] = useState([]);
  const [showAlert, setShowAlert] = useState({ visible: false, type: "danger", title: "Error", message: "" });
  const [rowsPerPage] = React.useState(10);
  const [page, setPage] = React.useState(0);
  const [formValues, setFormValues] = useState({ alias: "", canonical: "" });

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/genreAliases", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      setAliases(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function handleFormChange(event) {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    if (!formValues.alias || !formValues.canonical) {
      setShowAlert({ visible: true, type: "danger", title: "Error", message: i18next.t("SETTINGS_PAGE.ALIAS_REQUIRED") });
      return;
    }
    axios
      .post("/api/genreAliases", formValues, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      .then(() => {
        setFormValues({ alias: "", canonical: "" });
        fetchData();
      })
      .catch((error) => {
        setShowAlert({ visible: true, type: "danger", title: "Error", message: error.response?.data || error.message });
      });
  }

  const visibleRows = aliases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div>
      <h1 className="my-2">
        <Trans i18nKey="SETTINGS_PAGE.GENRE_ALIASES" />
      </h1>

      {showAlert.visible && (
        <Alert bg="dark" data-bs-theme="dark" variant={showAlert.type} onClose={() => setShowAlert({ visible: false })} dismissible>
          <Alert.Heading>{showAlert.title}</Alert.Heading>
          <p>{showAlert.message}</p>
        </Alert>
      )}

      <Form onSubmit={handleFormSubmit} className="settings-form">
        <Form.Group as={Row} className="mb-3">
          <Col sm="5" md="4">
            <Form.Control
              name="alias"
              value={formValues.alias}
              onChange={handleFormChange}
              placeholder={i18next.t("SETTINGS_PAGE.ALIAS")}
            />
          </Col>
          <Col sm="5" md="4">
            <Form.Control
              name="canonical"
              value={formValues.canonical}
              onChange={handleFormChange}
              placeholder={i18next.t("SETTINGS_PAGE.CANONICAL_GENRE")}
            />
          </Col>
          <Col sm="2" md="2" className="mt-2 mt-sm-0">
            <Button variant="outline-primary" type="submit" className="w-100">
              <Trans i18nKey="SETTINGS_PAGE.ADD_ALIAS" />
            </Button>
          </Col>
        </Form.Group>
      </Form>

      <TableContainer className="rounded-2">
        <Table aria-label="genre aliases table">
          <TableHead>
            <TableRow>
              <TableCell>
                <Trans i18nKey="SETTINGS_PAGE.ALIAS" />
              </TableCell>
              <TableCell>
                <Trans i18nKey="SETTINGS_PAGE.CANONICAL_GENRE" />
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row, index) => (
              <AliasRow key={index} data={row} onDelete={fetchData} />
            ))}
            {aliases.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", fontStyle: "italic", color: "grey", height: "200px" }}>
                  <Trans i18nKey="ERROR_MESSAGES.NO_ALIASES" />
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="d-flex justify-content-end my-2">
        <ButtonGroup className="pagination-buttons">
          <Button className="page-btn" onClick={() => setPage(0)} disabled={page === 0}>
            <Trans i18nKey="TABLE_NAV_BUTTONS.FIRST" />
          </Button>
          <Button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            <Trans i18nKey="TABLE_NAV_BUTTONS.PREVIOUS" />
          </Button>
          <div className="page-number d-flex align-items-center justify-content-center">
            {`${page * rowsPerPage + 1}-${Math.min(page * rowsPerPage + rowsPerPage, aliases.length)} of ${aliases.length}`}
          </div>
          <Button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(aliases.length / rowsPerPage) - 1}>
            <Trans i18nKey="TABLE_NAV_BUTTONS.NEXT" />
          </Button>
          <Button className="page-btn" onClick={() => setPage(Math.ceil(aliases.length / rowsPerPage) - 1)} disabled={page >= Math.ceil(aliases.length / rowsPerPage) - 1}>
            <Trans i18nKey="TABLE_NAV_BUTTONS.LAST" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
