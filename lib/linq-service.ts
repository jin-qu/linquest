import { IRequestProvider, IAjaxProvider, QueryParameter, mergeAjaxOptions, Ctor } from "jinqu";
import { FetchProvider } from "jinqu-fetch";
import { LinqQueryProvider } from "./linq-query-provider";
import { QueryOptions, LinqQuery } from "./linq-query";
import { getResource } from './decorators';

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

    createQuery<T>(resource: string): LinqQuery<T>;
    createQuery<T>(resource: string, ctor: Ctor<T>): LinqQuery<T>;
    createQuery<T>(ctor: Ctor<T>): LinqQuery<T>;
    createQuery<T>(resource: string | Ctor<T>, ctor?: Ctor<T>): LinqQuery<T> {
        if (typeof resource === 'function') {
            ctor = resource;
            resource = getResource(ctor);
            if (!resource) {
                const r = /class (.*?)\s|\{|function (.*?)[\s|\(]/.exec(ctor.toString());
                resource = r[1] || r[2];
            }
        }

        const query = new LinqQueryProvider<QueryOptions>(this).createQuery<T>().withOptions({ url: resource });
        return ctor ? <LinqQuery<T>>query.cast(ctor) : query;
    }
}

export function mergeQueryOptions(o1: QueryOptions, o2: QueryOptions): QueryOptions {
    const o: QueryOptions = mergeAjaxOptions(o1, o2);
    o.pascalize = o2.pascalize != null ? o2.pascalize : o1.pascalize;
    return o;
}
