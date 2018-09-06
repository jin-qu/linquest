import { AjaxOptions, IRequestProvider } from "jinqu";
import { vanillaRequestProviderInstance } from "./vanilla-request-provider";
import { LinqQueryProvider } from "./linq-query-provider";
import { LinqQuery } from "./linq-query";

export class LinqService {

    constructor(public readonly baseUrl: string = '', 
                private readonly requestProvider: IRequestProvider<AjaxOptions> = vanillaRequestProviderInstance) {
    }

    createQuery<T>(): LinqQuery<T> {
        return new LinqQueryProvider(this.requestProvider).createQuery<T>();
    }
}
