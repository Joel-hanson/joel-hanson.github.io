import * as React from "react";
import { TimelineInterface, PitstopInterface } from "../interfaces";
import TimelineCss from "../styles/timeline.js";

const Pitstop: React.FunctionComponent<PitstopInterface> = ({
  date,
  shortTitle,
  description,
}) => {
  const formatDate = (date: Date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formatted_date = new Intl.DateTimeFormat("en-US").format(
      date
    );
    return formatted_date;
  };

  return (
    <div className="col-xs-10 col-xs-offset-1 col-sm-8 col-sm-offset-2">
      <ul className="timeline">
        <li className="timeline-item">
          <div className="timeline-info">
            <span>{formatDate(date)}</span>
          </div>
          <div className="timeline-marker"></div>
          <div className="timeline-content">
            <h3 className="timeline-title">{shortTitle}</h3>
            <p>{description}</p>
          </div>
        </li>
      </ul>
    </div>
  );
};

const Timeline: React.FunctionComponent<TimelineInterface> = ({ items }) => (
  <>
    <div className="timeline-container">
      <div className="pitstop-container">
        {items.map((item, index) => (
          <Pitstop
            key={index}
            date={item.date}
            shortTitle={item.shortTitle}
            description={item.description}
          ></Pitstop>
        ))}
      </div>
    </div>
    <style jsx>{`
      .timeline-container {
        position: relative;
        display: inline-block;
        height: inherit;
        overflow: auto;
      }
      ::-webkit-scrollbar {
        width: 0px;
        background: transparent; /* make scrollbar transparent */
      }
    `}</style>
    <style jsx>{TimelineCss}</style>
  </>
);

export default Timeline;
