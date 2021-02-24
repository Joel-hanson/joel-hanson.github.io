import * as React from "react";
import Layout from "../components/Layout";
import { withRouter } from "next/router";
import { Col, Row } from "react-grid-system";
import WorkCard from "../components/WorkCard";
import { workItems } from "../utils/data";

const WorksPage: React.FunctionComponent = () => (
  <Layout title="Work | JoelHanson">
    <div className="work-container">
      {workItems.map((work, index) => (
        <WorkCard
          key={index}
          month={work.month}
          year={work.year}
          title={work.title}
          description={work.description}
          github={work.github}
          website={work.website}
        ></WorkCard>
      ))}
    </div>
    <style jsx>{`
      .work-container {
        margin-top: 15%;
      }
    `}</style>
  </Layout>
);

export default withRouter(WorksPage);
