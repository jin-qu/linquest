import fetchMock from "jest-fetch-mock";
import { LinqService } from "..";
import { Company, CompanyService, headers } from "./fixture";

const emptyResponse = { d: {} };

describe("Fetch tests", () => {

    it("should set url", async () => {
        fetchMock.mockResponseOnce(JSON.stringify(emptyResponse));

        const service = new LinqService();
        const query = service.createQuery<Company>("Companies")
            .where(o => o.id > 5)
            .orderBy(o => o.id)
            .skip(10)
            .take(10);

        const r = await query.toArrayAsync();
        expect(r).toEqual(emptyResponse.d);
    
        const options = fetchMock.mock.lastCall;
        const request = [
            "Companies?$where=o%20%3D%3E%20o.id%20%3E%205&$orderBy=o%20%3D%3E%20o.id&$skip=10&$take=10",
            {
                body: undefined,
                method: "GET",
                headers
            }
        ];
        expect(options).toEqual(request);
    
        fetchMock.resetMocks();
    });

    it("should set inline count", async () => {
        fetchMock.mockResponseOnce(JSON.stringify({
            d: [],
            inlineCount: 42,
        }));

        const service = new LinqService();
        const query = service.createQuery<Company>("Companies").inlineCount();

        const r = await query.toArrayAsync();

        const options = fetchMock.mock.lastCall;
        const request = [
            "Companies?$inlineCount=true",
            {
                body: undefined,
                method: "GET",
                headers
            }
        ];
        expect(options).toEqual(request);

        expect(r.value).toHaveLength(0);
        expect(r.inlineCount).toBe(42);

        fetchMock.resetMocks();
    });

    it("should fail to set inline count", async () => {
        fetchMock.mockResponseOnce(JSON.stringify(emptyResponse));

        const service = new LinqService();
        const query = service.createQuery<Company>("Companies").inlineCount();

        const r = await query.toArrayAsync();

        const options = fetchMock.mock.lastCall;
        const request = [
            "Companies?$inlineCount=true",
            {
                body: undefined,
                method: "GET",
                headers
            }
        ];
        expect(options).toEqual(request);

        expect(r.inlineCount).toBe(NaN);

        fetchMock.resetMocks();
    });

    it("should include response", async () => {
        fetchMock.mockResponseOnce(JSON.stringify(emptyResponse));

        const service = new LinqService();
        const query = service.createQuery<Company>("Companies").includeResponse();

        const r = await query.toArrayAsync();

        expect(r.value).toHaveLength(0);
        expect(r.response).not.toBeNull();

        fetchMock.resetMocks();
    });

    it("should return null", async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ d: null }));

        const service = new LinqService();
        const query = service.createQuery<Company>("Companies");

        const r = await query.toArrayAsync();
        expect(r).toBeNull();

        fetchMock.resetMocks();
    });

    it("should throw when timeout elapsed", async () => {
        fetchMock.mockImplementationOnce(() => new Promise(r => setTimeout(() => r(null as never), 10)));
        
        const service = new CompanyService();
        const query = service.companies().withOptions({ timeout: 1 });

        try {
            await query.toArrayAsync();

            fail("Should have failed because of timeout");
        }
        catch (e) {
            expect(e).toHaveProperty("message", "Request timed out");
        }

        fetchMock.resetMocks();
    });
});
