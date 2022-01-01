import { Runtime } from ".";
import ChangeablePlugin from "../structures/ChangeablePlugin";
import Plugin from "./Plugin";

class PluginManager {
    private plugins: Plugin[] = [];
    public runtime: Runtime;

    constructor(runtime: Runtime) {
        if (! (runtime instanceof Runtime))
            throw new Error("runtime must be instanceof Runtime");
        this.runtime = runtime;
    }

    getCMDs() {
        let a: string[] = [];
        for (const p of this.plugins) {
            a = a.concat(p.keys());
        }
        return a;
    }

    getPlugin(def: string) {
        let plugin: Plugin;

        for (const p of this.plugins) {
            if (p.keys().includes(def)) {
                plugin = p;
                break;
            };
            continue;
        }

        return plugin;
    };

    load(...plugin: Plugin[]) {
        for (const p of plugin) {
            if (! (p instanceof Plugin))
                throw new Error("Unexpected instance, must be Plugin");
            p.register(this.runtime);

            if (p instanceof ChangeablePlugin) {
                p.updateGrammar(this.runtime.grammar);
            }

            this.plugins.push(p);
        }
    }
}

export default PluginManager;