import { QueryPart, Query, PartArgument, AjaxFuncs, Func1, AjaxOptions } from "jinqu";

export class LinqQuery<T, TOptions extends QueryOptions = QueryOptions> extends Query<T> {

    include(selector: Func1<T, any>): LinqQuery<T, TOptions> {
        return <any>this.create(QueryPart.create(LinqFuncs.include, [PartArgument.identifier(selector, [])]));
    }

    setParameter(key: string, value: any) {
        return this.withOptions(<any>{  params: [{ key, value }] });
    }

    withOptions(options: TOptions): LinqQuery<T, TOptions> {
        return <any>this.create(QueryPart.create(AjaxFuncs.options, [PartArgument.literal(options)]));
    }
}

export interface QueryOptions extends AjaxOptions {
    pascalize?: boolean;
}

const LinqFuncs = {
    include: 'include'
};
