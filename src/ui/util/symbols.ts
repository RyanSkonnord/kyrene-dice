import { DieEffect } from "../../gamerules/dice";
import { FifthRollNature } from "../../gamerules/rulesystems/fifth";

export const MINUS = "\u2212"; // −

export const DIAMOND_SEPARATOR = "\u2756"; // ❖

export const INCREMENT = "\u25b2"; // ▲
export const DECREMENT = "\u25bc"; // ▼
export const ROW_INDICATOR = "\u25b6"; // ▶
export const COLUMN_INDICATOR = "\u25bc"; // ▼
export const HINT_ICON = "\u{1F4A1}"; // 💡
export const INFO_ICON = "\u2139"; // ℹ

export const DIE_EFFECT_EMOJIS: Record<DieEffect, string> = {
    [DieEffect.CRITICAL_MISS]: "\u274c", // ❌
    [DieEffect.MISS]: "\ud83d\udec7", // 🛇
    [DieEffect.HIT]: "\u2705", // ✅
    [DieEffect.CRITICAL_HIT]: "\u2b50", // ⭐
};

export const BONUS_EMOJI = "\u2795"; // ➕
export const HUNGER_EMOJI = "\ud83d\udc3a"; // 🐺
export const NIGHTMARE_EMOJI = "\ud83d\ude31"; // 😱

export const NATURE_EMOJIS: Record<FifthRollNature, string> = {
    [FifthRollNature.FAILURE]: "\ud83d\udc4e", // 👎
    [FifthRollNature.WIN]: "\ud83d\udc4d", // 👍
    [FifthRollNature.CRITICAL_WIN]: "\ud83c\udfc6", // 🏆
    [FifthRollNature.BESTIAL_FAILURE]: "\ud83d\udc80", // 💀
    [FifthRollNature.MESSY_CRITICAL]: "\ud83d\ude08", // 😈
};
