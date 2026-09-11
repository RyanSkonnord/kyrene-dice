import { FifthGoalItem, FifthGoalNode } from "../gamerules/rulesystems/fifth";
import { CIRCLE, CROSS, PLUS, STAR } from './shapes';

const ITEM_SYMBOLS: Record<FifthGoalItem, React.ReactNode> = {
    empty: [],
    hit: CIRCLE,
    bestial: CROSS,
    messy: STAR,
    critical: STAR,
    bonus: PLUS,
} as const;

type GoalBallProps = { node: FifthGoalNode };
function GoalBall({ node: { item, isWithinDifficulty } }: GoalBallProps): React.ReactElement {
    return (<div className="GoalBall">
        <div className={`ballOutline ${isWithinDifficulty ? "target" : "excess"}`}>
            <div className={`ballFill ${item}`}>
                {ITEM_SYMBOLS[item]}
            </div>
        </div>
    </div>);
}

type GoalVizProps = { nodes: FifthGoalNode[] };
export default function GoalViz({ nodes }: GoalVizProps) {
    return (<div className="GoalViz">
        {nodes.map((node, index) => (<GoalBall key={index} node={node} />))}
    </div>);
}
