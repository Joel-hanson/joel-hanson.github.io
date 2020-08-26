import * as React from 'react';
import { AnchorInterface } from '../interfaces';
import globalStyles from '../styles/global.js'


const Anchor: React.FunctionComponent<AnchorInterface> = ({ children, link, color, background }) => (
    <>
        <a href={link}>{children}</a>
        <style jsx>{`
            a {
                color: ${color};
                background: ${background};
                text-decoration: underline;
            }
        `}</style>
    </>
);


export default Anchor;