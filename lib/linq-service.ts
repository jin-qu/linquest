import { AjaxOptions, IRequestProvider } from "jinqu";
import { vanillaRequestProviderInstance } from "./vanilla-request-provider";
import { LinqQueryProvider } from "./linq-query-provider";
import { LinqQuery } from "./linq-query";

export class LinqService {

    constructor(private readonly requestProvider: IRequestProvider<AjaxOptions> = vanillaRequestProviderInstance) {
    }

    createQuery<T>(url?: string): LinqQuery<T> {
        const q = new LinqQueryProvider(this.requestProvider).createQuery<T>();
        return url ? q.withOptions({ url }) : q;
    }
}
