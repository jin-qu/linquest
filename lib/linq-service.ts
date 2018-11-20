import { IRequestProvider, IAjaxProvider, QueryParameter, mergeAjaxOptions } from "jinqu";
import { FetchProvider } from "jinqu-fetch";
import { LinqQueryProvider } from "./linq-query-provider";
import { QueryOptions } from "./linq-query";

export class LinqService implements IRequestProvider<QueryOptions> {

    constructor(private readonly baseAddress = '', private readonly ajaxProvider: IAjaxProvider = new FetchProvider()) {
    }

    static readonly defaultOptions: QueryOptions = {};

    request<TResult>(params: QueryParameter[], options: QueryOptions[]): PromiseLike<TResult> {
        const d = Object.assign({}, LinqService.defaultOptions);
        const o = (options || []).reduce(mergeQueryOptions, d);
        if (this.baseAddress) {
            if (this.baseAddress[this.baseAddress.length - 1] !== '/' && o.url && o.url[0] !== '/') {
                o.url = '/' + o.url;
            }
            o.url = this.baseAddress + (o.url || '');
        }
        o.params = (params || []).concat(o.params || []);

        return this.ajaxProvider.ajax(o);
    }

    createQuery<T>(url: string) {
        return new LinqQueryProvider<QueryOptions>(this).createQuery<T>().withOptions({ url });
    }
}

export function mergeQueryOptions(o1: QueryOptions, o2: QueryOptions): QueryOptions {
    const o: QueryOptions = mergeAjaxOptions(o1, o2);
    o.pascalize = o2.pascalize != null ? o2.pascalize : o1.pascalize;
    return o;
}
