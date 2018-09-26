import { AjaxOptions, IAjaxProvider } from 'jinqu';
import { LinqService } from '../lib/linq-service';

export class MockRequestProvider implements IAjaxProvider {

    options: AjaxOptions;

    ajax<T>(options: AjaxOptions) {
        this.options = options;
        return new Promise<T>(resolve => resolve(null));
    }
}

export class Address {
    id: number;
    text: string;
}

export interface Company {
    id: number;
    name: string;
    deleted: boolean;
    createDate: Date;
    address: Address;
}

export class CompanyService extends LinqService {

    constructor(provider?: MockRequestProvider) {
        super('', provider);
    }

    companies() {
        return this.createQuery<Company>('Companies');
    }
}
