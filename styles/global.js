import css from "styled-jsx/css";

export default css.global`
  @keyframes slideInFromLeft {
    0% {
      transform: translateY(-50%);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }  
  body {
    margin: 0;
    padding: 0;
    font-family: "Mulish", sans-serif;
  }
  .custom-container {
    margin: auto !important;
  }
  .main-text {
    font-size: var(--font-m);
    animation: .8s ease-in-out 0s 1 slideInFromLeft;
  }
  .name-text {
    font-size: 3rem;
    font-weight: 800;
  }
  .main-description {
    font-size: 1.5rem;
    font-weight: 500;
  }
  .detailed-description {
    font-size: 1.8rem;
    font-weight: 500;
  }
  .wrapper {
    max-width: 656px;
    padding: 0 5% 0 5%;
    margin: 0 auto;
  }
  .nav-left {
    background-image: none;
    margin-right: auto;
    margin-left: 0;
  }
  .layout-body {
    margin: 25px 0 100px 0;
    height: 100vh;
  }
  .layout-header {
    // margin: 7rem;
    display:flex;
    flex-direction: column;
  }
  .layout-content {
    flex-grow: 1;
  }
  .layout-container {
    margin-top: 1rem;
    display: grid;
    height: 100vh;
    align-items: center;
    justify-content: center;
  }
  .center-layout-container {
    display: grid;
    align-items: start;
  }
  .center-layout-text {
    margin-top: 1rem;
    max-width: 538px;
    justify-self: end;
  }
  .center-layout-link-container {
    display: flex;
    flex-direction: row;
    max-width: 100%;
    justify-content: space-between;
    margin-top: 0.5rem;
    justify-content: start;
  }
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
  .media-link {
    background-image: none;
    text-shadow: none;
    color: var(--text-secondary);
    font-size: var(--font-xs);
    color: var(--text-primary);
    font-weight: 400;
    background-image: linear-gradient(var(--text-underline),var(--text-underline));
    background-size: 100% 1px;
    background-position: left 1.15em;
    background-repeat: no-repeat;
    text-shadow: .1em 0 var(--bg-primary-hex),-.1em 0 var(--bg-primary-hex);
    text-decoration: none;
    animation: .8s ease-in-out 0s 1 slideInFromLeft;
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
  // .fade {
  //     background: linear-gradient(to bottom, rgba(100, 100, 100, 0) 0%, #646464 75%);
  //     height: 100px;
  //     margin-top: -100px;
  //     position: relative;
  // }
  .details-col {
    height: 100%;
  }
  .profile-icon {
    border-radius: 50%;
    width: 15%;
    height: auto;
    animation: .8s ease-in-out 0s 1 slideInFromLeft;
  }
`;
