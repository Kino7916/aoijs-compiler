import { clearArray } from "../utils/array";
export interface GrammarRule {
    open: string;
    close: string;
    op: string;
    separator: string;
}

export interface KeywordRule {
    contains?: string[];
    containInOrder?: boolean;
    endIs?: string;
    endPointOf?: string[];
    initiator?: boolean;
    initiatorOf?: boolean;
}

enum TokenType {
    End,
    Literal,
    Open,
    Close,
    Function,
    Separator,
    EndProgram
}

class Token {
    value: string;
    line: number;
    to: number;
    type: TokenType;
    next: Token[];

    constructor(value: string, line: number, type: TokenType) {
        this.value = value;
        this.line = line;
        this.to = line;
        this.type = type;
        this.next = [];
    }
}

class Lexer {
    code: string;
    pos: number;
    pervious: Token;
    current: Token;
    tokens: Token[];
    _allowEscape: boolean;
    private _grammar: GrammarRule = {
        open: "[",
        close: "]",
        op: "$",
        separator: ";"
    }
    constructor(code: string) {
        this.code = code;
        this.pos = 0;
        this.pervious = null;
        this.current = null;
        this.tokens = [];
        this._allowEscape = false;
    }

    get grammar(): string[] {
        return Object.values(this._grammar);
    }

    setGrammar(value: GrammarRule) {
        Object.assign(this._grammar, value);
        const ns = Object.keys(this._grammar);

        if (ns.join(",") !== "open,close,op,separator") {
            this._grammar = {
                open: this._grammar.open,
                close: this._grammar.close,
                op: this._grammar.op,
                separator: this._grammar.separator
            }
        }
    }

    main() {
        let char = "";
        let lines = 1;
        while (this.pos < this.code.length) {
            char = this.code[this.pos];
            this.pos++;
            
            let type = TokenType.Literal;
            let i = this.grammar.indexOf(char) + 2;
            if (i >= 2) type = i;
            if (this._allowEscape && type >= 2) {
                if (this.current?.value?.endsWith?.("\\")) {
                    type = TokenType.Literal;
                    this.current.value = this.current.value.slice(0, this.current.value.length - 1);
                }
            }

            if (this.current && this.current.type === TokenType.Literal) {
                if (type === TokenType.Literal) {
                    this.current.value += char;
                    this.current.to = lines;
                } else {
                    this.tokens.push(this.current);
                    this.tokens.push(new Token(char, lines, type));
                    this.current = null;
                }
            } else if (this.current) {
                this.tokens.push(this.current);
                this.current = null;
                if (type === TokenType.Literal) {
                    this.current = new Token(char, lines, type);
                }
            } else {
                if (type === TokenType.Literal) {
                    this.current = new Token(char, lines, type);
                } else {
                    this.tokens.push(new Token(char, lines, type));
                }
            }
            if (char === "\n") lines++;
        };

        char = undefined;
        if (this.current) {
            this.tokens.push(this.current);
            this.current = null;
        }

        this.tokens.push(new Token("\0", lines, TokenType.EndProgram));
    }

    map() {
        const tokens: Token[] = [];
        this.pervious = null;
        while (this.tokens.length) {
            const token = this.tokens.shift();
            if (token.type === TokenType.Literal) {
                if (this.pervious) {
                    if (this.pervious.type === TokenType.Literal) {
                        this.pervious.value += token.value;
                        this.pervious.to = token.line;
                    } else {
                        tokens.push(this.pervious);
                        this.pervious = token;
                    }
                } else {
                    this.pervious = token;
                }
            } else {
                if (this.pervious) {
                    tokens.push(this.pervious);
                    this.pervious = null;
                };
                tokens.push(token);
            }
        }
        this.tokens = tokens;
        clearArray.bind(tokens);
    }
}

export {
    Lexer,
    Token,
    TokenType
}