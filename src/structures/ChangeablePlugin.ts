import Plugin from "../compiler/Plugin";
import { GrammarRule } from "../compiler/Lexer";
import Task from "../compiler/Task";

class ChangeablePlugin extends Plugin {
    updateGrammar(grammar: GrammarRule) {
        const keys = this.keys();
        const desc = this.descs();
        const vals = this.values();
        this._clearMap();
        
        for (let i=0; i < keys.length;i++) {
            const k = keys[i];
            const d = desc[i];
            const t = vals[i];
            if (t instanceof Task) continue;

            this.define(
                k.replace("$", grammar.op),
                d.replace("[", grammar.open)
                .replace("]", grammar.close)
                .replace(";", grammar.separator),
                t
            );
        }
    }
}

export default ChangeablePlugin;