import './Info.scss';
import { Tooltip } from "react-tooltip";
import { INFO_ICON } from './symbols';

type InfoProps = {
    id: string,
    children: React.ReactNode,
};
export default function Info({ id, children }: InfoProps) {
    return (
        <span className="Info">
            <a data-tooltip-id={id}>{INFO_ICON}</a>
            <Tooltip id={id} clickable>{children}</Tooltip>
        </span>
    );
}
