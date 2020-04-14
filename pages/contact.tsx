import Layout from '../components/Layout'
import { withRouter } from 'next/router'

const ContactPage: React.FunctionComponent = () => (
    <Layout title="Contact | JoelHanson">
        <h1>Contact</h1>
        <p>This is the contact page</p>
    </Layout>
)

export default withRouter(ContactPage)
