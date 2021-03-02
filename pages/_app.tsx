import React from "react";
import App from "next/app";
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  html {
    --color-text: black;
    --color-background: white;
    --color-primary: rebeccapurple;
    --font-s: 16px;
    --font-m: 18px;
    --font-l: 20px;
    --font-xl: 24px;
  }
  /* mulish-regular - latin */
  @font-face {
    font-family: 'Mulish';
    font-style: normal;
    font-weight: 400;
    src: url('/fonts/mulish-v3-latin-regular.eot'); /* IE9 Compat Modes */
    src: local('Mulish'),
        url('/fonts/mulish-v3-latin-regular.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('/fonts/mulish-v3-latin-regular.woff2') format('woff2'), /* Super Modern Browsers */
        url('/fonts/mulish-v3-latin-regular.woff') format('woff'), /* Modern Browsers */
        url('/fonts/mulish-v3-latin-regular.ttf') format('truetype'), /* Safari, Android, iOS */
        url('/fonts/mulish-v3-latin-regular.svg#Mulish') format('svg'); /* Legacy iOS */
  }
  /* mulish-700 - latin */
  @font-face {
    font-family: 'Mulish';
    font-style: normal;
    font-weight: 700;
    src: url('/fonts/mulish-v3-latin-700.eot'); /* IE9 Compat Modes */
    src: local(''),
        url('/fonts/mulish-v3-latin-700.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('/fonts/mulish-v3-latin-700.woff2') format('woff2'), /* Super Modern Browsers */
        url('/fonts/mulish-v3-latin-700.woff') format('woff'), /* Modern Browsers */
        url('/fonts/mulish-v3-latin-700.ttf') format('truetype'), /* Safari, Android, iOS */
        url('/fonts/mulish-v3-latin-700.svg#Mulish') format('svg'); /* Legacy iOS */
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
