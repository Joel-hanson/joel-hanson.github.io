import Layout from '../components/Layout'
import { withRouter } from 'next/router'
import { timelineItems } from '../utils/data'
import Anchor from '../components/Anchor'
import Timeline from '../components/Timeline'
import LayoutHeader from '../components/LayoutHeader'
import LayoutBody from '../components/LayoutBody'
import { Col } from 'react-grid-system';


const IndexPage: React.FunctionComponent = () => (
    <Layout title="JoelHanson | Home">
        <LayoutHeader>
            <p className="name-text">Hi! I'm Joel Hanson,</p>
            <p className="main-description">
                Working as a software engineer at <Anchor link="https://impress.ai" color="#ff9502" background="#ffeac2">impress.ai</Anchor>. Water is one of the most important substances that are needed for plants and animals. We cannot lead our day to day life without water. Water makes up more than half of our body weight. Without water, all organisms in the world would die. Water is necessary not only for drinking but also for our day to day life purposes like bathing, cooking, cleaning, and washing and so on. We cannot imagine a life without water.
            </p>
        </LayoutHeader>
        <LayoutBody>
            <Col>
                <span className="detailed-description">
                    Water is one of the most important substances that are needed for plants and animals.
                    We cannot lead our day to day life without water. Water makes up more than half of our body weight.
                    Without water, all organisms in the world would die.
                    Water is necessary not only for drinking but also for our day to day life purposes like bathing, cooking, cleaning, and washing and so on.
                    We cannot imagine a life without water.
                    Short descritiption
                </span>
            </Col>
            <Col className="timeline-col">
                <Timeline items={timelineItems}></Timeline>
                {/* <div className="fade"></div> */}
            </Col>
        </LayoutBody>
    </Layout>
)

export default withRouter(IndexPage)
