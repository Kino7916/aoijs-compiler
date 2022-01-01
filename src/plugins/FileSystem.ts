import ChangeablePlugin from "../structures/ChangeablePlugin";
import fs from 'fs';

const FileSystemPlugin = new ChangeablePlugin();

FileSystemPlugin.define(
    "$writeFile",
    "[string path;string data]",
    (ctx) => {
        const [name, data] = ctx.usage.splits;

        fs.writeFileSync(name, data);
        return ""
    }
);

FileSystemPlugin.define(
    "$appendFile",
    "[string path;string data]",
    (ctx) => {
        const [name, data] = ctx.usage.splits;

        fs.appendFileSync(name, data);
        return ""
    }
)

FileSystemPlugin.define(
    "$readFile",
    "[string path]",
    (ctx) => {
        const path = ctx.usage?.inside;
        if (!fs.existsSync(path)) return "";
        return fs.readFileSync(path).toString();
    }
)

FileSystemPlugin.define(
    "$deleteFile",
    "[string path]",
    (ctx) => {
        const path = ctx.usage?.inside;
        if (!fs.existsSync(path)) return "";
        fs.unlinkSync(path);
        return "";
    }
)

export default FileSystemPlugin