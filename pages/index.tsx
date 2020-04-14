import Layout from '../components/Layout'
import { withRouter } from 'next/router'

const IndexPage: React.FunctionComponent = () => (
    <Layout title="About | JoelHanson">
        <h1>About</h1>
        <p>This is the about page</p>
    </Layout>
)

export default withRouter(IndexPage)
