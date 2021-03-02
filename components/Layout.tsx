import * as React from "react";
// import Link from 'next/link';
import Head from "next/head";
import {
  Props,
  NavItemsInterface,
  RouterLinkInterface,
  LayoutInterface,
} from "../interfaces";
import { useRouter } from "next/router";
import globalStyles from "../styles/global.js";
import { navItems } from "../utils/data";

const ActiveLink: React.FunctionComponent<RouterLinkInterface> = ({
  children,
  href,
  position,
}) => {
  const router = useRouter();
  const style = {
    padding: "12px",
    color: router.pathname === (href || "") ? "#ef5350" : "#353535",
    textDecoration: "none",
    fontSize: "var(--font-s)",
  };

  const handleClick = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <a href={href} onClick={handleClick} style={style} className={position == "left" ? "nav-left" : ""}>
      {children}
    </a>
  );
};

const Footer: React.FunctionComponent<Props> = ({ title }) => (
  <footer className="footer">
    <span>{title}</span>
    <style jsx>{`
            .footer {
                text-align: left;
                left: 0;
                bottom: 0;
                height: 30px;
                width: 100%;
                font-size: 10px;
                margin: 0 12px;
        `}</style>
  </footer>
);

const Header: React.FunctionComponent<NavItemsInterface> = ({ items }) => (
  <header className="header">
    <div className="wrapper">
        <nav className="container">
          {items.map((navDetails) => (
            <ActiveLink
              href={navDetails.navLink}
              key={navDetails.navTitle}
              position={navDetails.navPosition}
            >
              {navDetails.navTitle}
            </ActiveLink>
            // <Link href={{ pathname: navDetails.navLink, query: navDetails.navTitle }} key={navDetails.navTitle} >
            //     <a className="nav-title">{navDetails.navTitle}</a>
            // </Link>
          ))}
        </nav>
    </div>
    <style jsx>{`
      .header {
        padding: 0.35rem 0;
        position: fixed;
        top: 0;
        width: 100%;
        padding: 0.55rem 0;
        backdrop-filter: blur(8px);
        z-index: 10;
      }
      .container {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
      }
    `}</style>
  </header>
);

const Layout: React.FunctionComponent<LayoutInterface> = ({
  children,
  title = "title",
}) => (
  <div>
    <div className="custom-container">
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Header items={navItems}></Header>
      {children}
      {/* <Footer title="Build with Next.js"></Footer> */}
    </div>
    <style jsx global>
      {globalStyles}
    </style>
  </div>
);

export default Layout;
