import { Runtime, Task } from ".";
import { GrammarRule, KeywordRule } from "./Lexer";
import TaskContext from "./TaskContext";

declare function noop(context: TaskContext): string | Promise<string>;

class Plugin {
    private defs: Map<string, typeof noop | Task> = new Map();
    private desc: Map<string, string> = new Map();
    private _keys: Map<string, KeywordRule> = new Map();
    private codeQueue: Map<string, string> = new Map();
    public context: any;

    _clearMap() {
        this.defs.clear();
        this.desc.clear();
        this._keys.clear();
    }

    keys() {
        return Array.from(this.defs.keys());
    }

    values() {
        return Array.from(this.defs.values());
    }

    has(def: string) {
        return this.defs.has(def);
    }

    descs() {
        return Array.from(this.desc.values());
    }

    get(def: string) {
        return this.defs.get(def);
    }

    getDescribe(def: string) {
        return this.desc.get(def);
    }

    keyword(name: string, rule: KeywordRule) {
        this._keys.set(name, rule);
    }

    getRule(name: string) {
        return this._keys.get(name);
    }

    /**
     * Defines a command / function for use in aoijs codes
     * 
     * @param name The name of command / function
     * @param describe 
     * 
     * Describe is important, it describes how the function would use the usage
     * 
     * There are 3 kind of describe
     * 
     * "" = No usage
     * 
     * "?[string example]" = Optional usage
     * 
     * "[string example]" = Required usage
     * 
     * @param cb The handler which handles calls of function in code
     * // Describe is important, it describes how the function would use the usage
     * 
     * // There are 3 kind of describe
     * // Empty string = No usage
     * // "?[string example]" = Optional usage
     * // "[string example]" = Required usage
     */
    define(name: string, describe: string, cb: string | typeof noop) {
        if (! (typeof cb !== "string" || typeof cb !== "function"))
            throw new Error("Callback of a string code or JavaScript Function is expected");
        
        if (typeof cb === "function") {
            this.defs.set(name, cb);
        } else {
            this.codeQueue.set(name, cb);
            this.defs.set(name, null);
        }
        this.desc.set(name, describe);
    }

    register(runtime: Runtime) {
        if (! (runtime instanceof Runtime))
            throw new Error("Expected an instanceof Runtime variable");
        const queue = Array.from(this.codeQueue.keys());

        for (const k of queue) {
            if (runtime.get(k))
                throw new Error(`Duplicate cache found by key "${k}"`);
            runtime.set(k, this.codeQueue.get(k));
            this.codeQueue.delete(k);
            this.defs.set(k, runtime.get(k));
        }
    }
}

export default Plugin;