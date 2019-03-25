import {
    AjaxFuncs, Ctor, IAjaxProvider, IRequestProvider,
    mergeAjaxOptions, QueryFunc, QueryParameter, Result,
} from "jinqu";
import { FetchProvider } from "jinqu-fetch";
import { getResource } from "./decorators";
import { LinqQuery, QueryOptions } from "./linq-query";
import { LinqQueryProvider } from "./linq-query-provider";

export class LinqService<TResponse = Response> implements IRequestProvider<QueryOptions> {
    public static readonly defaultOptions: QueryOptions = {};

    constructor(
        private readonly baseAddress = "",
        private readonly ajaxProvider: IAjaxProvider<TResponse> = new FetchProvider() as any) {
    }

    public request<T, TExtra>(params: QueryParameter[], options: QueryOptions[]): PromiseLike<Result<T, TExtra>> {
        params = params || [];
        const inlineCountEnabled = params.find((p) => p.key === "$" + QueryFunc.inlineCount);
        const l1 = params.length;
        params = params.filter((p) => p.key !== "$" + AjaxFuncs.includeResponse);
        const includeResponse = l1 !== params.length;

        const d = Object.assign({}, LinqService.defaultOptions);
        const o = (options || []).reduce(mergeQueryOptions, d);
        if (this.baseAddress) {
            if (this.baseAddress[this.baseAddress.length - 1] !== "/" && o.url && o.url[0] !== "/") {
                o.url = "/" + o.url;
            }
            o.url = this.baseAddress + (o.url || "");
        }
        o.params = params.concat(o.params || []);

        const promise = this.ajaxProvider.ajax<T>(o);

        return promise.then((r) => {
            let value = r.value as any;
            if (value && value.d !== void 0) {
                value = value.d;
            }

            if (!inlineCountEnabled && !includeResponse) {
                return value;
            }

            return {
                inlineCount: inlineCountEnabled ? Number(r.value && (r.value as any).inlineCount) : void 0,
                response: includeResponse ? r.response : void 0,
                value,
            };
        }) as any;
    }

    public createQuery<T>(resource: string | Ctor<T>): LinqQuery<T>;
    public createQuery<T>(resource: string, ctor: Ctor<T>): LinqQuery<T>;
    public createQuery<T>(resource: string | Ctor<T>, ctor?: Ctor<T>): LinqQuery<T> {
        if (typeof resource === "function") {
            ctor = resource;
            resource = getResource(ctor);
            if (!resource) {
                const r = /class (.*?)\s|\{|function (.*?)[\s|\(]/.exec(ctor.toString());
                resource = r[1] || r[2];
            }
        }

        const query = new LinqQueryProvider<QueryOptions>(this).createQuery<T>().withOptions({ url: resource });
        return ctor ? query.cast(ctor) as LinqQuery<T> : query;
    }
}

export function mergeQueryOptions(o1: QueryOptions, o2: QueryOptions): QueryOptions {
    const o: QueryOptions = mergeAjaxOptions(o1, o2);
    o.pascalize = o2.pascalize != null ? o2.pascalize : o1.pascalize;
    return o;
}
