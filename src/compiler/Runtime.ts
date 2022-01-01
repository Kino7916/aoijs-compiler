import { Task, Plugin } from ".";
import { Compiler } from "..";
import ChangeablePlugin from "../structures/ChangeablePlugin";
import { GrammarRule } from "./Lexer";
import PluginManager from "./PluginManager";

interface RuntimeOptions {
    /** Allow double escape operator ( \\\\ ) to escape a syntax 
     * @example
     * $log[Log me this \\]]
    */
    allowEscape?: boolean;
    /**
     * Creates a caching pool of tasks beforehand
     * 
     * Task in pool can be reused to prevent unnecessary creation of tasks
     * 
     * Default is 100
     */
    maxTaskPool?: number;
    /**
     * Warns the terminal if process is forced to create new task when no task in pool is not busy
     */
    warnPoolMaxOverload?: boolean;
}

class Runtime {
    private _uptime: number = Date.now();
    private cache: Map<string, Compiler.Task> = new Map();
    private warned: boolean = false;
    public options: RuntimeOptions = {
        maxTaskPool: 100,
        warnPoolMaxOverload: true
    };
    public pool: Compiler.Task[] = [];
    public taskBusy: number[] = [];
    public manager: PluginManager = new PluginManager(this);
    private _grammar: GrammarRule = {
        open: "[",
        close: "]",
        op: "$",
        separator: ";"
    };

    get grammar() {
        return this._grammar;
    }

    set grammar(value: GrammarRule) {
        this._grammar = value;
        this.updateGrammar();
    }

    constructor(options: RuntimeOptions) {
        Object.assign(this.options, options);
    }

    get uptime(): number {
        return Date.now() - this._uptime;
    };

    updateGrammar() {
        for (const task of this.pool) {
            task.parser.lex.setGrammar(this.grammar);
        };

        const plugins: Array<Plugin> = [];
        for (const c of this.manager.getCMDs()) {
            const p = this.manager.getPlugin(c);
            if (!plugins.includes(p) && p instanceof ChangeablePlugin) {
                plugins.push(p);
            }
        };

        let p = plugins.shift();
        while (p) {
            (p as ChangeablePlugin).updateGrammar(this.grammar);
            p = plugins.shift();
        }
    }

    get(cacheName: string) {
        return this.cache.get(cacheName);
    }

    set(cacheName: string, code: string) {
        const task = new Compiler.Task(this);
        task.allowEscape = this.options.allowEscape;
        task.code = code;
        task.parser.lex.setGrammar(this._grammar);
        task.interpret();

        this.cache.set(cacheName, task);
    }

    removeBusy(id: number) {
        const i = this.taskBusy.indexOf(id);
        if (i > -1) 
            this.taskBusy.splice(i, 1);
    }

    getNotBusy() {
        const tasks = this.pool.filter((_, i) => ! (this.taskBusy.includes(i)));
        if (!tasks.length) {
            const task = new Compiler.Task(this, this.pool.length);
            // Forced because all busy
            this.pool.push(task);
            if (!this.warned && this.pool.length > this.options.maxTaskPool && this.options.warnPoolMaxOverload) {
                this.warned = true;
                console.log(">> Task Overload! NO Task is not busy in pool object");
            }
            return task;
        };
        return tasks[0];
    }

    initPool() {
        let i = 9;
        for (;i < this.options.maxTaskPool;i++) {
            const task = new Compiler.Task(this, this.pool.length);
            task.parser.lex.setGrammar(this.grammar);
            this.pool.push(task);
        };
    }

    thread(cacheName: string) {
        const idle = this.getNotBusy();
        const task = this.get(cacheName);
        idle.from = task;
        return idle;
    }

    runTask(task: Task) {
        return task.start();
    }
}

export default Runtime;