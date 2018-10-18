import 'mocha';
import { expect } from 'chai';
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import fetchMock = require('fetch-mock');
import { Company, CompanyService } from './fixture';
import { LinqService } from '../lib/linq-service';

chai.use(chaiAsPromised)
const emptyResponse = {};

describe('Fetch tests', () => {

    it('should set url', async () => {
        fetchMock.get(
            'Companies',
            emptyResponse,
            {
                method: 'GET',
                query: {
                    "$where": "o => o.id > 5",
                    "$orderBy": "o => o.id",
                    "$skip": "10",
                    "$take": "10"
                },
                overwriteRoutes: false
            }
        );

        const service = new LinqService();
        const query = service.createQuery<Company>('Companies')
            .where(o => o.id > 5)
            .orderBy(o => o.id)
            .skip(10)
            .take(10);

        const r = await query.toArrayAsync();
        expect(r).deep.equal(emptyResponse);

        const options = fetchMock.lastOptions();
        expect(options.method).to.equal('GET');

        fetchMock.restore();
    });

    it('should set inline count', async () => {
        fetchMock.get(
            'Companies',
            {
                headers: { 'X-Inline-Count': 42 },
                body: {}
            },
            {
                method: 'GET',
                query: {
                    "$inlineCount": "true",
                },
                overwriteRoutes: false
            }
        );

        const service = new LinqService();
        const query = service.createQuery<Company>('Companies').inlineCount();

        const r = await query.toArrayAsync();
        expect(r).property('$inlineCount').to.equal(42);

        fetchMock.restore();
    });

    it('should not set inline count', async () => {
        fetchMock.get(
            'Companies',
            {},
            {
                method: 'GET',
                query: {
                    "$inlineCount": "true",
                },
                overwriteRoutes: false
            }
        );

        const service = new LinqService();
        const query = service.createQuery<Company>('Companies').inlineCount();

        const r = await query.toArrayAsync();
        expect(r).to.not.have.property('$inlineCount');

        fetchMock.restore();
    });

    it('should return null', async () => {
        fetchMock.get(
            'Companies',
            {
                body: 'null'
            },
            {
                method: 'GET',
                overwriteRoutes: false
            }
        );

        const service = new LinqService();
        const query = service.createQuery<Company>('Companies');

        const r = await query.toArrayAsync();
        expect(r).to.be.null;

        fetchMock.restore();
    });

    it('should throw when timeout elapsed', async () => {
        fetchMock.get(
            'Companies',
            new Promise((r, _) => setTimeout(() => r(emptyResponse), 10)),
            { 
                method: 'GET',
                overwriteRoutes: false
            }
        );

        const service = new CompanyService();
        const query = service.companies().withOptions({ timeout: 1 });

        try {
            await query.toArrayAsync();
            expect.fail('Should have failed because of timeout');
        }
        catch (e) {
            expect(e).to.has.property('message', 'Request timed out');
        }

        fetchMock.restore();
    });
});
