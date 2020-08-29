import React from "react";
import App from "next/app";

export default class MyApp extends App {
  // eslint-disable-next-line
  public render() {
    const { Component, pageProps } = this.props;

    return (
      <>
        <Component {...pageProps} />
      </>
    );
  }
}
