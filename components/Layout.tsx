import * as React from 'react';
// import Link from 'next/link';
import Head from 'next/head';
import { Props, navDetails, routerLink } from '../interfaces';
import { navItems } from '../utils/data'
import { Container } from 'react-grid-system';
import { useRouter } from 'next/router'
import globalStyles from '../styles/global.js'


const ActiveLink: React.FunctionComponent<routerLink> = ({ children, href }) => {
    const router = useRouter()
    const style = {
        margin: "12px",
        color: router.pathname === (href || "") ? 'red' : '#353535',
        textDecoration: 'none',
    }

    const handleClick = (e: { preventDefault: () => void; }) => {
        e.preventDefault()
        router.push(href)
    }

    return (
        <a href={href} onClick={handleClick} style={style} >
            {children}
        </a>
    )
}

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
                <ActiveLink href={navDetail.navLink} key={navDetail.navTitle}>
                    {navDetail.navTitle}
                </ActiveLink>
                // <Link href={{ pathname: navDetail.navLink, query: navDetail.navTitle }} key={navDetail.navTitle} >
                //     <a className="nav-title">{navDetail.navTitle}</a>
                // </Link>
            ))}
        </nav>
        <style jsx>{`
            .header {
                width: 100%;
                text-align: right;
                height: 30px;
            }
            .nav {
                padding: 16px;
            }
        `}</style>
    </header>
);

const Layout: React.FunctionComponent<Props> = ({
    children,
    title = 'title',
}) => (
        <div>
            <Container>
                <Head>
                    <title>{title}</title>
                    <meta charSet="utf-8" />
                    <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                    <link href="https://fonts.googleapis.com/css2?family=Muli:wght@300;400;700&display=swap" rel="stylesheet"></link>
                </Head>
                <Header items={navItems}></Header>
                {children}
                <Footer title="Build with Next.js"></Footer>
            </Container>
            <style jsx global>
                {globalStyles}
            </style>
        </div>
    )

export default Layout;