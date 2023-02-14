/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CompanyService, MockAjaxProvider } from "./fixture";

const provider = new MockAjaxProvider();
const service = new CompanyService(provider);

describe("Inline function tests", () => {

    it("should be able to call Math", () => {
        const query = service.companies().where(c => Math.floor(c.id) === 1);

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.params;
        expect(params).toHaveLength(1);
        expect(params![0]).toHaveProperty("value", `c => Math.Floor(c.id) == 1`);
    });

    it("should be able to call Substring", () => {
        const query = service.companies().where(c => c.name.substring(1, 3) === "etf");

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.params;
        expect(params).toHaveLength(1);
        expect(params![0]).toHaveProperty("value", `c => c.name.Substring(1, 3) == "etf"`);
    });

    it("should be able to call Includes", () => {
        const query = service.companies().where(c => c.name.includes("flix"));

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.params;
        expect(params).toHaveLength(1);
        expect(params![0]).toHaveProperty("value", `c => c.name.Contains("flix")`);
    });

    it("should be able to call ToString", () => {
        const query = service.companies().where("c => c.toString()");

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.params;
        expect(params).toHaveLength(1);
        expect(params![0]).toHaveProperty("value", `c => c.ToString()`);
    });

    it("should be able to call from VariableExpression", () => {
        const query = service.companies().select(c => c.name).select("toLowerCase()");

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.params;
        expect(params).toHaveLength(2);
        expect(params![0]).toHaveProperty("value", `c => c.name`);
        expect(params![1]).toHaveProperty("value", `ToLower()`);
    });

    it("should throw for invalid arguments", () => {
        const query = service.companies().select(c => c.id.toString(42));

        expect(() => query.toArrayAsync()).toThrow();
    });

    it("should throw for invalid callee", () => {
        const query = service.companies().select("c => c.id.toString()()");

        expect(() => query.toArrayAsync()).toThrow();
    });
});
