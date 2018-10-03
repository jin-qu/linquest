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
        const args = part.args.map(a =>
            a.literal != null
                ? a.literal
                : expToStr(a.exp, a.scopes, a.exp.type === ExpressionType.Func ? (a.exp as FuncExpression).parameters : [])
        ).join(';');
        return { key: '$' + part.type, value: args };
    }
}

export function expToStr(exp: Expression, scopes: any[], parameters: string[]): string {
    switch (exp.type) {
        case ExpressionType.Literal:
            return convertValue((exp as LiteralExpression).value);
        case ExpressionType.Variable:
            return readVar((exp as VariableExpression), scopes, parameters);
        case ExpressionType.Unary:
            const uexp = exp as UnaryExpression;
            return `${getUnaryOp(uexp.operator)}${expToStr(uexp.target, scopes, parameters)}`;
        case ExpressionType.Group:
            const gexp = exp as GroupExpression;
            return `(${gexp.expressions.map(e => expToStr(e, scopes, parameters)).join(', ')})`;
        case ExpressionType.Object:
            const oexp = exp as ObjectExpression;
            const assigns = oexp.members.map(m => {
                const ae = m as AssignExpression;
                return `${ae.name} = ${expToStr(ae.right, scopes, parameters)}`;
            }).join(', ');
            return `new {${assigns}}`;
        case ExpressionType.Array:
            const aexp = exp as ArrayExpression;
            return `new[] {${aexp.items.map(e => expToStr(e, scopes, parameters)).join(', ')}}`;
        case ExpressionType.Binary:
            const bexp = exp as BinaryExpression;
            const left = expToStr(bexp.left, scopes, parameters);
            const op = getBinaryOp(bexp.operator);
            const right = expToStr(bexp.right, scopes, parameters);
            return `${left} ${op} ${right}`;
        case ExpressionType.Member:
            const mexp = exp as MemberExpression;
            return `${expToStr(mexp.owner, scopes, parameters)}.${mexp.name}`;
        case ExpressionType.Indexer:
            const iexp = exp as IndexerExpression;
            return `${expToStr(iexp.owner, scopes, parameters)}[${expToStr(iexp.key, scopes, parameters)}]`;
        case ExpressionType.Func:
            const fexp = exp as FuncExpression;
            const prm = fexp.parameters.length == 1 ? fexp.parameters[0] : `(${fexp.parameters.join(', ')})`;
            return prm + ' => ' + expToStr(fexp.body, scopes, [...fexp.parameters, ...parameters]);
        case ExpressionType.Call:
            const cexp = exp as CallExpression;
            return mapFunction(cexp, scopes, parameters);
        case ExpressionType.Ternary:
            const texp = exp as TernaryExpression;
            const predicate = expToStr(texp.predicate, scopes, parameters);
            const whenTrue = expToStr(texp.whenTrue, scopes, parameters);
            const whenFalse = expToStr(texp.whenFalse, scopes, parameters);
            return `${predicate} ? ${whenTrue} : ${whenFalse}`;
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

function readVar(exp: VariableExpression, scopes: any[], parameters: string[]) {
    return parameters.indexOf(exp.name) >= 0
        ? exp.name
        : readScope(exp.name, scopes);
}

function readScope(name: string, scopes: any[]) {
    const s = scopes && scopes.find(s => name in s);
    return (s && convertValue(s[name])) || name;
}

function convertValue(value) {
    if (value == null)
        return 'null';
    if (typeof value === 'string')
        return `"${value.replace(/"/g, '""')}"`;
    if (Object.prototype.toString.call(value) === '[object Date]')
        return `"${value.toISOString()}"`;

    return value;
}

function mapFunction(call: CallExpression, scopes: any[], parameters: string[]) {
    const callee = call.callee as VariableExpression;
    if (callee.type !== ExpressionType.Member && callee.type !== ExpressionType.Variable)
        throw new Error(`Invalid function call ${expToStr(call.callee, scopes, parameters)}`);

    const left = callee.type === ExpressionType.Variable
        ? ''
        : expToStr((callee as MemberExpression).owner, scopes, parameters) + '.';

    const func = callee.name;
    const prmless = parmeterlessFuncs[func];
    if (prmless) {
        if (call.args.length)
            throw new Error(`No argument expected for function ${func}`);

        return `${left}${prmless}`;
    }

    const args = call.args.map(a => expToStr(a, scopes, parameters)).join(', ');
    switch (func) {
        case 'substr': return left + `Substring(${args})`;
        case 'includes': return left + `Contains(${args})`;
    }

    const pascalFunc = func.charAt(0).toUpperCase() + func.substr(1);
    return `${left}${pascalFunc}(${args})`;
}

const parmeterlessFuncs = {
    'toString': 'ToString()',
    'getFullYear': 'Year',
    'getMonth': 'Month - 1',
    'getDay': 'Day',
    'getHours': 'Hour',
    'getMinutes': 'Minute',
    'getSeconds': 'Second',
    'getMilliseconds': 'Millisecond',
    'toLowerCase': 'ToLower()',
    'toLocaleLowerCase': 'ToLower()',
    'toUpperCase': 'ToUpper()',
    'toLocaleUpperCase': 'ToUpper()'
};
