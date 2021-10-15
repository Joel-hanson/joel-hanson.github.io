import * as React from "react";
import { SocialLinksInterface } from "../interfaces";

const convertHex = (hexCode: string, opacity: number) => {
    var hex = hexCode.replace('#', '');

    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    var r = parseInt(hex.substring(0, 2), 16),
        g = parseInt(hex.substring(2, 4), 16),
        b = parseInt(hex.substring(4, 6), 16);

    return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
}

const SocialLink: React.FunctionComponent<SocialLinksInterface> = ({
    name,
    link,
    hoverColor,
    index
}) => (
    <>
        <a href={link} className="media-link">{name}</a>
        <style jsx>{`
        a {
            margin-left: ${index == 0 ? "" : "1.5rem"};
            color: #ef5350;
            flex-grow: 1;
            flex-basis: 0;
        }
        a:hover {
            color: ${convertHex(hoverColor, 80)};
        }
    `}</style>
    </>
);

export default SocialLink;
