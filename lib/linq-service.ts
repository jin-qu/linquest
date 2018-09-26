import { IRequestProvider, IAjaxProvider, AjaxOptions, QueryParameter, mergeAjaxOptions } from "jinqu";
import { LinqQueryProvider } from "./linq-query-provider";
import { LinqQuery } from "./linq-query";
import { FetchRequestProvider } from "./fetch-request-provider";

export class LinqService implements IRequestProvider<AjaxOptions> {

    constructor(private readonly baseAddress = '', private readonly ajaxProvider: IAjaxProvider = new FetchRequestProvider()) {
    }

    static readonly defaultOptions: AjaxOptions = {};

    request<TResult>(params: QueryParameter[], options: AjaxOptions[]): PromiseLike<TResult> {
        const d = Object.assign({}, LinqService.defaultOptions);
        const o = (options || []).reduce(mergeAjaxOptions, d);
        if (this.baseAddress) {
            if (this.baseAddress[this.baseAddress.length - 1] !== '/' && o.url && o.url[0] !== '/') {
                o.url = '/' + o.url;
            }
            o.url = this.baseAddress + (o.url || '');
        }
        o.params = (params || []).concat(o.params || []);

        return this.ajaxProvider.ajax(o);
    }

    createQuery<T>(url: string): LinqQuery<T> {
        return new LinqQueryProvider(this).createQuery<T>().withOptions({ url });
    }
}
