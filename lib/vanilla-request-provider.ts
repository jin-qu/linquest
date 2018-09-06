import { IAjaxProvider, IRequestProvider, AjaxOptions, QueryParameter, mergeAjaxOptions } from "jinqu";

export class VanillaRequestProvider implements IRequestProvider<AjaxOptions>, IAjaxProvider {

    readonly defaultOptions: AjaxOptions = {};

    request<T>(params: QueryParameter[], options: AjaxOptions[]) {
        const o = (options || []).reduce(mergeAjaxOptions, this.defaultOptions);
        o.params = (params || []).concat(o.params || []);

        return this.ajax<T>(o);
    }

    ajax<T>(o: AjaxOptions) {
        var xhr = new XMLHttpRequest();

        const params = o.params && o.params.map(p => `p.key=${encodeURIComponent(p.value)}`).join('&');
        let url = `${o.url || ''}${params ? '?' + params : ''}`;

        xhr.open(o.method || 'GET', url);
        xhr.timeout = o.timeout;

        if (o.headers) {
            for (var p in o.headers) {
                xhr.setRequestHeader(p, o.headers[p]);
            }
        }

        return new Promise<T>((resolve, reject) => {
            xhr.onload = function () {
                xhr.onreadystatechange = null;
                xhr.abort = null;

                if (xhr.status === 200) {
                    resolve(xhr.response);
                }
                else {
                    reject(new Error(xhr.responseText));
                }
            };

            xhr.ontimeout = function () {
                xhr.onreadystatechange = null;
                xhr.abort = null;

                reject(new Error(xhr.responseText));
            };

            xhr.send(o.data);
        });
    }
}

export const vanillaRequestProviderInstance = new VanillaRequestProvider();
