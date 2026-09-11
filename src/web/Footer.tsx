import './Footer.scss';

import { NavLink } from 'react-router-dom';

import { FooterNav } from "./navigation";

export function Footer() {
    return (<footer className="Footer">
        <FooterNav />
        <p>
            &copy;2026 <a href="https://github.com/RyanSkonnord/">Ryan Skonnord</a>.
            This open-source application is available under the <NavLink to="/license">MIT License</NavLink>.
        </p>
        <p>
            This unofficial, independent project is not affiliated with or endorsed by Paradox Interactive AB
            or any other publishers or owners of the games whose names or rules are mentioned.
        </p>
        <p>
            As far as the law allows,{' '}
            <strong>
                this application is provided as is, without warranties or conditions of any kind.
            </strong>{' '}
            See <NavLink to="/disclaimers">Disclaimers</NavLink>.
        </p>
    </footer>);
}
