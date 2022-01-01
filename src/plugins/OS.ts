import ChangeablePlugin from "../structures/ChangeablePlugin";
import OS from 'os';
const OSPlugin = new ChangeablePlugin();

OSPlugin.define(
    "$memory",
    "?[string type]",
    (ctx) => {
        const type = ctx.usage.splits[0] || "rss";
        const mem = process.memoryUsage()[type];
        if (type === "free") return String(OS.freemem());
        return String(mem);
    }
)

OSPlugin.define(
    "$cpus",
    "",
    () => String(OS.cpus().length)
);

export default OSPlugin;

