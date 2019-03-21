import { AjaxOptions, IAjaxProvider, Value, AjaxResponse } from 'jinqu';
import { LinqService, linqResource } from '../index';

export class MockRequestProvider implements IAjaxProvider<Response> {

    constructor(private readonly result = null) {
    }

    options: AjaxOptions;

    ajax<T>(options: AjaxOptions): PromiseLike<Value<T> & AjaxResponse<Response>> {
        this.options = options;
        const response = <Response>{ body: this.result };
        const result = { value: { d: this.result }, response };
        return <any>Promise.resolve(result);
    }
}

export class Country implements ICountry {
    name: string;
}

export interface ICountry extends Country { }

export class City {
    name: string;
}

@linqResource('Addresses')
export class Address {
    id: number;
    text: string;
    city: City;
}

@linqResource('Companies') // this should override
@linqResource('Company')
export class Company implements ICompany {
    id: number;    
    name: string;
    deleted: boolean;
    createDate: Date;
    addresses: Address[];
}

export interface ICompany extends Company { }

export class CompanyService extends LinqService {

    constructor(provider?: MockRequestProvider) {
        super('', provider);
    }

    companies() {
        return this.createQuery<ICompany>('Companies');
    }
}

export function getCountries(): ICountry[] {
    return [
        { name: 'Uganda' },
        { name: 'Nauru' }
    ];
}

export function getCompanies(): ICompany[] {
    return [
        { id: 1, name: 'Netflix', createDate: new Date(), deleted: false, addresses: [] },
        { id: 2, name: 'Google', createDate: new Date(), deleted: false, addresses: [] }
    ];
};
