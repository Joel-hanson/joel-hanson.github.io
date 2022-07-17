import * as React from "react";
import Layout from "../components/Layout";
import { withRouter } from "next/router";
import Anchor from "../components/Anchor";
import LayoutHeader from "../components/LayoutHeader";
import SocialLink from "../components/SocialLinks";
import { socialItems } from "../utils/data";


const IndexPage: React.FunctionComponent = () => (
  <Layout title="JoelHanson | Home">
    <LayoutHeader>
      <div className="center-layout-container">
        <div className="center-layout-image">
          <img src="/images/profileIcon.jpg" alt="icon" className="profile-icon" width="15%" height="15%" />
        </div>
        <div className="center-layout-text">
          <p className="main-text">
            My name is Joel Hanson, and I&lsquo;m a <b>Software Engineer</b> at {" "}
            <Anchor link="https://ibm.com" color="#0f62fe" background="#82cfff">
              IBM
            </Anchor>
            {" "}right now.
            I formerly worked at <Anchor link="https://impress.ai" color="#ff9502" background="#ffeac2">
              impress.ai
            </Anchor> as an <b>AI Engineer</b>. I&lsquo;m now working on ways to make artificial intelligence (AI) more accessible to the general population.
          </p>

          <p className="main-text">Please see my <Anchor link="/files/Profile.pdf" color="#E53935" background="#FFCDD2">
            resume
          </Anchor> if you want to learn more about me.
          </p>
        </div>
        <div className="center-layout-link-container">
          {
            socialItems.map(
              (item, index) => (
                <SocialLink name={item.name} key={index} link={item.link} hoverColor={item.hoverColor} index={index}></SocialLink>
              )
            )
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
