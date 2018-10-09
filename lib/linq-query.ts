import { QueryPart, Query, PartArgument, AjaxFuncs, Func1, AjaxOptions } from "jinqu";
import { FetchAttachedInfo } from "./fetch-request-provider";

export class LinqQuery<T, TOptions extends LinqOptions = LinqOptions, TAttachedInfo = FetchAttachedInfo> extends Query<T, TAttachedInfo> {

    include(selector: Func1<T, any>): LinqQuery<T, TOptions, TAttachedInfo> {
        return <any>this.create(QueryPart.create(LinqFuncs.include, [PartArgument.identifier(selector, [])]));
    }

    withOptions(options: TOptions): LinqQuery<T, TOptions, TAttachedInfo> {
        return <any>this.create(QueryPart.create(AjaxFuncs.options, [PartArgument.literal(options)]));
    }
}

export interface LinqOptions extends AjaxOptions {
    pascalize?: boolean;
    includeResponse?: boolean;
}

const LinqFuncs = {
    include: 'include'
};
