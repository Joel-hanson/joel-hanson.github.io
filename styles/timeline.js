import css from "styled-jsx/css";

export default css.global`
  .timeline {
    line-height: 1.4em;
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
  }
  .timeline h1,
  .timeline h2,
  .timeline h3,
  .timeline h4,
  .timeline h5,
  .timeline h6 {
    line-height: inherit;
  }

  /*----- TIMELINE ITEM -----*/
  .timeline-item {
    padding-left: 40px;
    position: relative;
  }
  .timeline-item:last-child {
    padding-bottom: 0;
  }

  /*----- TIMELINE INFO -----*/
  .timeline-info {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 3px;
    margin: 0 0 0.5em 0;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /*----- TIMELINE MARKER -----*/
  .timeline-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 15px;
  }
  .timeline-marker:before {
    background: #ff6b6b;
    border: 3px solid transparent;
    border-radius: 100%;
    content: "";
    display: block;
    position: absolute;
    top: 4px;
    left: 0;
    height: 10px;
    width: 10px;
    transition: background 0.3s ease-in-out, border 0.3s ease-in-out;
  }
  .timeline-marker:after {
    content: "";
    width: 3px;
    background: #ccd5db;
    display: block;
    position: absolute;
    top: 24px;
    bottom: 0;
    left: 7px;
  }
  // .timeline-item:last-child  .timeline-marker:after {
  //     content: none;
  // }

  .timeline-item:not(.period):hover .timeline-marker:before {
    background: transparent;
    border: 3px solid #ff6b6b;
  }

  /*----- TIMELINE CONTENT -----*/
  .timeline-content {
    padding-bottom: 40px;
  }
  .timeline-content p:last-child {
    margin-bottom: 0;
  }

  /*----- TIMELINE PERIOD -----*/
  .period {
    padding: 0;
  }
  .period .timeline-info {
    display: none;
  }
  .period .timeline-marker:before {
    background: transparent;
    content: "";
    width: 15px;
    height: auto;
    border: none;
    border-radius: 0;
    top: 0;
    bottom: 30px;
    position: absolute;
    border-top: 3px solid #ccd5db;
    border-bottom: 3px solid #ccd5db;
  }
  .period .timeline-marker:after {
    content: "";
    height: 32px;
    top: auto;
  }
  .period .timeline-content {
    padding: 40px 0 70px;
  }
  .period .timeline-title {
    margin: 0;
  }
`;
