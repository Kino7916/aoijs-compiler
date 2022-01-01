import { Runtime, Task } from ".";

const OPERATOR = ["==", "!=", ">=", "<=", "<", ">", "&&", "\|\|"];

class TaskContext {
    usage: {total: string, inside: string, splits: string[]};
    data: any;
    task: Task;
    runtime: Runtime;
    error: string;

    constructor(task: Task) {
        if (task instanceof Task) {
            this.task = task;
        } else throw new Error("task must be instanceof Task");
    }

    condition(value: string) {
        const vals = [];
        const bools = [];
        const sp = value.split(/(==|!=|<=|>=|<|>|&&|\|\|)/g);

        let i = 0;
        let left: string = "";
        let op: string = "";
        let right: string = "";

        function next() {
            left = sp.shift();
            op = sp.shift();
            right = sp.shift();
            i += 3;
        };

        while (i < sp.length) {
            next();

            if (left === "&&" || left === "||") {
                const o = left;
                left = op;
                op = right;
                right = sp.shift();
                i++;

                if (o === "&&") {
                    vals.push(true);
                } else {
                    vals.push(false);
                }
            }

            if (op === "==") {
                if (left === right) bools.push(true)
                else bools.push(false);
                continue;
            };
            if (op === "!=") {
                if (left !== right) bools.push(true)
                else bools.push(false);
                continue;
            };
            if (op === "<=") {
                const n = Boolean(!isNaN(Number(left)) && !isNaN(Number(right)));

                if (n) {
                    if (Number(left) <= Number(right)) bools.push(true)
                    else bools.push(false);
                } else {
                    if (left.length <= right.length) bools.push(true)
                    else bools.push(false);
                }
                continue;
            }
            if (op === "<") {
                const n = Boolean(!isNaN(Number(left)) && !isNaN(Number(right)));

                if (n) {
                    if (Number(left) < Number(right)) bools.push(true)
                    else bools.push(false);
                } else {
                    if (left.length < right.length) bools.push(true)
                    else bools.push(false);
                }
                continue;
            }

            if (op === ">") {
                const n = Boolean(!isNaN(Number(left)) && !isNaN(Number(right)));

                if (n) {
                    if (Number(left) > Number(right)) bools.push(true)
                    else bools.push(false);
                } else {
                    if (left.length > right.length) bools.push(true)
                    else bools.push(false);
                }
                continue;
            }

            if (op === ">=") {
                const n = Boolean(!isNaN(Number(left)) && !isNaN(Number(right)));

                if (n) {
                    if (Number(left) >= Number(right)) bools.push(true)
                    else bools.push(false);
                } else {
                    if (left.length >= right.length) bools.push(true)
                    else bools.push(false);
                }
                continue;
            }
        };

        let res = false;
        i = 0;
        let last_op = true; // &&
        let last_val = true; // False
        for (;i<bools.length;i++) {
            const op = vals[i];
            const val = bools[i];

            if (last_op || last_op === undefined) {
                if (!last_op) {
                    last_op = vals[i - 1];
                    if (!last_op) throw new Error("Multiple condition in one operation");
                    continue;
                };

                if (last_op) {
                    if (last_val && val) {
                        res = true;
                    } else {
                        res = false;
                    };
                }
                last_op = op;
                last_val = val;
                continue;
            }

            if (!last_op) {
                if (last_val || val) res = true
                else res = false;

                last_op = op;
                last_val = val;
                continue;
            }
        };

        return res;
    }
}

export default TaskContext;