# linquest - Remote Linq implementation with Jinqu infrastructure

[![Build and Test](https://github.com/jin-qu/linquest/actions/workflows/build.yml/badge.svg)](https://github.com/jin-qu/linquest/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/jin-qu/linquest/graph/badge.svg?token=k1OsNYGW3j)](https://codecov.io/gh/jin-qu/linquest)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/b36d26a0f95443bdacd6786bc17e9202)](https://app.codacy.com/gh/jin-qu/linquest/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
<a href="https://snyk.io/test/npm/@jin-qu/linquest"><img src="https://snyk.io/test/npm/@jin-qu/linquest/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/npm/@jin-qu/linquest" style="max-width:100%;"></a>

[![npm version](https://img.shields.io/npm/v/@jin-qu/linquest)](https://www.npmjs.com/package/@jin-qu/linquest)
[![npm downloads](https://img.shields.io/npm/dm/@jin-qu/linquest.svg)](https://www.npmjs.com/package/@jin-qu/linquest)

[![GitHub issues](https://img.shields.io/github/issues/jin-qu/linquest.svg)](https://github.com/jin-qu/linquest/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/jin-qu/linquest/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jin-qu/linquest.svg?style=social&label=Star)](https://github.com/jin-qu/linquest)
[![GitHub forks](https://img.shields.io/github/forks/jin-qu/linquest.svg?style=social&label=Fork)](https://github.com/jin-qu/linquest)

Written completely in TypeScript.

## Installation

> npm i @jin-qu/linquest

## Let's See

```javascript
// first, create a service
const service = new LinqService('https://my.company.service.com/');
// then create a query
const query = service.createQuery<Company>('Companies');
// execute the query
const result = await query.where(p => p.Id > 5).toArrayAsync();
```

## Request providers

Linquest uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) as default, you might need to use a [polyfill](https://github.com/github/fetch).

To use a custom request provider, you need to implement IAjaxProvider interface from [jinqu](https://github.com/jin-qu/jinqu/)

```typescript
import { IAjaxProvider, AjaxOptions } from "jinqu";

// implement the IAjaxProvider interface
export class MyAjaxProvider implements IAjaxProvider {

  ajax<T>(o: AjaxOptions): Promise<T> {
    // implement this
  }
}

// inject provider to LinqService
const service = new LinqService('https://my.company.service.com/', new MyAjaxProvider());
```

## Code Generation

With code generation from a metadata (like [Swagger](https://github.com/swagger-api) or [OpenAPI](https://github.com/OAI/OpenAPI-Specification/), you can really simplify the usage.

```typescript
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
const query = service.companies().where(c => c.name !== "Netflix");
const result = await query.toArrayAsync();
```

## Old Browsers

linquest uses jinqu as a querying platform, if you want to use jinqu features with old browsers, please refer to [jinqu documentation](https://github.com/jin-qu/jinqu#readme).

## License

Linquest is under the [MIT License](LICENSE).
