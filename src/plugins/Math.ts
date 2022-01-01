import ChangeablePlugin from "../structures/ChangeablePlugin";

const MathPlugin = new ChangeablePlugin();

MathPlugin.define(
    "$sum",
    "[...num values]",
    (ctx) => {
        let res = 0;

        while (ctx.usage.splits.length) {
            let n = Number(ctx.usage.splits.shift());
            if (isNaN(n)) {
                ctx.error = "Invalid number!";
                break;
            }

            res += n;
        };

        return String(res);
    }
)

MathPlugin.define(
    "$sub",
    "[...num values]",
    (ctx) => {
        let res = 0;

        while (ctx.usage.splits.length) {
            let n = Number(ctx.usage.splits.shift());
            if (isNaN(n)) {
                ctx.error = "Invalid number!";
                break;
            }

            res -= n;
        };

        return String(res);
    }
);

MathPlugin.define(
    "$div",
    "[...num values]",
    (ctx) => {
        let res = 0;

        while (ctx.usage.splits.length) {
            let n = Number(ctx.usage.splits.shift());
            if (isNaN(n)) {
                ctx.error = "Invalid number!";
                break;
            }

            res = res / n;
        };

        return String(res);
    }
);

MathPlugin.define(
    "$multi",
    "[...num values]",
    (ctx) => {
        let res = 0;

        while (ctx.usage.splits.length) {
            let n = Number(ctx.usage.splits.shift());
            if (isNaN(n)) {
                ctx.error = "Invalid number!";
                break;
            }

            res = res * n;
        };

        return String(res);
    }
);

MathPlugin.define(
    "$sin",
    "[num value]",
    (ctx) => {
        return String(Math.sin(Number(ctx.usage.inside)));
    }
);

MathPlugin.define(
    "$cos",
    "[num value]",
    (ctx) => {
        return String(Math.cos(Number(ctx.usage.inside)));
    }
);

MathPlugin.define(
    "$random",
    "[num value1; num value2]",
    (ctx) => {
        const min = Number(ctx.usage.splits[0]);
        const max = Number(ctx.usage.splits[1]);

        return String(Math.trunc(Math.random() * (max - min) + min));
    }
);
export default MathPlugin;