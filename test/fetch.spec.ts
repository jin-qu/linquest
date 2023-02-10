import { expect } from "chai";
import chai = require("chai");
import chaiAsPromised = require("chai-as-promised");
import fetchMock = require("fetch-mock");
import "mocha";
import { LinqService } from "../index";
import { Company, CompanyService } from "./fixture";

chai.use(chaiAsPromised);
const emptyResponse = { d: {} };

// tslint:disable:no-unused-expression
describe("Fetch tests", () => {

    it("should set url", async () => {
        fetchMock.get(
            "Companies",
            emptyResponse,
            {
                method: "GET",
                overwriteRoutes: false,
                query: {
                    $orderBy: "o => o.id",
                    $skip: "10",
                    $take: "10",
                    $where: "o => o.id > 5",
                },
            },
        );

        const service = new LinqService();
        const query = service.createQuery<Company>("Companies")
            .where(o => o.id > 5)
            .orderBy(o => o.id)
            .skip(10)
            .take(10);

        const r = await query.toArrayAsync();
        expect(r).deep.equal(emptyResponse.d);

        const options = fetchMock.lastOptions();
        expect(options.method).to.equal("GET");

        fetchMock.restore();
    });

    it("should set inline count", async () => {
        fetchMock.get(
            "Companies",
            {
                d: [],
                inlineCount: 42,
            },
            {
                method: "GET",
                overwriteRoutes: false,
                query: {
                    $inlineCount: "true",
                },
            },
        );

        const service = new LinqService();
        const query = service.createQuery<Company>("Companies").inlineCount();

        const r = await query.toArrayAsync();
        expect(r.value).to.be.empty;
        expect(r.inlineCount).to.equal(42);

        fetchMock.restore();
    });

    it("should fail to set inline count", async () => {
        fetchMock.get(
            "Companies",
            {
                d: [],
            },
            {
                method: "GET",
                overwriteRoutes: false,
                query: {
                    $inlineCount: "true",
                },
            },
        );

        const service = new LinqService();
        const query = service.createQuery<Company>("Companies").inlineCount();

        const r = await query.toArrayAsync();
        expect(r.inlineCount).to.be.NaN;

        fetchMock.restore();
    });

    it("should include response", async () => {
        fetchMock.get(
            "Companies",
            {
                d: [],
            },
            {
                method: "GET",
                overwriteRoutes: false,
            },
        );

        const service = new LinqService();
        const query = service.createQuery<Company>("Companies").includeResponse();

        const r = await query.toArrayAsync();
        expect(r.value).to.have.length(0);
        expect(r.response).to.not.null;

        fetchMock.restore();
    });

    it("should return null", async () => {
        fetchMock.get(
            "Companies",
            {
                d: null,
            },
            {
                method: "GET",
                overwriteRoutes: false,
            },
        );

        const service = new LinqService();
        const query = service.createQuery<Company>("Companies");

        const r = await query.toArrayAsync();
        expect(r).to.be.null;

        fetchMock.restore();
    });

    it("should throw when timeout elapsed", async () => {
        fetchMock.get(
            "Companies",
            new Promise((r, _) => setTimeout(() => r(emptyResponse), 10)),
            {
                method: "GET",
                overwriteRoutes: false,
            },
        );

        const service = new CompanyService();
        const query = service.companies().withOptions({ timeout: 1 });

        try {
            await query.toArrayAsync();
            expect.fail("Should have failed because of timeout");
        } catch (e) {
            expect(e).to.has.property("message", "Request timed out");
        }

        fetchMock.restore();
    });
});
