import ChangeablePlugin from "../structures/ChangeablePlugin";
import { Plugin } from "../compiler";

const UtilityPlugin = new ChangeablePlugin();

UtilityPlugin.define(
    "$checkCondition",
    "[condition condition]",
    (context) => {
        const usage = context.usage;
        const r = context.condition(usage.inside);

        return String(Boolean(r));
    }
);

UtilityPlugin.define(
    "$length",
    "[string text]",
    (context) => {
        return String(context.usage?.inside?.length ?? 0);
    }
)

UtilityPlugin.define(
    "$cwd",
    "",
    () => process.cwd()
);

UtilityPlugin.define(
    "$argv",
    "(int index)",
    (context) => {
        const id = Number(context.usage?.inside);
        if (isNaN(id)) return "";
        return process.argv[id] || "";
    }
)

UtilityPlugin.define(
    "$dirname",
    "",
    () => __dirname
)

export default UtilityPlugin;