import { AjaxOptions, AjaxResponse, IAjaxProvider, Value } from "jinqu";
import { linqResource, LinqService } from "../index";

// tslint:disable:max-classes-per-file

export class MockRequestProvider implements IAjaxProvider<Response> {
    public options: AjaxOptions;

    constructor(private readonly result = null) {
    }

    public ajax<T>(options: AjaxOptions): PromiseLike<Value<T> & AjaxResponse<Response>> {
        this.options = options;
        const response = { body: this.result } as Response;
        const result = { value: { d: this.result }, response };
        return Promise.resolve(result) as any;
    }
}

export class Country implements ICountry {
    public name: string;
}

// tslint:disable-next-line:no-empty-interface
export interface ICountry extends Country { }

export class City {
    public name: string;
}

@linqResource("Addresses")
export class Address {
    public id: number;
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

// tslint:disable-next-line:no-empty-interface
export interface ICompany extends Company { }

export class CompanyService extends LinqService {

    constructor(provider?: MockRequestProvider) {
        super("", provider);
    }

    public companies() {
        return this.createQuery<ICompany>("Companies");
    }
}

export function getCountries(): ICountry[] {
    return [
        { name: "Uganda" },
        { name: "Nauru" },
    ];
}

export function getCompanies(): ICompany[] {
    return [
        { id: 1, name: "Netflix", createDate: new Date(), deleted: false, addresses: [] },
        { id: 2, name: "Google", createDate: new Date(), deleted: false, addresses: [] },
    ];
}
