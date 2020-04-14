import Layout from '../components/Layout';
import Head from 'next/head';


const IndexPage = () => (
    <div className="main">
        <Head>
            <link href="https://fonts.googleapis.com/css2?family=Muli:wght@300;400;700&display=swap" rel="stylesheet"></link>
        </Head>
    
        <Layout title="Joel Hanson">
        
        </Layout>
        <style jsx>
            {`
                .main {
                    margin:0;
                    padding:0;
                    font-family: 'Muli', sans-serif;
                }
            `}  
        </style>
    </div>
)

export default IndexPage