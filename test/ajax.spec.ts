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
    let xhr;
    const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body?: Document | BodyInit) {
        xhr = this;
        send.call(this, arguments);
    };
    const service = new LinqService();

    after(function () {
        mock.teardown();
    });

    it('should set url', () => {
        const query = service.createQuery<Company>('Companies')
            .where(c => c.name != '!=')
            .orderBy(c => c.id)
            .skip(10)
            .take(10);

        expect(query.toArrayAsync()).eventually.be.null;
        expect(xhr.method).to.equal('GET');
        const wherePart = encodeURIComponent('it.name != "!="');
        const orderPart = encodeURIComponent('it.id');
        expect(xhr.url).to.equal(`Companies?$where=${wherePart}&$orderBy=${orderPart}&$skip=10&$take=10`);
    });
});
