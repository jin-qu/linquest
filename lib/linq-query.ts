import { QueryPart, Query, PartArgument, AjaxFuncs, AjaxOptions } from "jinqu";

export class LinqQuery<T, TOptions extends AjaxOptions = AjaxOptions> extends Query<T> {

    withOptions(options: TOptions) {
        return this.create(QueryPart.create(AjaxFuncs.options, [PartArgument.literal(options)]));
    }
}
