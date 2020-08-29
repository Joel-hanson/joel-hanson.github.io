import Layout from "../components/Layout";
import * as React from "react";
import { withRouter } from "next/router";

const BlogPage: React.FunctionComponent = () => (
  <Layout title="Blogs | JoelHanson">
    <h1>Blogs</h1>
    <p>This is the blogs page</p>
  </Layout>
);

export default withRouter(BlogPage);
