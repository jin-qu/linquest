/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { QueryPart } from "@jin-qu/jinqu";
import "@jin-qu/array-extensions";
import { LinqQueryProvider, LinqService, QueryOptions } from "../index";
import { Company, CompanyService, Country, getCompanies, ICompany, ICountry, MockAjaxProvider } from "./fixture";

describe("Service tests", () => {

    const provider = new MockAjaxProvider();
    const service = new CompanyService(provider);

    it("should set url", () => {
        const query1 = service.companies();
        expect(query1.toArrayAsync()).resolves.toBeNull();
        expect(provider.options.$url).toBe("Companies");

        const query2 = new LinqService("api", provider).createQuery("Companies");
        expect(query2.toArrayAsync()).resolves.toBeNull();
        expect(provider.options.$url).toBe("api/Companies");

        const query3 = new LinqService("api/", provider).createQuery("Companies");
        expect(query3.toArrayAsync()).resolves.toBeNull();
        expect(provider.options.$url).toBe("api/Companies");

        const query4 = new LinqService("api", provider).createQuery("/Companies");
        expect(query4.toArrayAsync()).resolves.toBeNull();
        expect(provider.options.$url).toBe("api/Companies");

        const query5 = new LinqService("api", provider).createQuery("");
        expect(query5.toArrayAsync()).resolves.toBeNull();
        expect(provider.options.$url).toBe("api");
    });

    it("should create where query parameter", () => {
        const query = service.companies()
            .setParameter("id", "42")
            .where(c => !c.deleted && ((c.id < 3 && c.name === "Netflix") || (c.id >= 3 && c.name !== "Netflix")));

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.$params;
        expect(params).toHaveLength(2);
        expect(params![0].key).toBe("id");
        expect(params![0].value).toBe("42");
        expect(params![1].key).toBe("$where");
        expect(params![1].value)
            .toContain(`c => !c.deleted && ((c.id < 3 && c.name == "Netflix") || (c.id >= 3 && c.name != "Netflix"))`);
    });

    it("should create where with contains method", () => {
        const query = service.companies()
            .where(c => [1, 2, 3].contains(c.id));

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.$params;
        expect(params).toHaveLength(1);
        expect(params![0].key).toBe("$where");
        expect(params![0].value).toContain(`c => new[] {1, 2, 3}.Contains(c.id)`);
    });

    it("should create where with indexer access", () => {
        const query = service.companies()
            .where(c => c.name[0] === "N");

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.$params;
        expect(params).toHaveLength(1);
        expect(params![0].key).toBe("$where");
        expect(params![0].value).toContain(`c => c.name[0] == "N"`);
    });

    it("should create where with Date filter", () => {
        const cd = new Date(1988, 2, 14);
        const query = service.companies()
            .where(c => c.createDate === cd, { cd });

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.$params;
        expect(params).toHaveLength(1);
        expect(params![0].key).toBe("$where");
        expect(params![0].value).toContain(`c => c.createDate == "${cd.toISOString()}"`);
    });

    it("should create where with null filter", () => {
        const query = service.companies()
            .where(c => c.name === null);

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.$params;
        expect(params).toHaveLength(1);
        expect(params![0].key).toBe("$where");
        expect(params![0].value).toContain(`c => c.name == null`);
    });

    it("should create select with new object", () => {
        const query = service.companies().select(c => ({ id: c.id, name: c.name }));

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.$params;
        expect(params).toHaveLength(1);
        expect(params![0].key).toBe("$select");
        expect(params![0].value).toContain(`c => (new {id = c.id, name = c.name})`);
    });

    it("should create select with ternary", () => {
        const query = service.companies().select(c => c.id > 10 ? "BIG" : "SMALL");

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.$params;
        expect(params).toHaveLength(1);
        expect(params![0].key).toBe("$select");
        expect(params![0].value).toContain(`c => c.id > 10 ? "BIG" : "SMALL"`);
    });

    it("should create groupBy query parameter", () => {
        const query = service.companies().groupBy(c => c.name, (_, g) => g.count());

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.$params;
        expect(params).toHaveLength(1);
        expect(params![0].value).toBe(`c => c.name;(_, g) => g.Count()`);
    });

    it("should create include", () => {
        const query = service.companies()
            .include(c => c.addresses)
                .thenInclude(a => a.city);

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.$params;
        expect(params).toHaveLength(2);
        expect(params![0].key).toBe("$include");
        expect(params![0].value).toContain(`c => c.address`);
        expect(params![1].key).toBe("$thenInclude");
        expect(params![1].value).toContain(`a => a.city`);
    });

    it("should handle cast", async () => {
        const prv = new MockAjaxProvider(getCompanies());
        const svc = new LinqService("", prv);
        const result = await svc.createQuery<ICompany>("companies").cast(Company).toArrayAsync();

        result.forEach(c => expect(c).toBeInstanceOf(Company));
    });

    it("should handle cast via createQuery", async () => {
        const prv = new MockAjaxProvider(getCompanies());
        const svc = new LinqService("", prv);
        const result = await svc.createQuery<ICompany>("companies", Company).toArrayAsync();

        result.forEach(c => expect(c).toBeInstanceOf(Company));
    });

    it("should handle cast via createQuery with decorator", async () => {
        const prv = new MockAjaxProvider(getCompanies());
        const svc = new LinqService("", prv);
        const result = await svc.createQuery<ICompany>(Company).toArrayAsync();

        expect(prv.options.$url).toBe("Companies");
        result.forEach(c => expect(c).toBeInstanceOf(Company));
    });

    it("should handle cast via createQuery without decorator", async () => {
        const prv = new MockAjaxProvider(getCompanies());
        const svc = new LinqService("", prv);
        const result = await svc.createQuery<ICountry>(Country).toArrayAsync();

        expect(prv.options.$url).toBe("Country");
        result.forEach(r => expect(r).toBeInstanceOf(Country));
    });

    it("should handle cast via toArrayAsync", async () => {
        const prv = new MockAjaxProvider(getCompanies());
        const svc = new LinqService("", prv);
        const result = await svc.createQuery<ICompany>("Companies").toArrayAsync(Company);

        result.forEach(r => expect(r).toBeInstanceOf(Company));
    });

    it("should handle cast for nested values", async () => {
        const data = getCompanies().map(c => ({ company: c }));
        const prv = new MockAjaxProvider(data);
        const svc = new LinqService("", prv);
        const query = svc.createQuery<{ company: ICompany }>("Companies");
        const result = await query.select<ICompany>(d => d.company, Company).toArrayAsync();

        result.forEach(r => expect(r).toBeInstanceOf(Company));
    });

    it("should pascalize member names", () => {
        const options: QueryOptions = { pascalize: true };
        const query = service.companies()
            .withOptions(options)
            .where(c => !c.deleted && ((c.id < 3 && c.name === "Netflix") || (c.id >= 3 && c.name !== "Netflix")));

        expect(query.toArrayAsync()).resolves.toBeNull();
        const params = provider.options.$params;
        expect(params).toHaveLength(1);
        expect(params![0].key).toBe("$where");
        expect(params![0].value).toContain(`c => !c.Deleted && ((c.Id < 3 && c.Name == "Netflix") || (c.Id >= 3 && c.Name != "Netflix"))`);
    });

    it("should throw when executed synchronously", () => {
        expect(() => service.companies().toArray()).toThrow();
    });

    it("should throw for unknown expression", () => {
        const invalidPart = new QueryPart("NONE", [{ exp: { type: "NONE" } } as never]);
        expect(() => new LinqQueryProvider(provider).handlePart(invalidPart)).toThrow();
    });
});
