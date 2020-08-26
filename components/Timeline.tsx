import * as React from 'react';
import { TimelineInterface, PitstopInterface } from '../interfaces';
import globalStyles from '../styles/global.js'




const TimelineHeader: React.FunctionComponent<PitstopInterface> = ({ date, shortTitle, description, pinned }) => {
    return (
        <div className="header-container">
            {shortTitle}
            <style jsx>{`
                .header-container {
                    position: fixed;
                    z-index: 2;
                    background: grey;
                    border-radius: 2px;
                    padding: 20px;
                    width: 40%;
                    margin-left: 10px;
                }
            `}
            </style>
        </div>
    )
};


const Pitstop: React.FunctionComponent<PitstopInterface> = ({ date, shortTitle, description, pinned }) => {
    const formatDate = (date: Date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let formatted_date = new Intl.DateTimeFormat('en-US', options).format(date)
        return formatted_date
    }

    return (
        <div className="pitstop-wrapper">
            <div className="event-card">
                <div className="event-icon"></div>
                <span className="event-date">{formatDate(date)}</span>
                <div className="event-description">{shortTitle}</div>
            </div>
            <style jsx>{`
                .pitstop-wrapper {
                    margin: 30px;
                }
                .event-card {
                    margin-left: 10px;
                    padding: 20px;
                    height: 20%;
                    width: 90%;
                    background: #f2f2f2;
                    border-radius: 10px;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                }
                .event-date {
                    color: #ef5350;
                    font-weight: 600;
                }
                .event-description {
                    margin: 20px 0;
                }
                .event-card:before {
                    content: '';
                    position: absolute;
                    left: 26px;
                    height: 0;
                    width: 0;
                    border: 7px solid transparent;
                    border-right: 7px solid #f2f2f2;
                }
                .event-icon {
                    content: '';
                    position: absolute;
                    left: 10px;
                    height: 0;
                    width: 0;
                    border: 7px solid #f2f2f2;
                    border-radius: 50%;
                    z-index: 1;
                }
            `}
            </style>
        </div>
    )
};

const Timeline: React.FunctionComponent<TimelineInterface> = ({ items }) => (
    <>
        <div className="timeline-container">
            <div className="pitstop-container">
            <div className="line"></div>
                {items.map((item, index) => (
                    <Pitstop key={index} date={item.date} shortTitle={item.shortTitle} description={item.description}></Pitstop>
                ))}
            </div>
        </div>
        <style jsx>{`
            .timeline-container {
                position: relative;
                display: inline-block;
                width: 50%;
                max-height: 500px;
                overflow: scroll;
            }
            .pitstop-container {
                margin-top: 100px
            }
            .line {
                position: absolute;
                top: 0px;
                height: inherit;
                width: 2px;
                background: rgb(160, 178, 184);
                left: 16px;
            }
    `}</style>
    </>
);


export default Timeline;