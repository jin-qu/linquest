import { AjaxFuncs, AjaxOptions, AjaxResponse, Func1, IQuery, IQueryPart, PartArgument, Query, QueryPart } from "jinqu";

// tslint:disable:max-classes-per-file

export class LinqQuery<T, TOptions extends QueryOptions = QueryOptions, TResponse = Response, TExtra = {}>
    extends Query<T, TExtra> {

    public withOptions(options: TOptions): LinqQuery<T, TOptions, TResponse, TExtra> {
        return this.create(QueryPart.create(AjaxFuncs.options, [PartArgument.literal(options)])) as any;
    }

    public setParameter(key: string, value: any): LinqQuery<T, TOptions, TResponse, TExtra> {
        return this.withOptions({  params: [{ key, value }] } as any);
    }

    public includeResponse(): LinqQuery<T, TOptions, TResponse, TExtra & AjaxResponse<TResponse>> {
        const part = new QueryPart(AjaxFuncs.includeResponse, []);
        return this.create(part) as any;
    }

    public include<TNav extends object>(selector: Func1<T, TNav[] | TNav>): IIncludedLinqQuery<T, TNav, TExtra> {
        return this.createIncludedQuery(QueryPart.create(LinqFuncs.include, [PartArgument.identifier(selector, [])]));
    }

    protected createIncludedQuery<TNav extends object>(part: IQueryPart) {
        return new IncludedLinqQuery<T, TNav, TOptions, TResponse, TExtra>(this.provider, [...this.parts, part]);
    }
}

export class
    IncludedLinqQuery<TEntity, TProperty, TOptions extends QueryOptions = QueryOptions, TResponse = any, TExtra = {}>
        extends LinqQuery<TEntity, TOptions, TResponse, TExtra>
        implements IIncludedLinqQuery<TEntity, TProperty, TExtra> {

    public thenInclude<TNav extends object>(selector: Func1<TProperty, TNav[] | TNav>)
            : IIncludedLinqQuery<TEntity, TNav, TExtra> {
        return this.createIncludedQuery(
            QueryPart.create(LinqFuncs.thenInclude, [PartArgument.identifier(selector, [])]),
        );
    }
}

export interface ILinqQuery<T, TExtra = {}> extends IQuery<T, TExtra> {
    include<TNav extends object>(selector: Func1<T, TNav[] | TNav>): IIncludedLinqQuery<T, TNav, TExtra>;
}

export interface IIncludedLinqQuery<TEntity, TProperty, TExtra = {}> extends ILinqQuery<TEntity, TExtra> {
    thenInclude<TNav extends object>(selector: Func1<TProperty, TNav[] | TNav>)
        : IIncludedLinqQuery<TEntity, TNav, TExtra>;
}

export interface QueryOptions extends AjaxOptions {
    pascalize?: boolean;
}

const LinqFuncs = {
    include: "include",
    thenInclude: "thenInclude",
};
