export type ShapeProps = { rotate?: string, children: React.ReactNode };
export function Shape({ rotate, children }: ShapeProps) {
    return (<svg className="GoalVizShape" viewBox="0 0 100 100" aria-hidden="true" style={{ rotate }}>
        {children}
    </svg>)
}

export const CIRCLE = (<Shape><circle cx="50" cy="50" r="45" /></Shape>);
export const STAR = (<Shape><polygon points="50,5 61,36 95,36 68,56 79,90 50,70 21,90 32,56 5,36 39,36" /></Shape>);
const plusPolygon = (<polygon points="35,5 65,5 65,35 95,35 95,65 65,65 65,95 35,95 35,65 5,65 5,35 35,35" />);
export const PLUS = (<Shape>{plusPolygon}</Shape>);
export const CROSS = (<Shape rotate="45deg">{plusPolygon}</Shape>);
