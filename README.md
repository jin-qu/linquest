# linquest - Remote Linq implementation with Jinqu infrastructure

[![Build Status](https://travis-ci.org/jin-qu/linquest.svg?branch=master)](https://travis-ci.org/jin-qu/linquest)
[![Coverage Status](https://coveralls.io/repos/github/jin-qu/linquest/badge.svg?branch=master)](https://coveralls.io/github/jin-qu/linquest?branch=master)	
[![npm version](https://badge.fury.io/js/linquest.svg)](https://badge.fury.io/js/linquest)	
<a href="https://snyk.io/test/npm/linquest"><img src="https://snyk.io/test/npm/linquest/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/npm/linquest" style="max-width:100%;"></a>

Written completely in TypeScript.

# Installation
```
npm i linquest
```

# Let's See

```JavaScript
// first, create a service
const service = new LinqService('https://my.company.service.com/');
// then create a query
const query = service.createQuery<Company>('Companies');
// execute the query
const result = await query.where(p => p.Id > 5).toArrayAsync();
```

# Request providers
Linquest uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) as default, you might need to use a [polyfill](https://github.com/github/fetch).

To use a custom request provider, you need to implement IAjaxProvider interface from [jinqu](https://github.com/jin-qu/jinqu/)

```JavaScript
import { IAjaxProvider, AjaxOptions } from "jinqu";

export class FetchRequestProvider implements IAjaxProvider {

  ajax<T>(o: AjaxOptions): Promise<T> {
    // implement this
  }
}

```

# Code Generation
With code generation from a metadata (like [Swagger](https://github.com/swagger-api) or [OpenAPI](https://github.com/OAI/OpenAPI-Specification/), you can really simplify the usage.

```JavaScript
// generated code

export interface Company {
    id: number;
    name: string;
    createDate: Date;
}

export class CompanyService extends LinqService {

    constructor(provider?: IAjaxProvider) {
        super('https://my.company.service.com/', provider);
    }

    companies() {
        return this.createQuery<Company>('Companies');
    }
}

// and you can use it like this
const service = new CompanyService();
const query = service.companies().where(c => c.name !== "Netflix"));
const result = await query.toArrayAsync();
```

# License
Jinqu is under the [MIT License](LICENSE).
