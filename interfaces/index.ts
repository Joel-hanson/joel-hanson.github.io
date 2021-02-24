export type Props = {
  title?: string;
};

export type RouterLinkInterface = {
  title?: string;
  href: string;
  position: string;
};

export type NavDetailInterface = {
  navTitle: string;
  navLink: string;
  navPosition: string;
};

export type NavItemsInterface = {
  items: NavDetailInterface[];
};

export type AnchorInterface = {
  link: string;
  color?: string;
  background?: string;
};

export type LayoutInterface = {
  title?: string;
};

export type PitstopInterface = {
  date: Date;
  shortTitle: string;
  description?: string;
  pinned?: boolean;
};

export type TimelineInterface = {
  items: PitstopInterface[];
};

export type workInterface = {
  month: string;
  year: number;
  title: string;
  description: string;
  github: string;
  website: string;
};

export type SocialLinksInterface = {
  name: string;
  link: string;
  hoverColor: string;
  index?: number
}