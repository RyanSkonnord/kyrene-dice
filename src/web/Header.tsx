import { NavLink } from "react-router-dom";
import "./Header.scss";

export function Header() {
    return (<header className="Header">
        <div className="appTitle">
            <NavLink to='/'>
                Kyrene Dice
            </NavLink>
        </div>
        <div className="appBlurb">
            A dice roller and probability calculator for
            dice pool&ndash;based roleplaying games
        </div>
        <div
            className="appBlurb"
            style={{ color: 'pink', fontVariantCaps: 'small-caps' }}
        >
            Alpha Version
        </div>
    </header>);
}
