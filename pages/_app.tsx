import React from "react";
import App from "next/app";
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  html {
    --color-text: black;
    --color-background: white;
    --color-primary: rebeccapurple;
    --font-xs: 16px;
    --font-s: 18px;
    --font-m: 20px;
    --font-l: 24px;
  }
`;

export default class MyApp extends App {
  // eslint-disable-next-line
  public render() {
    const { Component, pageProps } = this.props;

    return (
      <>
        <GlobalStyles />
        <Component {...pageProps} />
      </>
    );
  }
}
