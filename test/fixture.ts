import { AjaxOptions, IAjaxProvider } from 'jinqu';
import { LinqService } from '..';
import { linqResource } from '../lib/decorators';

export class MockRequestProvider implements IAjaxProvider {

    constructor(private result = null) {
    }
    
    options: AjaxOptions;

    ajax<T>(options: AjaxOptions) {
        this.options = options;
        return new Promise<T>(resolve => resolve(this.result));
    }
}

export interface ICountry {
    name: string;
}

export class Country {
    name: string;
}

export class City {
    name: string;
}

@linqResource('Addresses')
export class Address {
    id: number;
    text: string;
    city: City;
}

export interface ICompany {
    id: number;
    name: string;
    deleted: boolean;
    createDate: Date;
    addresses: Address[];
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
