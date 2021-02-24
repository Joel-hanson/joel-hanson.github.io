import * as React from "react";

const LayoutHeader: React.FunctionComponent = ({ children }) => (
  <div className="layout-header">
    <div className="layout-content">
      <div className="wrapper">
        <div className="layout-container">
          
          {children}
          
        </div>
      </div>
    </div>
  </div>
);

export default LayoutHeader;
