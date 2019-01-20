import { plainToClass } from 'class-transformer';
import {
    ExpressionType, Expression,
    LiteralExpression, VariableExpression, UnaryExpression,
    GroupExpression, AssignExpression, ObjectExpression, ArrayExpression,
    BinaryExpression, MemberExpression, IndexerExpression, FuncExpression,
    CallExpression, TernaryExpression
} from 'jokenizer';
import { IQueryProvider, IQueryPart, QueryParameter, AjaxFuncs, IRequestProvider, Ctor, QueryFunc } from "jinqu";
import { LinqQuery, QueryOptions } from "./linq-query";

export class LinqQueryProvider<TOptions extends QueryOptions> implements IQueryProvider {

    constructor(protected requestProvider: IRequestProvider<TOptions>) {
    }

    pascalize: boolean;

    createQuery<T>(parts?: IQueryPart[]): LinqQuery<T, TOptions> {
        return new LinqQuery<T, TOptions>(this, parts);
    }

    execute<T = any, TResult = PromiseLike<T[]>>(parts: IQueryPart[]): TResult {
        throw new Error('Synchronous execution is not supported');
    }

    executeAsync<T = any, TResult = T[]>(parts: IQueryPart[]): PromiseLike<TResult> {
        const ps: IQueryPart[] = [];
        const os: TOptions[] = [];
        let ctor: Ctor<any>;

        for (let p of parts) {
            if (!p.args.length) continue;

            if (p.type === AjaxFuncs.options) {
                const o: TOptions = p.args[0].literal;
                os.push(o);

                if (o && o.pascalize != null) {
                    this.pascalize = o.pascalize;
                }
            } 
            else if (p.type === QueryFunc.cast) {
                ctor = p.args[0].literal;
            } else {
                ps.push(p);
            }
        }

        const query = this.requestProvider.request<TResult>(ps.map(p => this.handlePart(p)), os);
        return ctor
            ? query.then(d => plainToClass(ctor, d))
            : query;
    }

    handlePart(part: IQueryPart): QueryParameter {
        const args = part.args.map(a =>
            a.literal != null || a.exp == null
                ? a.literal
                : this.expToStr(a.exp, a.scopes, a.exp.type === ExpressionType.Func ? (a.exp as FuncExpression).parameters : [])
        ).join(';');
        return { key: '$' + part.type, value: args };
    }

    expToStr(exp: Expression, scopes: any[], parameters: string[]): string {
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

    literalToStr(exp: LiteralExpression) {
        return this.valueToStr(exp.value);
    }

    variableToStr(exp: VariableExpression, scopes: any[], parameters: string[]) {
        const name = exp.name;
        if (parameters.indexOf(name) >= 0) return name;

        const s = scopes && scopes.find(s => name in s);
        return (s && this.valueToStr(s[name])) || name;
    }

    unaryToStr(exp: UnaryExpression, scopes: any[], parameters: string[]) {
        return `${getUnaryOp(exp.operator)}${this.expToStr(exp.target, scopes, parameters)}`;
    }

    groupToStr(exp: GroupExpression, scopes: any[], parameters: string[]) {
        return `(${exp.expressions.map(e => this.expToStr(e, scopes, parameters)).join(', ')})`;
    }

    objectToStr(exp: ObjectExpression, scopes: any[], parameters: string[]) {
        const assigns = exp.members.map(m => {
            const ae = m as AssignExpression;
            return `${ae.name} = ${this.expToStr(ae.right, scopes, parameters)}`;
        }).join(', ');

        return `new {${assigns}}`;
    }

    arrayToStr(exp: ArrayExpression, scopes: any[], parameters: string[]) {
        return `new[] {${exp.items.map(e => this.expToStr(e, scopes, parameters)).join(', ')}}`;
    }

    binaryToStr(exp: BinaryExpression, scopes: any[], parameters: string[]) {
        const left = this.expToStr(exp.left, scopes, parameters);
        const op = getBinaryOp(exp.operator);
        const right = this.expToStr(exp.right, scopes, parameters);

        return `${left} ${op} ${right}`;
    }

    memberToStr(exp: MemberExpression, scopes: any[], parameters: string[]) {
        const member = this.pascalize
            ? exp.name[0].toUpperCase() + exp.name.substr(1)
            : exp.name;
        return `${this.expToStr(exp.owner, scopes, parameters)}.${member}`;
    }

    indexerToStr(exp: IndexerExpression, scopes: any[], parameters: string[]) {
        return `${this.expToStr(exp.owner, scopes, parameters)}[${this.expToStr(exp.key, scopes, parameters)}]`;
    }

    funcToStr(exp: FuncExpression, scopes: any[], parameters: string[]) {
        const prm = exp.parameters.length == 1 ? exp.parameters[0] : `(${exp.parameters.join(', ')})`;
        return prm + ' => ' + this.expToStr(exp.body, scopes, [...exp.parameters, ...parameters]);
    }

    callToStr(exp: CallExpression, scopes: any[], parameters: string[]) {
        const callee = exp.callee as VariableExpression;
        if (callee.type !== ExpressionType.Member && callee.type !== ExpressionType.Variable)
            throw new Error(`Invalid function call ${this.expToStr(exp.callee, scopes, parameters)}`);

        const left = callee.type === ExpressionType.Variable
            ? ''
            : this.expToStr((callee as MemberExpression).owner, scopes, parameters) + '.';

        const func = callee.name;
        const prmless = parmeterlessFuncs[func];
        if (prmless) {
            if (exp.args.length)
                throw new Error(`No argument expected for function ${func}`);

            return `${left}${prmless}`;
        }

        const args = exp.args.map(a => this.expToStr(a, scopes, parameters)).join(', ');
        switch (func) {
            case 'substr': return left + `Substring(${args})`;
            case 'includes': return left + `Contains(${args})`;
        }

        const pascalFunc = func.charAt(0).toUpperCase() + func.substr(1);
        return `${left}${pascalFunc}(${args})`;
    }

    ternaryToStr(exp: TernaryExpression, scopes: any[], parameters: string[]) {
        const predicate = this.expToStr(exp.predicate, scopes, parameters);
        const whenTrue = this.expToStr(exp.whenTrue, scopes, parameters);
        const whenFalse = this.expToStr(exp.whenFalse, scopes, parameters);

        return `${predicate} ? ${whenTrue} : ${whenFalse}`;
    }

    valueToStr(value) {
        if (value == null)
            return 'null';
        if (typeof value === 'string')
            return `"${value.replace(/"/g, '""')}"`;
        if (Object.prototype.toString.call(value) === '[object Date]')
            return `"${value.toISOString()}"`;

        return value;
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
