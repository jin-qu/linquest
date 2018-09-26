import { expect } from 'chai';
import 'mocha';
import { Company, CompanyService } from './fixture';

import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)

import fetchMock = require('fetch-mock');
const emptyResponse = {};

describe('Ajax tests', () => {

    it('should set url', () => {
        fetchMock.get(
            `Companies`,
            emptyResponse,
            {
                method: 'GET',
                query: {
                    "$where": "o => o.id > 5",
                    "$orderBy": "o => o.id",
                    "$skip": "10",
                    "$take": "10"
                }
            }
        );

        const service = new CompanyService();
        const query = service.createQuery<Company>('Companies')
            .where(o => o.id > 5)
            .orderBy(o => o.id)
            .skip(10)
            .take(10);

        expect(query.toArrayAsync()).eventually.be.equal(emptyResponse);

        const options = fetchMock.lastOptions();
        expect(options.method).to.equal('GET');

        fetchMock.restore();
    });

    it('should throw when timeout elapsed', async () => {
        fetchMock.get(
            `Companies`,
            emptyResponse,
            { method: 'GET' }
        );

        const service = new CompanyService();
        const query = service.companies().withOptions({ timeout: 100 });

        expect(query.toArrayAsync()).eventually.be.rejectedWith('Request timed out');
    });
});
