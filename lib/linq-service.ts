import { IRequestProvider, IAjaxProvider, QueryParameter, mergeAjaxOptions } from "jinqu";
import { LinqQueryProvider } from "./linq-query-provider";
import { LinqQuery, LinqOptions } from "./linq-query";
import { FetchRequestProvider } from "./fetch-request-provider";

export class LinqService implements IRequestProvider<LinqOptions> {

    constructor(private readonly baseAddress = '', private readonly ajaxProvider: IAjaxProvider = new FetchRequestProvider()) {
    }

    static readonly defaultOptions: LinqOptions = {};

    request<TResult>(params: QueryParameter[], options: LinqOptions[]): PromiseLike<TResult> {
        const d = Object.assign({}, LinqService.defaultOptions);
        const o = (options || []).reduce(this.mergeLinqOptions, d);
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

    mergeLinqOptions(o1: LinqOptions, o2: LinqOptions): LinqOptions {
        const o: LinqOptions = mergeAjaxOptions(o1, o2);
        o.pascalize = o2.pascalize != null ? o2.pascalize : o1.pascalize;
        return o;
    }
}
