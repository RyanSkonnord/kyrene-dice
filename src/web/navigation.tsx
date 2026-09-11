import { List, Map } from "immutable";
import { DIAMOND_SEPARATOR } from "../ui/util/symbols";
import { NavLink } from "react-router-dom";

export type StaticPage = {
    filename: string,
    slug: string,
};

export const STATIC_PAGE_DIRECTORY: Map<string, StaticPage> = (() => {
    const pages: List<StaticPage> = List([
        { filename: "About.md", slug: "about" },
        { filename: "Issues.md", slug: "issues" },
        { filename: "Disclaimers.md", slug: "disclaimers" },
        { filename: "MIT.md", slug: "license" },
    ]);

    return Map(pages.map((page) => [page.slug, page]));
})();



export function FooterNav() {
    const footerLinks: React.ReactNode[] = [
        <NavLink to='/'>Home</NavLink>,
        <NavLink to="/about">About</NavLink>,
        <a href="https://github.com/RyanSkonnord/kyrene-dice">Source Code</a>,
        <NavLink to="/issues">Known Issues</NavLink>,
        // <a href="https://github.com/RyanSkonnord/kyrene-dice/issues">Report a Bug</a>,
    ];

    return (<nav className="FooterNav">
        {footerLinks.map((node, index) => {
            return <span key={index}>
                {(index > 0) && (
                    <span className="navLinkBuffer">{' ' + DIAMOND_SEPARATOR + ' '}</span>
                )}
                {node}
            </span>;
        })}
    </nav>);
}
