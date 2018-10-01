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

### Request providers
Linquest uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) as default, you might need to use a [polyfill](https://github.com/github/fetch).

To use a custom request provider, you need to implement IAjaxProvider interface from [jinqu](https://github.com/jin-qu/jinqu/)

```
import { IAjaxProvider, AjaxOptions } from "jinqu";

export class FetchRequestProvider implements IAjaxProvider {

  ajax<T>(o: AjaxOptions): Promise<T> {
    // implement this
  }
}

```

# Supported Expressions
where, ofType, cast, select, selectMany, join, groupJoin, orderBy, orderByDescending, thenBy, thenByDescending, take, takeWhile, skip, skipWhile, groupBy, distinct, concat, zip, union, intersect, except, defaultIfEmpty, reverse, first, firstOrDefault, last, lastOrDefault, single, singleOrDefault, elementAt, elementAtOrDefault, contains, sequenceEqual, any, all, count, min, max, sum, average, aggregate, toArray

Array.range, Array.repeat

# And more...
It's not just Linq implementation, thanks to [Jokenizer](https://github.com/umutozel/jokenizer) expressions and flexible architecture, we can use Jinqu to create custom querying libraries - like OData, GraphQL or Server-Side Linq. Take a look at [Beetle.js](https://github.com/Beetlejs/beetle.js)


# License
Jinqu is under the [MIT License](LICENSE).
