import { IRequestProvider, IAjaxProvider, QueryParameter, mergeAjaxOptions } from "jinqu";
import { LinqQueryProvider } from "./linq-query-provider";
import { LinqOptions } from "./linq-query";
import { FetchAjaxProvider, FetchAttachedInfo } from "./fetch-request-provider";

export class LinqService<TAttachedInfo = FetchAttachedInfo, TAjaxProvider extends IAjaxProvider<TAttachedInfo> = FetchAjaxProvider> 
    implements IRequestProvider<LinqOptions, TAttachedInfo> {

    constructor(private readonly baseAddress = '', private readonly ajaxProvider: TAjaxProvider = <any>new FetchAjaxProvider()) {
    }

    static readonly defaultOptions: LinqOptions = {};

    request<TResult>(params: QueryParameter[], options: LinqOptions[]): PromiseLike<TResult> {
        const d = Object.assign({}, LinqService.defaultOptions);
        const o = (options || []).reduce(mergeLinqOptions, d);
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
        return new LinqQueryProvider<LinqOptions, TAttachedInfo>(this).createQuery<T>().withOptions({ url });
    }
}

export function mergeLinqOptions(o1: LinqOptions, o2: LinqOptions): LinqOptions {
    const o: LinqOptions = mergeAjaxOptions(o1, o2);
    o.pascalize = o2.pascalize != null ? o2.pascalize : o1.pascalize;
    o.includeResponse = o2.includeResponse != null ? o2.includeResponse : o1.includeResponse;
    return o;
}
