import { QueryPart, Query, PartArgument, AjaxFuncs, Func1, AjaxOptions } from "jinqu";
import { FetchAttachedInfo } from "./fetch-ajax-provider";

export class LinqQuery<T, TOptions extends QueryOptions = QueryOptions, TAttachedInfo = FetchAttachedInfo> extends Query<T, TAttachedInfo> {

    include(selector: Func1<T, any>): LinqQuery<T, TOptions, TAttachedInfo> {
        return <any>this.create(QueryPart.create(LinqFuncs.include, [PartArgument.identifier(selector, [])]));
    }

    setParameter(key: string, value: any) {
        return this.withOptions(<any>{  params: [{ key, value }] });
    }

    withOptions(options: TOptions): LinqQuery<T, TOptions, TAttachedInfo> {
        return <any>this.create(QueryPart.create(AjaxFuncs.options, [PartArgument.literal(options)]));
    }
}

export interface QueryOptions extends AjaxOptions {
    pascalize?: boolean;
    includeResponse?: boolean;
}

const LinqFuncs = {
    include: 'include'
};
