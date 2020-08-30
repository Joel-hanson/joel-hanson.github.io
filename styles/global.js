import css from "styled-jsx/css";

export default css.global`
  body {
    margin: 0;
    padding: 0;
    font-family: "Muli", sans-serif;
  }
  .custom-container {
    margin: auto !important;
  }
  .name-text {
    font-size: 3rem;
    font-weight: 800;
  }
  .main-description {
    font-size: 2rem;
    font-weight: 600;
  }
  .detailed-description {
    font-size: 1.8rem;
    font-weight: 500;
  }
  .layout-body {
    margin: 25px 0 100px 0;
    height: 550px;
  }
  // .timeline-col:before {
  //     width: 100%;
  //     box-shadow: 0 2px 2px -1px rgba(0,0,0,.1);
  //     border-bottom: 1px solid #e5e5e5;
  //     position: absolute;
  //     margin-top: -5px;
  //     left: 22px;
  //     height: 4px;
  //     content: "";
  // }
  .timeline-col {
    height: 100%;
  }
  .timeline-col:after {
    width: 100%;
    left: 22px;
    // box-shadow: 0 -2px 2px -1px rgba(0, 0, 0, 0.1);
    position: absolute;
    height: 4px;
    content: "";
    bottom: -4px;
  }
  .layout-header {
    margin: 6rem 0;
  }
  // .fade {
  //     background: linear-gradient(to bottom, rgba(100, 100, 100, 0) 0%, #646464 75%);
  //     height: 100px;
  //     margin-top: -100px;
  //     position: relative;
  // }
  .details-col {
    height: 100%;
  }
`;
