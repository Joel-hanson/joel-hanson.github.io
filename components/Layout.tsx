import * as React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Props, navDetails } from '../interfaces';
import { Container } from 'react-grid-system';
import { navItems } from '../utils/data'

const Footer: React.FunctionComponent<Props> = ({ title }) => (
    <footer className="footer">
        <span>{title}</span>
        <style jsx>{`
            .footer {
                text-align: center;
                position: fixed;
                left: 0;
                bottom: 0;
                height: 30px;
                width: 100%;
        `}</style>
    </footer>
);

const Header: React.FunctionComponent<navDetails> = ({ items }) => (
    <header className="header">
        <nav className="nav">
            {items.map(navDetail => (
                    <Link href={{ pathname: navDetail.navLink, query: navDetail.navTitle }} key={navDetail.navTitle} >
                        <a className="nav-title">{navDetail.navTitle}</a>
                    </Link>
            ))}
        </nav>
        <style jsx>{`
            .header {
                width: 100%;
                text-align: right;
            }
            .nav-title {
                margin: 12px;
                color: #353535;
                text-decoration: none;                
            }
        `}</style>
    </header>
);

const Layout: React.FunctionComponent<Props> = ({
    children,
    title = 'title',
}) => (
        <Container>
            <div>
                <Head>
                    <title>{title}</title>
                    <meta charSet="utf-8" />
                    <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                </Head>
                <Header items={navItems}></Header>
                {children}
                <Footer title="Build with nextjs"></Footer>
            </div>
        </Container>
    )

export default Layout;