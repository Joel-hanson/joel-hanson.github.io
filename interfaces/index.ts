export type Props = {
    title?: string;
}

export type routerLink = {
    title?: string;
    href : string;
}

export type navDetail = {
    navTitle: string;
    navLink: string;
}

export type navDetails = {
    items: navDetail[]
}