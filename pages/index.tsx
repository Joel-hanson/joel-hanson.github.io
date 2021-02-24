import * as React from "react";
import Layout from "../components/Layout";
import { withRouter } from "next/router";
import { timelineItems } from "../utils/data";
import Anchor from "../components/Anchor";
import Timeline from "../components/Timeline";
import LayoutHeader from "../components/LayoutHeader";
import SocialLink from "../components/SocialLinks";
import LayoutBody from "../components/LayoutBody";
import { Col } from "react-grid-system";
import styled from "styled-components";
import { socialItems } from "../utils/data";


const IndexPage: React.FunctionComponent = () => (
  <Layout title="JoelHanson | Home">
    <LayoutHeader>
      <div className="center-layout-container">
        <div className="center-layout-image">
          <img src="/images/profileIcon.jpg" alt="icon" className="profile-icon" />
        </div>
        <div className="center-layout-text">
          <p className="main-text">
            Joel Hanson is a <b>Software Engineer / AI Engineer</b> in India. He creates intuitive and creative solutions with the best of his skills and knowledge.
          </p>
          <p className="main-text">
            He currently works at {" "}
            <Anchor link="https://impress.ai" color="#ff9502" background="#ffeac2">
              impress.ai
            </Anchor>.
          </p>
        </div>
        <div className="center-layout-link-container">
          {
            socialItems.map((item, index) => (<SocialLink name={item.name} key={index} link={item.link} hoverColor={item.hoverColor} index={index}></SocialLink>))
          }
        </div>
      </div>
    </LayoutHeader>
    {/* <LayoutBody>
      <Col className="timeline-col">
        <Timeline items={timelineItems}></Timeline>
      </Col>
      <Col className="details-col">
        <span className="detailed-description">
          Water is one of the most important substances that are needed for
          plants and animals. We cannot lead our day to day life without water.
          Water makes up more than half of our body weight. Without water, all
          organisms in the world would die. Water is necessary not only for
          drinking but also for our day to day life purposes like bathing,
          cooking, cleaning, and washing and so on. We cannot imagine a life
          without water. Short descritiption
        </span>
      </Col>
    </LayoutBody> */}
  </Layout>
);

export default withRouter(IndexPage);
