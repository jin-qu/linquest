import { AjaxOptions, AjaxResponse, IAjaxProvider, Value } from "@jin-qu/jinqu";
import { linqResource, LinqService } from "../index";

export const headers = {
    "Accept": "application/json; charset=utf-8",
    "Content-Type": "application/json; charset=utf-8"
};

export class MockAjaxProvider implements IAjaxProvider<Response> {
    public options: AjaxOptions;

    constructor(private readonly result = null) {
    }

    public ajax<T>(options: AjaxOptions): PromiseLike<Value<T> & AjaxResponse<Response>> {
        this.options = options;
        const response = { body: this.result } as Response;
        const result = { value: { d: this.result }, response };
        return Promise.resolve(result) as never;
    }
}

export class Country implements ICountry {
    public name: string;
}

export type ICountry = Country

export class City {
    public name: string;
}

@linqResource("Addresses")
export class Address {
    public text: string;
    public city: City;
}

@linqResource("Companies") // this should override
@linqResource("Company")
export class Company implements ICompany {
    public id: number;
    public name: string;
    public deleted: boolean;
    public createDate: Date;
    public addresses: Address[];
}

export type ICompany = Company

export class CompanyService extends LinqService {

    constructor(provider?: MockAjaxProvider) {
        super("", provider);
    }

    public companies() {
        return this.createQuery<ICompany>("Companies");
    }
}

export function getCompanies(): ICompany[] {
    return [
        { id: 1, name: "Netflix", createDate: new Date(), deleted: false, addresses: [] },
        { id: 2, name: "Google", createDate: new Date(), deleted: false, addresses: [] },
    ];
}
