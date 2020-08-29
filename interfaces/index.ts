export type Props = {
  title?: string;
};

export type RouterLinkInterface = {
  title?: string;
  href: string;
};

export type NavDetailInterface = {
  navTitle: string;
  navLink: string;
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
