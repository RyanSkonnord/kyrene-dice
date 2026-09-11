import Info from "./util/Info";

type InfoLabelProps = {
    id: string,
    label: React.ReactNode,
    children: React.ReactNode,
};
export function InfoLabel({ id, label, children }: InfoLabelProps) {
    return (
        <span className="InfoLabel">
            <span className="label">{label}</span>
            <Info id={id}>
                {children}
            </Info>
        </span>
    );
}