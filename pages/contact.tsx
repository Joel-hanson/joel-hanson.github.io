import { withRouter } from "next/router";
import * as React from "react";
import Layout from "../components/Layout";
import LayoutHeader from "../components/LayoutHeader";
import { Props } from "../interfaces";
import { MyEmail } from "../utils/data";

const CopyEmail: React.FunctionComponent<Props> = () => {
  const style = {
    padding: "12px",
    textDecoration: "none",
    fontSize: "var(--font-s)",
    cursor: "pointer"
  };

  const handleClick = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    let emailAddress = MyEmail;
    window.location.href = "mailto:" + emailAddress.replace("[at]", "@");
  };

  return (
    <a onClick={handleClick} style={style}>
      {MyEmail}
    </a>
  );
};


const ContactPage: React.FunctionComponent = () => (
  <Layout title="Contact | JoelHanson">
    <LayoutHeader>
      <CopyEmail></CopyEmail>
    </LayoutHeader>
  </Layout>
);

export default withRouter(ContactPage);
