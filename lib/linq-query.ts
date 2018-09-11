import { QueryPart, Query, PartArgument, AjaxFuncs, AjaxOptions, Func1 } from "jinqu";

export class LinqQuery<T, TOptions extends AjaxOptions = AjaxOptions> extends Query<T> {

    include(selector: Func1<T, any>, ...scopes: any[]): LinqQuery<T> {
        return <LinqQuery<T>>this.create(QueryPart.create(LinqFuncs.include, [PartArgument.identifier(selector, scopes)]));
    }

    withOptions(options: TOptions): LinqQuery<T> {
        return <LinqQuery<T>>this.create(QueryPart.create(AjaxFuncs.options, [PartArgument.literal(options)]));
    }
}

const LinqFuncs = {
    include: 'include'
};
