import Layout from '../components/Layout'
import { withRouter } from 'next/router'

const WorksPage: React.FunctionComponent = () => (
    <Layout title="Work | JoelHanson">
        <h1>Works</h1>
        <p>This is the works page</p>
    </Layout>
)

export default withRouter(WorksPage)
