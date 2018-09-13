import { AjaxOptions, IAjaxProvider } from 'jinqu';

export class MockRequestProvider implements IAjaxProvider {

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
