import { KeywordRule, Lexer, TokenType } from "./Lexer";
import { clearArray } from "../utils";
import { Runtime, Task, Token } from ".";

class Parser {
    lex: Lexer;
    runtime: Runtime;
    max_length: number;
    cache: string[];
    last_key: Token;
    constructor(runtime: Runtime, lexer: Lexer) {
        this.lex = lexer;
        this.runtime = runtime;
        this.cache = this.runtime.manager.getCMDs();
        this.max_length = this.cache.map(f => f.length).sort((a, b) => b - a)[0];
    }

    matches(eq: string) {
        return this.cache.filter(perv => perv.toLowerCase().startsWith(eq.toLowerCase()));
    }

    equal(eq: string) {
        return this.cache.find(perv => perv.toLowerCase() === eq.toLowerCase());
    }

    getLen(base: string, eq: string) {
        if (this.matches(eq).length) return eq.length -1;
        let pos = 0;
        let str = base; // "${existing?}"
        let matchs = this.matches(str);
        let _m: string[] = [];
        while (pos <= eq.length) {
            if (!eq[pos]) break;
            str += eq[pos];
            _m = this.matches(str);
            if (!_m.length) {
                str = str.slice(0, matchs[0]?.length);
                break;
            }
            matchs = _m;
            pos++;
            continue;
        }
        _m = undefined;
        matchs = undefined;

        if (this.equal(str)) return pos + 1;
        return 0;
    }

    parse() {
        const tokens = [];
        this.lex.current = null;
        let close = 0;
       
        while (this.lex.tokens.length) {
            const token = this.lex.tokens.shift();

            if (token.type === TokenType.Literal) {
                if (this.lex.current) {
                    if (this.lex.current.type === TokenType.Literal) {
                        this.lex.current.value += token.value;
                        this.lex.current.to = token.to;
                        continue;
                    }
                    
                    if (this.lex.current.type === TokenType.Function) {
                        if (this.equal(this.lex.current.value)) {
                            tokens.push(this.lex.current);
                            this.lex.current = token;
                            continue;
                        } else {
                            if (this.lex.current.value.length <= this.max_length) {
                                const len = this.getLen(this.lex.current.value, token.value);
                                if (!len) {
                                    this.lex.current.type = TokenType.Literal;
                                    this.lex.current.value += token.value;
                                    continue;
                                } else {
                                    const str = token.value.slice(0, len - 1);
                                    this.lex.current.value += str;

                                    token.value = token.value.slice(len - 1);

                                    if (token.value.length) {
                                        tokens.push(this.lex.current);
                                        this.lex.current = token;
                                    }
                                    continue;
                                }
                            } else {
                                this.lex.current.type = TokenType.Literal;
                                this.lex.current.value += token.value;
                                continue;
                            }
                        }
                    }

                    tokens.push(this.lex.current);
                    this.lex.current = token;
                } else {
                    this.lex.current = token;
                }
                continue;
            };

            if (token.type === TokenType.Function) {
                if (this.lex.current) {
                    if (this.lex.current.type === TokenType.Function) {
                        this.lex.current.type = TokenType.Literal;
                    }
                    tokens.push(this.lex.current);
                };

                this.lex.current = token;
                continue;
            };

            if (token.type === TokenType.Open) {
                if (this.lex.current) {

                    if (this.lex.current.type === TokenType.Function) {
                        if (this.equal(this.lex.current.value)) {
                            const p = this.runtime.manager.getPlugin(this.equal(this.lex.current.value));
                            const desc = p.getDescribe(this.equal(this.lex.current.value));
                            if (typeof desc === "string") {
                                if (desc.startsWith(this.runtime.grammar.open) || desc.startsWith(`?${this.runtime.grammar.open}`)) {
                                    close++;
                                    tokens.push(this.lex.current);
                                    tokens.push(token);
                                    this.lex.current = null;
                                } else {
                                    token.type = TokenType.Literal;
                                    tokens.push(this.lex.current);
                                    this.lex.current = token;
                                }
                            }
                        } else {
                            this.lex.current.type = TokenType.Literal;
                            this.lex.current.value += token.value;
                            this.lex.current.to = token.to;
                        }
                        continue;
                    } else {
                        token.type = TokenType.Literal;

                        if (this.lex.current.type === TokenType.Literal) {
                            this.lex.current.value += token.value;
                            this.lex.current.to = token.to;
                        } else {
                            tokens.push(this.lex.current);
                            this.lex.current = token;
                        }
                    }
                } else {
                    token.type = TokenType.Literal;
                    tokens.push(token);
                }
                continue;
            }

            // cool
            if (this.lex.current && this.lex.current.type === TokenType.Function) {
                if (!this.equal(this.lex.current.value)) {
                    this.lex.current.type = TokenType.Literal;
                }
            }

            if (token.type === TokenType.Close || token.type === TokenType.Separator) {
                if (close > 0) {
                    if (this.lex.current) {
                        tokens.push(this.lex.current);
                        this.lex.current = null;
                    };
                    tokens.push(token);
                    if (token.type === TokenType.Close) close--;
                } else {
                    token.type = TokenType.Literal;

                    if (this.lex.current) {
                        if (this.lex.current.type === TokenType.Literal) {
                            this.lex.current.value += token.value;
                            this.lex.current.to = token.to;
                        } else {
                            tokens.push(this.lex.current);
                            this.lex.current = token;
                        }
                    } else {
                        this.lex.current = token;
                    }
                }
                continue;
            }

            if (token.type === TokenType.EndProgram) {
                if (this.lex.current) {
                    tokens.push(this.lex.current);
                    this.lex.current = null;
                };
                tokens.push(token);

                if (token.type === TokenType.EndProgram) break;
            };
        }; // Hi me end of while

        if (this.lex.current) {
            tokens.push(this.lex.current);
            this.lex.current = null;
        }

        this.lex.tokens = tokens;
        clearArray.bind(tokens);
        this.map();
    }

    map() {
        const tokens = [];
        this.lex.pervious = null;
        while (this.lex.tokens.length) {
            const token = this.lex.tokens.shift();

            if (!this.lex.pervious) {
                this.lex.pervious = token;
                continue;
            };

            if (this.lex.pervious.type !== TokenType.Literal) {
                tokens.push(this.lex.pervious);
                this.lex.pervious = token;
                continue;
            };

            if (token.type !== TokenType.Literal) {
                tokens.push(this.lex.pervious);
                this.lex.pervious = token;
                continue;
            }

            if (token.type === TokenType.Literal && this.lex.pervious.type !== TokenType.Literal) {
                tokens.push(this.lex.pervious);
                this.lex.pervious = token;
                continue;
            }

            if (token.type !== TokenType.Literal && this.lex.pervious.type === TokenType.Literal) {
                tokens.push(this.lex.pervious);
                this.lex.pervious = token;
                continue;
            }

            if (token.type === TokenType.Literal && this.lex.pervious.type === TokenType.Literal) {
                this.lex.pervious.value += token.value;
                this.lex.pervious.to = token.to;
            }
        }

        if (this.lex.pervious) {
            tokens.push(this.lex.pervious);
            this.lex.pervious = null;
        }

        this.lex.tokens = tokens;
        clearArray.bind(tokens);
    }
    
    group() {
        const tokens: Token[] = [];
        let deep = 0;
        let deepC = 0;
        
        function assign(token: Token, returnMain?: boolean) {
            let t: Token = null;
            if (deep + deepC > 0) {
                t = tokens[tokens.length - 1];
                let cont = 1;
                
                while (cont < deep + deepC) {
                    t = t.next[t.next.length - 1];
                    cont++;
                };
            };

            if (returnMain) return t;
            if (t) {
                t.next.push(token);
            } else {
                tokens.push(token);
            }
        }

        while (this.lex.tokens.length) {
            const token = this.lex.tokens.shift();
            
            if (token.type === TokenType.Open) {
                deep++;
                assign(token);
                deep++;
                continue;
            };

            if (token.type === TokenType.Close) {
                assign(token);
                deep -= 2;
                continue;
            };

            if (token.type === TokenType.Function) {
                assign(token);

                const p = this.runtime.manager.getPlugin(this.equal(token.value));
                if (p) {
                    const key = p.getRule(this.equal(token.value));
                    if (!key) continue;

                    if (this.last_key) {
                        const k = this.runtime.manager.getPlugin(this.equal(this.last_key.value)).getRule(this.equal(this.last_key.value));
                        if (k.initiator || k.initiatorOf) {
                            if (k.initiator && k.contains && k.contains.includes(this.equal(token.value))) {
                                this.last_key = token;
                                continue;
                            } else if (!k.contains.includes(this.equal(token.value))) {
                                throw new Error("Explicit keyword from rule");
                            }

                            if (key?.endPointOf?.includes?.(this.last_key.value)) {
                                deepC--;
                                this.last_key = null;
                            }
                        }
                    } else {
                        if (key?.initiator || key?.initiatorOf) {
                            this.last_key = token;
                            if (key.initiator) deepC++;
                        } else {
                            if (key?.endPointOf) {
                                continue;
                            } else 
                                throw new Error("Unexpected Rule of Keyword");
                        }
                    }
                }

                continue;
            };
            if (token.type === TokenType.EndProgram)
                {
                    deep = 0;
                    assign(token);
                    break;
                }
            assign(token);
        }

        this.lex.tokens = tokens;
        clearArray.bind(tokens);
    }
}

export {
    Parser
}