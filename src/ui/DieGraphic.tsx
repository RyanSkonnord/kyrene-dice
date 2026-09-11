import "./DieGraphic.scss";

import { Set } from "immutable";

import { DieEffect, DieReport, DieTag } from "../gamerules/dice";
import { DIE_EFFECT_EMOJIS } from "./util/symbols";

type DiePropertyStyle = {
    cssClassName: string,
    caption: string,
}

const DIE_TAG_STYLES: Record<DieTag, DiePropertyStyle> = {
    [DieTag.AGAIN]: { cssClassName: "again", caption: "Again" },
    [DieTag.NIGHTMARE]: { cssClassName: "nightmare", caption: "Nightmare" },
    [DieTag.HUNGER]: { cssClassName: "hunger", caption: "Hunger" },
};
const DIE_EFFECT_STYLES: Record<DieEffect, DiePropertyStyle> = {
    [DieEffect.CRITICAL_MISS]: { cssClassName: "criticalMiss", caption: "Crit Miss" },
    [DieEffect.MISS]: { cssClassName: "miss", caption: "Miss" },
    [DieEffect.HIT]: { cssClassName: "hit", caption: "Hit" },
    [DieEffect.CRITICAL_HIT]: { cssClassName: "criticalHit", caption: "Crit Hit" },
};

function unpackDieTag(tags: Set<DieTag>): DiePropertyStyle | null {
    // TODO: Handle possibility of multiple tags on the same die
    // For now, just look for them in priority order.
    for (const tag of [DieTag.AGAIN, DieTag.HUNGER, DieTag.NIGHTMARE]) {
        if (tags.includes(tag)) { return DIE_TAG_STYLES[tag]; }
    }
    return null;
}

type DieGraphicProps = { die: DieReport };
export default function DieGraphic(
    { die: { face, effect, tags } }: DieGraphicProps
) {
    const tagStyle = unpackDieTag(tags);
    const tagClasses: string[] = tagStyle ? [tagStyle.cssClassName] : [];

    const tagCaption: React.ReactNode = tagStyle?.caption
        ?? (<span>&nbsp;</span>); // TODO: Better fix for keeping dice vertically aligned with no caption

    const { cssClassName: effectClass, caption: effectCaption } = DIE_EFFECT_STYLES[effect];
    const effectIcon = DIE_EFFECT_EMOJIS[effect];

    return (<div className="DieGraphic">
        <div className="outer">
            <div className="tagCaption">{tagCaption}</div>
            <div className={["dieBody", ...tagClasses].join(' ')}>
                <div className={["dieFace", effectClass].join(' ')}>
                    <div className="dieNumeral">{face}</div>
                    {false && <div className="cornerIcon">{effectIcon}</div>}
                </div>
            </div>
            <div className="effectCaption">{effectCaption}</div>
        </div>
    </div>);
}
