import { AjaxOptions } from 'jinqu';
import { VanillaRequestProvider } from '../lib/vanilla-request-provider';

export class MockRequestProvider extends VanillaRequestProvider {

    options: AjaxOptions;

    ajax<T>(options: AjaxOptions) {
        this.options = options;
        return new Promise<T>(resolve => resolve(null));
    }
}

export interface Company {
    id: number;
    name: string;
}
