import * as React from "react";
import { SocialLinksInterface } from "../interfaces";


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
        }
        a:hover {
            color: ${hoverColor};
        }
    `}</style>
    </>
);

export default SocialLink;
