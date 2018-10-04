import { QueryPart, Query, PartArgument, AjaxFuncs, Func1, AjaxOptions } from "jinqu";

export class LinqQuery<T, TOptions extends LinqOptions = LinqOptions> extends Query<T> {

    include(selector: Func1<T, any>): LinqQuery<T> {
        return <LinqQuery<T>>this.create(QueryPart.create(LinqFuncs.include, [PartArgument.identifier(selector, [])]));
    }

    withOptions(options: TOptions): LinqQuery<T> {
        return <LinqQuery<T>>this.create(QueryPart.create(AjaxFuncs.options, [PartArgument.literal(options)]));
    }
}

export interface LinqOptions extends AjaxOptions {
    pascalize?: boolean;
}

const LinqFuncs = {
    include: 'include'
};
