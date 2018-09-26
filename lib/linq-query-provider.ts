import {
    ExpressionType, Expression,
    LiteralExpression, VariableExpression, UnaryExpression,
    GroupExpression, AssignExpression, ObjectExpression, ArrayExpression,
    BinaryExpression, MemberExpression, IndexerExpression, FuncExpression,
    CallExpression, TernaryExpression
} from 'jokenizer';
import { IQueryProvider, IQueryPart, QueryParameter, AjaxFuncs, AjaxOptions, IRequestProvider } from "jinqu";
import { LinqQuery } from "./linq-query";

export class LinqQueryProvider<TOptions extends AjaxOptions> implements IQueryProvider {

    constructor(protected requestProvider: IRequestProvider<TOptions>) {
    }

    createQuery<T>(parts?: IQueryPart[]): LinqQuery<T> {
        return new LinqQuery<T>(this, parts);
    }

    execute<T = any, TResult = PromiseLike<T[]>>(parts: IQueryPart[]): TResult {
        throw new Error('Synchronous execution is not supported');
    }

    executeAsync<T = any, TResult = T[]>(parts: IQueryPart[]): PromiseLike<TResult> {
        const prms: QueryParameter[] = [];
        let os: TOptions[] = [];

        for (let p of parts) {
            if (!p.args.length) continue;

            if (p.type === AjaxFuncs.options) {
                os.push(p.args[0].literal);
            } else {
                prms.push(this.handlePart(p));
            }
        }

        return this.requestProvider.request<TResult>(prms, os);
    }

    executeAsyncIterator<TResult = any>(parts: IQueryPart[]): AsyncIterator<TResult> {
        throw new Error("Method not implemented.");
    }

    handlePart(part: IQueryPart): QueryParameter {
        const args = part.args.map(a => a.literal != null ? a.literal : expToStr(a.exp, a.scopes)).join(';');
        return { key: '$' + part.type, value: args };
    }
}

export function expToStr(exp: Expression, scopes: any[]): string {
    switch (exp.type) {
        case ExpressionType.Literal:
            return convertValue((exp as LiteralExpression).value);
        case ExpressionType.Variable:
            return readVar((exp as VariableExpression), scopes);
        case ExpressionType.Unary:
            const uexp = exp as UnaryExpression;
            return `${getUnaryOp(uexp.operator)}${expToStr(uexp.target, scopes)}`;
        case ExpressionType.Group:
            const gexp = exp as GroupExpression;
            return `(${gexp.expressions.map(e => expToStr(e, scopes)).join(', ')})`;
        case ExpressionType.Object:
            const oexp = exp as ObjectExpression;
            const assigns = oexp.members.map(m => {
                if (m.type === ExpressionType.Assign) {
                    const ae = m as AssignExpression;
                    return `${expToStr(ae.right, scopes)} as ${ae.name}`;
                }
                return m.name;
            }).join(', ');
            return `new (${assigns})`;
        case ExpressionType.Array:
            const aexp = exp as ArrayExpression;
            return `new [] {${aexp.items.map(e => expToStr(e, scopes)).join(', ')}}`;
        case ExpressionType.Binary:
            const bexp = exp as BinaryExpression;
            return `${expToStr(bexp.left, scopes)} ${getBinaryOp(bexp.operator)} ${expToStr(bexp.right, scopes)}`;
        case ExpressionType.Member:
            const mexp = exp as MemberExpression;
            return `${expToStr(mexp.owner, scopes)}.${mexp.name}`;
        case ExpressionType.Indexer:
            const iexp = exp as IndexerExpression;
            return `${expToStr(iexp.owner, scopes)}[${expToStr(iexp.key, scopes)}]`;
        case ExpressionType.Func:
            const fexp = exp as FuncExpression;
            const a = {};
            fexp.parameters.forEach(p => a[p] = readProp(p, scopes));
            const prm = fexp.parameters.length == 1 ? fexp.parameters[0] : `(${fexp.parameters.join(', ')})`;
            return prm + ' => ' + expToStr(fexp.body, [a, ...scopes]);
        case ExpressionType.Call:
            const cexp = exp as CallExpression;
            return mapFunction(cexp, scopes);
        case ExpressionType.Ternary:
            const texp = exp as TernaryExpression;
            return `${expToStr(texp.predicate, scopes)} ? ${expToStr(texp.whenTrue, scopes)} : ${expToStr(texp.whenFalse, scopes)}`;
        default:
            throw new Error(`Unsupported expression type ${exp.type}`);
    }
}

function getBinaryOp(op: string) {
    if (op === '===') return '==';
    if (op === '!==') return '!=';

    return op;
}

function getUnaryOp(op: string) {
    return op;
}

function readVar(exp: VariableExpression, scopes: any[]) {
    return readProp(exp.name, scopes);
}

function readProp(member: string, scopes: any[]) {
    const s = scopes && scopes.find(s => member in s);
    return s ? s[member] : member;
}

function convertValue(value) {
    if (value === void 0)
        return 'null';
    if (typeof value === 'string')
        return `"${value.replace(/"/g, '""')}"`;;
    if (Object.prototype.toString.call(value) === '[object Date]')
        return `"${value.toISOString()}"`;

    return value;
}

function mapFunction(call: CallExpression, scopes: any[]) {
    const callee = expToStr(call.callee, scopes);
    const args = call.args.map(a => expToStr(a, scopes)).join(', ');
    return `${callee}(${args})`;
}
