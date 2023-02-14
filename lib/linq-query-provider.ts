import { plainToClass } from "class-transformer";
import {
    AjaxFuncs, Ctor, IAjaxProvider, IQueryPart, IQueryProvider,
    QueryFunc, QueryParameter, mergeAjaxOptions
} from "jinqu";
import {
    ArrayExpression, BinaryExpression, CallExpression, Expression,
    ExpressionType, FuncExpression, GroupExpression, IndexerExpression,
    LiteralExpression, MemberExpression, ObjectExpression, TernaryExpression,
    UnaryExpression, VariableExpression,
} from "jokenizer";
import { LinqQuery, QueryOptions } from "./linq-query";

export class LinqQueryProvider<TOptions extends QueryOptions, TResponse> implements IQueryProvider {
    public pascalize: boolean;

    constructor(protected ajaxProvider: IAjaxProvider<TResponse>) {
    }

    public createQuery<T>(parts?: IQueryPart[]): LinqQuery<T, TOptions, TResponse> {
        return new LinqQuery<T, TOptions, TResponse>(this, parts);
    }

    public execute<T = never, TResult = PromiseLike<T[]>>(): TResult {
        throw new Error("Synchronous execution is not supported");
    }

    public executeAsync<T = never, TResult = T[]>(parts: IQueryPart[]): PromiseLike<TResult> {
        const ps: IQueryPart[] = [];
        const os: TOptions[] = [];
        let inlineCountEnabled = false;
        let includeResponse = false;
        let ctor: Ctor<never>;

        for (const p of parts) {
            if (p.type === QueryFunc.toArray)
                continue;

            if (p.type === AjaxFuncs.includeResponse) {
                includeResponse = true;
            } else if (p.type === AjaxFuncs.options) {
                const o: TOptions = p.args[0].literal;
                os.push(o);

                if (o && o.pascalize != null) {
                    this.pascalize = o.pascalize;
                }
            } else if (p.type === QueryFunc.cast) {
                ctor = p.args[0].literal;
            } else {
                ps.push(p);
            }
            if (p.type === QueryFunc.inlineCount) {
                inlineCountEnabled = true;
            }
        }

        const options = (os || []).reduce(mergeQueryOptions, {});
        const params = ps.map((p) => this.handlePart(p));
        options.params = (options.params || []).concat(params);

        return this.ajaxProvider.ajax<T>(options)
            .then(r => {
                let value = r.value;
                if (value && value["d"] !== void 0) {
                    value = value["d"];
                }
                if (ctor) {
                    value = plainToClass(ctor, value);
                }

                if (!inlineCountEnabled && !includeResponse)
                    return value;

                return {
                    inlineCount: inlineCountEnabled ? Number(r.value && r.value["inlineCount"]) : void 0,
                    response: includeResponse ? r.response : void 0,
                    value,
                };
            }) as never;
    }

    public handlePart(part: IQueryPart): QueryParameter {
        const args = part.args.map(a =>
            a.literal != null || a.exp == null
                ? a.literal
                : this.expToStr(
                    a.exp,
                    a.scopes,
                    a.exp.type === ExpressionType.Func ? (a.exp as FuncExpression).parameters : [],
                ),
        ).join(";");
        return { key: "$" + part.type, value: args };
    }

    public expToStr(exp: Expression, scopes: unknown[], parameters: string[]): string {
        switch (exp.type) {
            case ExpressionType.Literal:
                return this.literalToStr(exp as LiteralExpression);
            case ExpressionType.Variable:
                return this.variableToStr(exp as VariableExpression, scopes, parameters);
            case ExpressionType.Unary:
                return this.unaryToStr(exp as UnaryExpression, scopes, parameters);
            case ExpressionType.Group:
                return this.groupToStr(exp as GroupExpression, scopes, parameters);
            case ExpressionType.Object:
                return this.objectToStr(exp as ObjectExpression, scopes, parameters);
            case ExpressionType.Array:
                return this.arrayToStr(exp as ArrayExpression, scopes, parameters);
            case ExpressionType.Binary:
                return this.binaryToStr(exp as BinaryExpression, scopes, parameters);
            case ExpressionType.Member:
                return this.memberToStr(exp as MemberExpression, scopes, parameters);
            case ExpressionType.Indexer:
                return this.indexerToStr(exp as IndexerExpression, scopes, parameters);
            case ExpressionType.Func:
                return this.funcToStr(exp as FuncExpression, scopes, parameters);
            case ExpressionType.Call:
                return this.callToStr(exp as CallExpression, scopes, parameters);
            case ExpressionType.Ternary:
                return this.ternaryToStr(exp as TernaryExpression, scopes, parameters);
            default:
                throw new Error(`Unsupported expression type ${exp.type}`);
        }
    }

    public literalToStr(exp: LiteralExpression) {
        return this.valueToStr(exp.value);
    }

    public variableToStr(exp: VariableExpression, scopes: unknown[], parameters: string[]) {
        const name = exp.name;
        if (parameters.indexOf(name) >= 0)
            return name;

        const scope = scopes && scopes.find(s => name in (s as object));
        return (scope && this.valueToStr(scope[name])) || name;
    }

    public unaryToStr(exp: UnaryExpression, scopes: unknown[], parameters: string[]) {
        return `${getUnaryOp(exp.operator)}${this.expToStr(exp.target, scopes, parameters)}`;
    }

    public groupToStr(exp: GroupExpression, scopes: unknown[], parameters: string[]) {
        return `(${exp.expressions.map(e => this.expToStr(e, scopes, parameters)).join(", ")})`;
    }

    public objectToStr(exp: ObjectExpression, scopes: unknown[], parameters: string[]) {
        const assigns = exp.members.map(m => {
            return `${m.name} = ${this.expToStr(m.right, scopes, parameters)}`;
        }).join(", ");

        return `new {${assigns}}`;
    }

    public arrayToStr(exp: ArrayExpression, scopes: unknown[], parameters: string[]) {
        return `new[] {${exp.items.map(e => this.expToStr(e, scopes, parameters)).join(", ")}}`;
    }

    public binaryToStr(exp: BinaryExpression, scopes: unknown[], parameters: string[]) {
        const left = this.expToStr(exp.left, scopes, parameters);
        const op = getBinaryOp(exp.operator);
        const right = this.expToStr(exp.right, scopes, parameters);

        return `${left} ${op} ${right}`;
    }

    public memberToStr(exp: MemberExpression, scopes: unknown[], parameters: string[]) {
        const member = this.pascalize
            ? exp.name[0].toUpperCase() + exp.name.substring(1)
            : exp.name;
        return `${this.expToStr(exp.owner, scopes, parameters)}.${member}`;
    }

    public indexerToStr(exp: IndexerExpression, scopes: unknown[], parameters: string[]) {
        return `${this.expToStr(exp.owner, scopes, parameters)}[${this.expToStr(exp.key, scopes, parameters)}]`;
    }

    public funcToStr(exp: FuncExpression, scopes: unknown[], parameters: string[]) {
        const prm = exp.parameters.length === 1 ? exp.parameters[0] : `(${exp.parameters.join(", ")})`;
        return prm + " => " + this.expToStr(exp.body, scopes, [...exp.parameters, ...parameters]);
    }

    public callToStr(exp: CallExpression, scopes: unknown[], parameters: string[]) {
        const callee = exp.callee as VariableExpression;
        if (callee.type !== ExpressionType.Member && callee.type !== ExpressionType.Variable) {
            throw new Error(`Invalid function call ${this.expToStr(exp.callee, scopes, parameters)}`);
        }

        const left = callee.type === ExpressionType.Variable
            ? ""
            : this.expToStr((callee as MemberExpression).owner, scopes, parameters) + ".";

        const func = callee.name;
        const prmless = parameterlessFuncs[func];
        if (prmless) {
            if (exp.args.length)
                throw new Error(`No argument expected for function ${func}`);

            return `${left}${prmless}`;
        }

        const args = exp.args.map(a => this.expToStr(a, scopes, parameters)).join(", ");
        switch (func) {
            case "substr": return left + `Substring(${args})`;
            case "includes": return left + `Contains(${args})`;
        }

        const pascalFunc = func.charAt(0).toUpperCase() + func.substring(1);
        return `${left}${pascalFunc}(${args})`;
    }

    public ternaryToStr(exp: TernaryExpression, scopes: unknown[], parameters: string[]) {
        const predicate = this.expToStr(exp.predicate, scopes, parameters);
        const whenTrue = this.expToStr(exp.whenTrue, scopes, parameters);
        const whenFalse = this.expToStr(exp.whenFalse, scopes, parameters);

        return `${predicate} ? ${whenTrue} : ${whenFalse}`;
    }

    public valueToStr(value) {
        if (value == null)
            return "null";

        if (typeof value === "string")
            return `"${value.replace(/"/g, '""')}"`;

        if (Object.prototype.toString.call(value) === "[object Date]")
            return `"${value.toISOString()}"`;

        return value;
    }
}

export function mergeQueryOptions(o1: QueryOptions, o2: QueryOptions): QueryOptions {
    const o: QueryOptions = mergeAjaxOptions(o1, o2);
    o.pascalize = o2.pascalize != null ? o2.pascalize : o1.pascalize;
    return o;
}

function getBinaryOp(op: string) {
    if (op === "===")
        return "==";

    if (op === "!==")
        return "!=";

    return op;
}

function getUnaryOp(op: string) {
    return op;
}

const parameterlessFuncs = {
    getDay: "Day",
    getFullYear: "Year",
    getHours: "Hour",
    getMilliseconds: "Millisecond",
    getMinutes: "Minute",
    getMonth: "Month - 1",
    getSeconds: "Second",
    toLocaleLowerCase: "ToLower()",
    toLocaleUpperCase: "ToUpper()",
    toLowerCase: "ToLower()",
    toString: "ToString()",
    toUpperCase: "ToUpper()",
};
