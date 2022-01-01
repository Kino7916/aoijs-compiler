const Lib = require("./lib/index");
const code = `#random(20, 180)
Writing file...#writeFile(str.txt,data-#length(#length(ABCDEFGHIJKA)))`;

const runtime = new Lib.Compiler.Runtime({ allowEscape: true, maxTaskPool: 10 });

runtime.initPool();
runtime.grammar = {
    op: "#",
    open: "(",
    close: ")",
    separator: ","
};

runtime.manager.load(Lib.Plugins.Math, Lib.Plugins.Utility, Lib.Plugins.OS, Lib.Plugins.FileSystem);

runtime.set("code", code);
const task = runtime.thread("code");
runtime.runTask(task).then(console.log)
