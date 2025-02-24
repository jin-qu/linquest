import {
    AjaxFuncs, AjaxOptions, AjaxResponse, Func1, IQuery,
    IQueryPart, PartArgument, Query, QueryPart
} from "@jin-qu/jinqu";

export interface ILinqQuery<T, TExtra = object> extends IQuery<T, TExtra> {
    include<TNav extends object>(selector: Func1<T, TNav[] | TNav>): IIncludedLinqQuery<T, TNav, TExtra>;
}

export interface IIncludedLinqQuery<TEntity, TProperty, TExtra = object> extends ILinqQuery<TEntity, TExtra> {
    thenInclude<TNav extends object>(selector: Func1<TProperty, TNav[] | TNav>): IIncludedLinqQuery<TEntity, TNav, TExtra>;
}

export interface QueryOptions extends AjaxOptions {
    pascalize?: boolean;
}

const LinqFuncs = {
    include: "include",
    thenInclude: "thenInclude",
};

export class LinqQuery<T, TOptions extends QueryOptions = QueryOptions, TResponse = Response, TExtra = object>
    extends Query<T, TExtra> {

    public withOptions(options: TOptions): LinqQuery<T, TOptions, TResponse, TExtra> {
        return this.create(QueryPart.create(AjaxFuncs.options, [PartArgument.literal(options)])) as never;
    }

    public setParameter(key: string, value: unknown): LinqQuery<T, TOptions, TResponse, TExtra> {
        return this.withOptions({ $params: [{ key, value }] } as TOptions);
    }

    public includeResponse(): LinqQuery<T, TOptions, TResponse, TExtra & AjaxResponse<TResponse>> {
        const part = new QueryPart(AjaxFuncs.includeResponse, []);
        return this.create(part) as never;
    }

    public include<TNav extends object>(selector: Func1<T, TNav[] | TNav>): IIncludedLinqQuery<T, TNav, TExtra> {
        return this.createIncludedQuery(QueryPart.create(LinqFuncs.include, [PartArgument.identifier(selector, [])]));
    }

    protected createIncludedQuery<TNav extends object>(part: IQueryPart) {
        return new IncludedLinqQuery<T, TNav, TOptions, TResponse, TExtra>(this.provider, [...this.parts, part]);
    }
}

export class IncludedLinqQuery<TEntity, TProperty, TOptions extends QueryOptions = QueryOptions, TResponse = never, TExtra = object>
        extends LinqQuery<TEntity, TOptions, TResponse, TExtra>
        implements IIncludedLinqQuery<TEntity, TProperty, TExtra> {

    public thenInclude<TNav extends object>(selector: Func1<TProperty, TNav[] | TNav>): IIncludedLinqQuery<TEntity, TNav, TExtra> {
        return this.createIncludedQuery(
            QueryPart.create(LinqFuncs.thenInclude, [PartArgument.identifier(selector, [])]),
        );
    }
}
