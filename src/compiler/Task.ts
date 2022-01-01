import { Lexer, Parser, Plugin, Runtime, Token, TokenType } from ".";
import TaskContext from "./TaskContext";

class Task {
    public runtime: Runtime;
    public parser: Parser;
    private _isProcess: boolean = false;
    public options: any = {};
    public id: number;
    public tokens: Token[] = [];
    public context: TaskContext;

    constructor(runtime: Runtime, id?: number) {
        if (typeof id === "number" && runtime instanceof Runtime) {
            this._isProcess = true;
            this.id = id;
            this.context = new TaskContext(this);
            this.context.runtime = runtime;
        }

        this.runtime = runtime;
        this.parser = new Parser(this.runtime, new Lexer(null));
    }

    get isProcess() {
        return this._isProcess;
    }

    get code(): string {
        return this.parser.lex.code;
    }

    get allowEscape(): boolean {
        return this.parser.lex._allowEscape;
    }

    set allowEscape(value: boolean) {
        this.parser.lex._allowEscape = Boolean(value);
    }

    set code(value: string) {
        this.parser.lex.code = value;
    }

    set from(task: Task) {
        this.parser.lex.tokens = task.parser.lex.tokens.slice(0);
        this.code = task.code;
        this.allowEscape = task.allowEscape;
    }

    interpret() {
        this.parser.lex.main();
        this.parser.parse();
        this.parser.map();
        this.parser.group();
    }

    async handleFunc(p: Plugin, token: Token): Promise<string> {
        const f = p.get(this.parser.equal(token.value) || token.value);
        const usage = await this.getUsage(token, p);
        let str = "";

        if (typeof usage === "string")
            return ""; // IDE control

        this.context.usage = usage

        if (f instanceof Task) {
            const t = this.runtime.thread(this.parser.equal(token.value) || token.value);
            const r = await this.runtime.runTask(t);
            if (r) str = r;
        } else if (typeof f === "function") {
            let r: string | Promise<string> = f.call(null, this.context);
            if (r && typeof r["then"] === "function") {
                r = await r;
            };

            if (r) str = r as string;
        }
        
        return str;
    }

    async thread(right: Token, isThread?: boolean) {
        const res: {
            total: string;
            inside: string;
            splits: string[];
        } = {
            total: right.value,
            inside: "",
            splits: []
        };

        let str = "";
        let close = false;
        let sp = 0;

        while (right.next.length) {
            const token = right.next.shift();

            if (token.type === TokenType.Separator) {
                if (!isThread) {
                    res.total += str + token.value;
                    res.inside += str + token.value;
                    res.splits.push(str);
                    str = "";
                    sp++;
                } else {
                    str += token.value;
                }
                continue;
            }

            if (token.type === TokenType.Literal) {
                str += token.value;
                continue;
            }
            
            if (token.type === TokenType.End) {
                if (!isThread) {
                    console.warn("WARN >> Task Thread: Unnecessary TOKEN(END) at usage_end");
                } else {
                    break;
                }
            }

            if (token.type === TokenType.EndProgram) {
                
                throw new Error("Unexpected TOKEN(END_PROGRAM) at usage(/:" + token.line.toString() + "/)");
            };

            if (token.type === TokenType.Function) {
                const p = this.runtime.manager.getPlugin(this.parser.equal(token.value) || token.value);

                if (p) {
                    const r = await this.handleFunc(p, token);
                    str += r;
                } else 
                    throw new Error("ERROR >> Task Thread: Unexpected PLUGIN as null");
                continue;
            }

            if (token.type === TokenType.Close) {
                str += token.value;
                close = true;
                continue;
            }
        }

        if (isThread) return str;
        if (str.length) {
            res.total += str;
            if (close) str = str.slice(0, str.length - 1);
            res.inside += str;

            if (!res.splits.length) {
                res.splits.push(str);
            } else {
                if (res.splits.length > sp) {
                    res.splits[res.splits.length - 1] += str;
                } else {
                    res.splits.push(str);
                }
            }
            str = "";
        }
        return res;
    }

    async getUsage(token: Token, plugin?: Plugin) {
        const key: string = (plugin || this.runtime.manager.getPlugin(this.parser.equal(token.value)))
            .getDescribe(this.parser.equal(token.value) || token.value);

        if (
            key.startsWith(`?${this.runtime.grammar.open}`) || 
            key.startsWith(this.runtime.grammar.open)
            ) {
            const req = key.startsWith(this.runtime.grammar.open);
            const right = token.next[0] || this.parser.lex.tokens[0];
            const fromNext = token.next[0] ? true : false;

            if (req && right.type !== TokenType.Open) throw new Error(`Expected an usage at ${token.value}(/:${token.line}/)`);

            if (!fromNext) this.parser.lex.tokens.shift()
                    else token.next.shift();
            return await this.thread(right, false);
        };
        return null;
    }

    async start() {
        this.runtime.taskBusy.push(this.id);
        const a = await this.process(this.parser.lex.tokens, true);
        this.runtime.removeBusy(this.id);
        return a;
    }

    async process(tokens: Token[], isMain?: boolean) {
        let str = "";
        while (tokens) {
            const token = tokens.shift();
            
            if (token.type === TokenType.Literal) {
                str += token.value;
            };

            if (token.type === TokenType.End) {
                if (isMain) throw new Error(`Unexpected TOKEN(END) at Main(/:${token.line}/)`);
                break;
            };

            if (token.type === TokenType.EndProgram) {
                if (!isMain) throw new Error(`Unexpected TOKEN(END_PROGRAM) at Main(/:${token.line}/)`);
                break;
            };

            if (token.type === TokenType.Function) {
                const p = this.runtime.manager.getPlugin(this.parser.equal(token.value) || token.value);
                
                if (p) {
                    const r = await this.handleFunc(p, token);
                    str += r;
                } else 
                    throw new Error("ERROR >> Task Main: Unexpected PLUGIN as null");
                continue;
            }
        };

        return str;
    }
}

export default Task;