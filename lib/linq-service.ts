import {
    Ctor, IAjaxProvider
} from "jinqu";
import { FetchProvider } from "jinqu-fetch";
import { getResource } from "./decorators";
import { LinqQuery, QueryOptions } from "./linq-query";
import { LinqQueryProvider } from "./linq-query-provider";

export class LinqService<TResponse = Response> {
    public static readonly defaultOptions: QueryOptions = {};

    constructor(
        private readonly baseAddress = "",
        private readonly ajaxProvider: IAjaxProvider<TResponse> = new FetchProvider() as never) {
    }

    public createQuery<T>(resource: string | Ctor<T>): LinqQuery<T, QueryOptions, TResponse>;
    public createQuery<T>(resource: string, ctor: Ctor<T>): LinqQuery<T, QueryOptions, TResponse>;
    public createQuery<T>(resource: string | Ctor<T>, ctor?: Ctor<T>): LinqQuery<T, QueryOptions, TResponse> {
        if (typeof resource === "function") {
            ctor = resource;
            resource = getResource(ctor);
            if (!resource) {
                const r = /class (.*?)\s|\{|function (.*?)[\s|(]/.exec(ctor.toString());
                resource = r[1] || r[2];
            }
        }

        if (this.baseAddress) {
            resource = `${this.baseAddress}${this.baseAddress.endsWith("/") ? "" : "/"}${resource}`;
        }
        const query = new LinqQueryProvider<QueryOptions, TResponse>(this.ajaxProvider)
            .createQuery<T>()
            .withOptions(LinqService.defaultOptions)
            .withOptions({ url: resource });
        return ctor ? query.cast(ctor) as LinqQuery<T, QueryOptions, TResponse, object> : query;
    }
}
