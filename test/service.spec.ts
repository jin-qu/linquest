import { expect, should } from 'chai';
import 'mocha';
import  { LinqService } from '../lib/linq-service';
import { MockRequestProvider, Company } from './fixture';

import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('Service tests', () => {

    const provider = new MockRequestProvider();
    const service = new LinqService(provider);

    it('should set url', () => {
        const query = service.createQuery<Company>('Companies');

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider).property('options').property('url').to.equal('Companies');
    });

    it('should create where query parameter', () => {
        const query = service.createQuery<Company>('Companies').where(c => c.id === 3);

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].value).to.contain(`(c) => c.id == 3`);
    });

    it('should create groupBy query parameter', () => {
        const query = service.createQuery<Company>('Companies').groupBy(c => c.name, g => g.count());

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].value).to.equal(`(c) => c.name;(g) => g.count()`);
    });
});
