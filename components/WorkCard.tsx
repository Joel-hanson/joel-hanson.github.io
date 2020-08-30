import * as React from "react";
import { workInterface } from "../interfaces";
import { Row, Col } from "react-grid-system";
import workStyles from "../styles/work.js";

const githubIcon = () => (
  <div className="icon-container">
    <img
      src="../static/icons/github.png"
      alt="github"
      style={{ height: "16px" }}
    />
  </div>
);

const linkIcon = () => (
  <div className="icon-container">
    <img src="../static/icons/link.svg" alt="link" style={{ height: "16px" }} />
  </div>
);

const WorkCard: React.FunctionComponent<workInterface> = ({
  month,
  year,
  title,
  description,
  github,
  website,
}) => (
  <Row className="work-card">
    <Col className="work-month-year-col">
      <div className="work-month-year">
        <span className="work-month">{month}</span>
        <div>{year}</div>
      </div>
    </Col>
    <Col md={8} className="title-description-col">
      <span className="work-title">{title}</span>
      <span className="work-icons">
        {github ? githubIcon() : ""}
        {website ? linkIcon() : ""}
      </span>
      <p className="work-description">{description}</p>
    </Col>
    <style jsx>{workStyles}</style>
  </Row>
);

export default WorkCard;
