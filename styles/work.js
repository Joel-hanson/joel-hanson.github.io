import css from "styled-jsx/css";

export default css.global`
  .work-month-year {
    text-align: center;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: #fee0e0;
    color: #ef5350;
  }
  .work-month-year-col {
    padding: 15px;
  }
  .work-month {
    font-size: 35px;
  }
  .work-title {
    font-size: 32px;
    font-weight: 300;
  }
  .work-description {
    line-height: 1.6;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
  }
  .work-card {
    margin: 10% 0;
    box-shadow: 0px 2px 14px 0px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.1s ease, transform 0.1s ease,
      -webkit-box-shadow 0.1s ease, -webkit-transform 0.1s ease;
    border-radius: 10px;
    border: 1px solid #f3f3f3;
    border-top: 1px solid #ffb5b3;
  }
  .title-description-col {
    padding: 16px;
    color: #484d4e;
  }
  .work-icons {
    float: right;
  }
  .icon-container {
    margin: 0 6px;
    display: inline-block;
  }
`;
