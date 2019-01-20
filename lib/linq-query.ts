import { QueryPart, Query, PartArgument, AjaxFuncs, Func1, AjaxOptions, IQuery, IQueryPart } from "jinqu";

export class LinqQuery<T, TOptions extends QueryOptions = QueryOptions> extends Query<T> {

    withOptions(options: TOptions): LinqQuery<T> {
        return <any>this.create(QueryPart.create(AjaxFuncs.options, [PartArgument.literal(options)]));
    }

    setParameter(key: string, value: any): LinqQuery<T> {
        return this.withOptions(<any>{  params: [{ key, value }] });
    }

    include<TNav extends object>(selector: Func1<T, TNav[] | TNav>): IIncludedLinqQuery<T, TNav> {
        return this.createIncludedQuery(QueryPart.create(LinqFuncs.include, [PartArgument.identifier(selector, [])]));
    }

    protected createIncludedQuery<TNav extends object>(part: IQueryPart) {
        return new IncludedLinqQuery<T, TNav, TOptions>(this.provider, [...this.parts, part]);
    }
}

export class IncludedLinqQuery<TEntity, TProperty, TOptions extends QueryOptions = QueryOptions> 
        extends LinqQuery<TEntity, TOptions> implements IIncludedLinqQuery<TEntity, TProperty> {
    thenInclude<TNav extends object>(selector: Func1<TProperty, TNav[] | TNav>): IncludedLinqQuery<TEntity, TNav, TOptions> {
        return this.createIncludedQuery(QueryPart.create(LinqFuncs.thenInclude, [PartArgument.identifier(selector, [])]));
    }
}

export interface ILinqQuery<T> extends IQuery<T> {
    include<TNav extends object>(selector: Func1<T, TNav[] | TNav>): IIncludedLinqQuery<T, TNav>;
}

export interface IIncludedLinqQuery<TEntity, TProperty> extends ILinqQuery<TEntity> {
    thenInclude<TNav extends object>(selector: Func1<TProperty, TNav[] | TNav>): IIncludedLinqQuery<TEntity, TNav>;
}

export interface QueryOptions extends AjaxOptions {
    pascalize?: boolean;
}

const LinqFuncs = {
    include: 'include',
    thenInclude: 'thenInclude'
};
