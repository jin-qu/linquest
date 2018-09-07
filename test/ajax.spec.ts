import { expect } from 'chai';
import 'mocha';
import sinon from 'sinon';
import  { LinqService } from '../lib/linq-service';
import { Company } from './fixture';

import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('Service tests', () => {

    const service = new LinqService();
    const xhr = sinon.useFakeXMLHttpRequest();

    it('should set url', () => {
        const query = service.createQuery<Company>('Companies');

        expect(query.toArrayAsync()).eventually.be.null;
    });
});
