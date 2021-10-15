import {
  NavDetailInterface,
  PitstopInterface,
  workInterface,
  SocialLinksInterface,
} from "../interfaces";

/** The link details. */
export const navItems: NavDetailInterface[] = [
  { navTitle: "Joel Hanson", navLink: "/", navPosition: "left" },
  // { navTitle: "Work", navLink: "/work", navPosition: "right" },
  // { navTitle: "Blogs", navLink: "/blogs", navPosition: "right" },
  { navTitle: "Email", navLink: "/contact", navPosition: "right" },
];

export const timelineItems: PitstopInterface[] = [
  {
    date: new Date(),
    shortTitle:
      "Knight Rider, a shadowy flight into the dangerous world of a man who does not exist.",
    description:
      "Knight Rider, a shadowy flight into the dangerous world of a man who does not exist.",
    pinned: true,
  },
  {
    date: new Date(),
    shortTitle:
      "There’s a voice that keeps on calling me. Down the road, that’s where I’ll always be.",
    description:
      "Knight Rider, a shadowy flight into the dangerous world of a man who does not exist.",
    pinned: false,
  },
  {
    date: new Date(),
    shortTitle:
      "Every stop I make, I make a new friend. Can’t stay for long, just turn around and I’m gone again.",
    description:
      "Knight Rider, a shadowy flight into the dangerous world of a man who does not exist.",
    pinned: false,
  },
  {
    date: new Date(),
    shortTitle:
      "Maybe tomorrow, I’ll want to settle down, Until tomorrow, I’ll just keep moving on.",
    description:
      "Knight Rider, a shadowy flight into the dangerous world of a man who does not exist.",
    pinned: false,
  },
  {
    date: new Date(),
    shortTitle:
      "Knight Rider, a shadowy flight into the dangerous world of a man who does not exist.",
    description:
      "Knight Rider, a shadowy flight into the dangerous world of a man who does not exist.",
    pinned: false,
  },
  {
    date: new Date(),
    shortTitle:
      "There’s a voice that keeps on calling me. Down the road, that’s where I’ll always be.",
    description:
      "Knight Rider, a shadowy flight into the dangerous world of a man who does not exist.",
    pinned: false,
  },
  {
    date: new Date(),
    shortTitle:
      "Every stop I make, I make a new friend. Can’t stay for long, just turn around and I’m gone again.",
    description:
      "Knight Rider, a shadowy flight into the dangerous world of a man who does not exist.",
    pinned: false,
  },
  {
    date: new Date(),
    shortTitle:
      "Maybe tomorrow, I’ll want to settle down, Until tomorrow, I’ll just keep moving on.",
    description:
      "Knight Rider, a shadowy flight into the dangerous world of a man who does not exist.",
    pinned: false,
  },
];

export const workItems: workInterface[] = [
  {
    month: "March",
    year: 2020,
    title: "The Title",
    description:
      "Water is one of the most important substances that are needed for plants and animals. We cannot lead our day to day life without water. Water makes up more than half of our body weight. Without water, all organisms in the world would die. Water is necessary not only for drinking but also for our day to day life purposes like bathing, cooking, cleaning, and washing and so on. We cannot imagine a life without water.",
    github: "https://github.com",
    website: "https://joel-hanson.github.io",
  },
  {
    month: "March",
    year: 2020,
    title: "The Title",
    description:
      "Water is one of the most important substances that are needed for plants and animals. We cannot lead our day to day life without water. Water makes up more than half of our body weight. Without water, all organisms in the world would die. Water is necessary not only for drinking but also for our day to day life purposes like bathing, cooking, cleaning, and washing and so on. We cannot imagine a life without water.",
    github: "",
    website: "",
  },
  {
    month: "March",
    year: 2020,
    title: "The Title",
    description:
      "Water is one of the most important substances that are needed for plants and animals. We cannot lead our day to day life without water. Water makes up more than half of our body weight. Without water, all organisms in the world would die. Water is necessary not only for drinking but also for our day to day life purposes like bathing, cooking, cleaning, and washing and so on. We cannot imagine a life without water.",
    github: "https://github.com",
    website: "",
  },
  {
    month: "March",
    year: 2020,
    title: "The Title",
    description:
      "Water is one of the most important substances that are needed for plants and animals. We cannot lead our day to day life without water. Water makes up more than half of our body weight. Without water, all organisms in the world would die. Water is necessary not only for drinking but also for our day to day life purposes like bathing, cooking, cleaning, and washing and so on. We cannot imagine a life without water.",
    github: "",
    website: "https://joel-hanson.github.io",
  },
];

export const socialItems: SocialLinksInterface[] = [
  {
    "name": "GitHub",
    "link": "https://github.com/joel-hanson",
    "hoverColor": "#24292e"
  },
  {
    "name": "Twitter",
    "link": "https://twitter.com/joelhanson25",
    "hoverColor": "#1DA1F2"
  },
  {
    "name": "Medium",
    "link": "https://joel-hanson.medium.com/",
    "hoverColor": "#24292e"
  },
  {
    "name": "LinkedIn",
    "link": "https://linkedin.com/in/joel-hanson/",
    "hoverColor": "#2867B2"
  },
  // {
  //   "name": "Resume",
  //   "link": "/files/Profile.pdf",
  //   "hoverColor": "#2867B2"
  // },
];

export const MyEmail: string = "joel" + "hanson025" + "[at]" + "gmail.com";
