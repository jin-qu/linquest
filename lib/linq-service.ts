import { IRequestProvider, IAjaxProvider, QueryParameter, mergeAjaxOptions, Ctor, Result, QueryFunc, AjaxFuncs } from "jinqu";
import { FetchProvider } from "jinqu-fetch";
import { LinqQueryProvider } from "./linq-query-provider";
import { QueryOptions, LinqQuery } from "./linq-query";
import { getResource } from './decorators';

export class LinqService<TResponse = Response> implements IRequestProvider<QueryOptions> {

    constructor(private readonly baseAddress = '', private readonly ajaxProvider: IAjaxProvider<TResponse> = <any>new FetchProvider()) {
    }

    static readonly defaultOptions: QueryOptions = {};

    request<T, TExtra>(params: QueryParameter[], options: QueryOptions[]): PromiseLike<Result<T, TExtra>> {
        params = params || [];
        const inlineCountEnabled = params.find(p => p.key === '$' + QueryFunc.inlineCount);
        const l1 = params.length;
        params = params.filter(p => p.key !== '$' + AjaxFuncs.includeResponse);
        const includeResponse = l1 !== params.length;

        const d = Object.assign({}, LinqService.defaultOptions);
        const o = (options || []).reduce(mergeQueryOptions, d);
        if (this.baseAddress) {
            if (this.baseAddress[this.baseAddress.length - 1] !== '/' && o.url && o.url[0] !== '/') {
                o.url = '/' + o.url;
            }
            o.url = this.baseAddress + (o.url || '');
        }
        o.params = params.concat(o.params || []);

        const p = this.ajaxProvider.ajax<T>(o);

        return <any>p.then(r => {
            let value = <any>r.value;
            if (value && value.d !== void 0) {
                value = value.d;
            }

            if (!inlineCountEnabled && !includeResponse)
                return value;

            return { 
                value: value,
                inlineCount: inlineCountEnabled ? Number(r.value && r.value['inlineCount']) : void 0,
                response: includeResponse ? r.response : void 0
            };
        });
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
