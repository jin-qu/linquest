import { expect } from 'chai';
import 'mocha';
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import { QueryPart } from 'jinqu';
import { LinqQueryProvider, LinqService, LinqOptions } from '..';
import { CompanyService, MockRequestProvider } from './fixture';

chai.use(chaiAsPromised);

describe('Service tests', () => {

    const provider = new MockRequestProvider();
    const service = new CompanyService(provider);

    it('should set url', () => {
        const query1 = service.companies();
        expect(query1.toArrayAsync()).eventually.be.null;
        expect(provider).property('options').property('url').to.equal('Companies');

        const query2 = new LinqService('api', provider).createQuery('Companies');
        expect(query2.toArrayAsync()).eventually.be.null;
        expect(provider).property('options').property('url').to.equal('api/Companies');

        const query3 = new LinqService('api/', provider).createQuery('Companies');
        expect(query3.toArrayAsync()).eventually.be.null;
        expect(provider).property('options').property('url').to.equal('api/Companies');

        const query4 = new LinqService('api', provider).createQuery('/Companies');
        expect(query4.toArrayAsync()).eventually.be.null;
        expect(provider).property('options').property('url').to.equal('api/Companies');

        const query5 = new LinqService('api', provider).createQuery('');
        expect(query5.toArrayAsync()).eventually.be.null;
        expect(provider).property('options').property('url').to.equal('api');

        expect(service.request(null, null)).eventually.be.null;
    });

    it('should create where query parameter', () => {
        const query = service.companies()
            .where(c => !c.deleted && ((c.id < 3 && c.name === "Netflix") || (c.id >= 3 && c.name !== 'Netflix')));

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal('$where');
        expect(provider.options.params[0].value)
            .to.contain(`c => !c.deleted && ((c.id < 3 && c.name == "Netflix") || (c.id >= 3 && c.name != "Netflix"))`);
    });

    it('should create where with contains method', () => {
        const query = service.companies()
            .where(c => [1, 2, 3].contains(c.id));

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal('$where');
        expect(provider.options.params[0].value).to.contain(`c => new[] {1, 2, 3}.Contains(c.id)`);
    });

    it('should create where with indexer access', () => {
        const query = service.companies()
            .where(c => c.name[0] === 'N');

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal('$where');
        expect(provider.options.params[0].value).to.contain(`c => c.name[0] == "N"`);
    });

    it('should create where with Date filter', () => {
        const cd = new Date(1988, 2, 14);
        const query = service.companies()
            .where(c => c.createDate === cd, { cd });

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal('$where');
        expect(provider.options.params[0].value).to.contain(`c => c.createDate == "${cd.toISOString()}"`);
    });

    it('should create where with null filter', () => {
        const cd = new Date(1988, 2, 14);
        const query = service.companies()
            .where(c => c.name === null);

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal('$where');
        expect(provider.options.params[0].value).to.contain(`c => c.name == null`);
    });

    it('should create select with new object', () => {
        const query = service.companies().select(c => ({ id: c.id, name: c.name }));

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal('$select');
        expect(provider.options.params[0].value).to.contain(`c => (new {id = c.id, name = c.name})`);
    });

    it('should create select with ternary', () => {
        const query = service.companies().select(c => c.id > 10 ? 'BIG' : 'SMALL');

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal('$select');
        expect(provider.options.params[0].value).to.contain(`c => c.id > 10 ? "BIG" : "SMALL"`);
    });

    it('should create groupBy query parameter', () => {
        const query = service.companies().groupBy(c => c.name, (_, g) => g.count());

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].value).to.equal(`c => c.name;(_, g) => g.Count()`);
    });

    it('should create include', () => {
        const query = service.companies().include(c => c.address);

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal('$include');
        expect(provider.options.params[0].value).to.contain(`c => c.address`);
    });

    it('should pascalize member names', () => {
        const options: LinqOptions = { pascalize: true };
        const query = service.companies()
            .withOptions(options)
            .where(c => !c.deleted && ((c.id < 3 && c.name === "Netflix") || (c.id >= 3 && c.name !== 'Netflix')));

        expect(query.toArrayAsync()).eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal('$where');
        expect(provider.options.params[0].value)
            .to.contain(`c => !c.Deleted && ((c.Id < 3 && c.Name == "Netflix") || (c.Id >= 3 && c.Name != "Netflix"))`);
    });

    it('should throw when executed synchronously', () => {
        expect(() => service.companies().toArray()).to.throw();
    });

    it('should throw when async iterator called', () => {
        const query = service.companies().where(c => c.id == 1)
        expect(() => new LinqQueryProvider(service).executeAsyncIterator(query.parts)).to.throw();
    });

    it('should throw for unknown expression', () => {
        const invalidPart = new QueryPart('NONE', [<any>{ exp: { type: 'NONE' } }]);
        expect(() => new LinqQueryProvider(service).handlePart(invalidPart)).to.throw();
    });
});
