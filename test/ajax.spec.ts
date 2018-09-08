import { expect } from 'chai';
import 'mocha';
import { LinqService } from '../lib/linq-service';
import { Company } from './fixture';

import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)

import mock from 'xhr-mocklet';

describe('Ajax tests', () => {

    mock.setup();
    let method, url;
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(m: string, u?: string) {
        method = m;
        url = u;
        open.call(this, arguments);
    };
    const service = new LinqService();

    after(function () {
        mock.teardown();
    });


    it('should set url', () => {
        const query = service.createQuery<Company>('Companies')
            .where(c => c.id != 1)
            .orderBy(c => c.id)
            .skip(10)
            .take(10);

        expect(query.toArrayAsync()).eventually.be.null;
        expect(method).to.equal('GET');
        const wherePart = encodeURIComponent('(c) => c.id != 1');
        const orderPart = encodeURIComponent('(c) => c.id');
        expect(url).to.equal(`Companies?$where=${wherePart}&$orderBy=${orderPart}&$skip=10&$take=10`);
    });
});
