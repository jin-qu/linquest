import { expect } from "chai";
import chai = require("chai");
import chaiAsPromised = require("chai-as-promised");
import { QueryPart } from "jinqu";
import "mocha";
import { LinqQueryProvider, LinqService, QueryOptions } from "../index";
import { Company, CompanyService, Country, getCompanies, ICompany, ICountry, MockRequestProvider } from "./fixture";

chai.use(chaiAsPromised);

// tslint:disable:no-unused-expression
describe("Service tests", () => {

    const provider = new MockRequestProvider();
    const service = new CompanyService(provider);

    it("should set url", () => {
        const query1 = service.companies();
        expect(query1.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider).property("options").property("url").to.equal("Companies");

        const query2 = new LinqService("api", provider).createQuery("Companies");
        expect(query2.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider).property("options").property("url").to.equal("api/Companies");

        const query3 = new LinqService("api/", provider).createQuery("Companies");
        expect(query3.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider).property("options").property("url").to.equal("api/Companies");

        const query4 = new LinqService("api", provider).createQuery("/Companies");
        expect(query4.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider).property("options").property("url").to.equal("api/Companies");

        const query5 = new LinqService("api", provider).createQuery("");
        expect(query5.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider).property("options").property("url").to.equal("api");

        expect(service.request(null, null)).to.be.fulfilled.and.eventually.be.null;
    });

    it("should create where query parameter", () => {
        const query = service.companies()
            .setParameter("id", "42")
            .where((c) => !c.deleted && ((c.id < 3 && c.name === "Netflix") || (c.id >= 3 && c.name !== "Netflix")));

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(2);
        expect(provider.options.params[0].key).to.equal("$where");
        expect(provider.options.params[0].value)
            .to.contain(`c => !c.deleted && ((c.id < 3 && c.name == "Netflix") || (c.id >= 3 && c.name != "Netflix"))`);
        expect(provider.options.params[1].key).to.equal("id");
        expect(provider.options.params[1].value).to.equal("42");
    });

    it("should create where with contains method", () => {
        const query = service.companies()
            .where((c) => [1, 2, 3].contains(c.id));

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal("$where");
        expect(provider.options.params[0].value).to.contain(`c => new[] {1, 2, 3}.Contains(c.id)`);
    });

    it("should create where with indexer access", () => {
        const query = service.companies()
            .where((c) => c.name[0] === "N");

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal("$where");
        expect(provider.options.params[0].value).to.contain(`c => c.name[0] == "N"`);
    });

    it("should create where with Date filter", () => {
        const cd = new Date(1988, 2, 14);
        const query = service.companies()
            .where((c) => c.createDate === cd, { cd });

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal("$where");
        expect(provider.options.params[0].value).to.contain(`c => c.createDate == "${cd.toISOString()}"`);
    });

    it("should create where with null filter", () => {
        const cd = new Date(1988, 2, 14);
        const query = service.companies()
            .where((c) => c.name === null);

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal("$where");
        expect(provider.options.params[0].value).to.contain(`c => c.name == null`);
    });

    it("should create select with new object", () => {
        const query = service.companies().select((c) => ({ id: c.id, name: c.name }));

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal("$select");
        expect(provider.options.params[0].value).to.contain(`c => (new {id = c.id, name = c.name})`);
    });

    it("should create select with ternary", () => {
        const query = service.companies().select((c) => c.id > 10 ? "BIG" : "SMALL");

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal("$select");
        expect(provider.options.params[0].value).to.contain(`c => c.id > 10 ? "BIG" : "SMALL"`);
    });

    it("should create groupBy query parameter", () => {
        const query = service.companies().groupBy((c) => c.name, (_, g) => g.count());

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].value).to.equal(`c => c.name;(_, g) => g.Count()`);
    });

    it("should create include", () => {
        const query = service.companies()
            .include((c) => c.addresses)
                .thenInclude((a) => a.city);

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(2);
        expect(provider.options.params[0].key).to.equal("$include");
        expect(provider.options.params[0].value).to.contain(`c => c.address`);
        expect(provider.options.params[1].key).to.equal("$thenInclude");
        expect(provider.options.params[1].value).to.contain(`a => a.city`);
    });

    it("should handle cast", async () => {
        const prv = new MockRequestProvider(getCompanies());
        const svc = new LinqService("", prv);
        const result = await svc.createQuery<ICompany>("companies").cast(Company).toArrayAsync();

        result.forEach((c) => expect(c).to.be.instanceOf(Company));
    });

    it("should handle cast via createQuery", async () => {
        const prv = new MockRequestProvider(getCompanies());
        const svc = new LinqService("", prv);
        const result = await svc.createQuery<ICompany>("companies", Company).toArrayAsync();

        result.forEach((c) => expect(c).to.be.instanceOf(Company));
    });

    it("should handle cast via createQuery with decorator", async () => {
        const prv = new MockRequestProvider(getCompanies());
        const svc = new LinqService("", prv);
        const result = await svc.createQuery<ICompany>(Company).toArrayAsync();

        expect(prv.options.url).equal("Companies");
        result.forEach((c) => expect(c).to.be.instanceOf(Company));
    });

    it("should handle cast via createQuery without decorator", async () => {
        const prv = new MockRequestProvider(getCompanies());
        const svc = new LinqService("", prv);
        const result = await svc.createQuery<ICountry>(Country).toArrayAsync();

        expect(prv.options.url).equal("Country");
        result.forEach((r) => expect(r).to.be.instanceOf(Country));
    });

    it("should handle cast via toArrayAsync", async () => {
        const prv = new MockRequestProvider(getCompanies());
        const svc = new LinqService("", prv);
        const result = await svc.createQuery<ICompany>("Companies").toArrayAsync(Company);

        result.forEach((r) => expect(r).to.be.instanceOf(Company));
    });

    it("should handle cast for nested values", async () => {
        const data = getCompanies().map((c) => ({ company: c }));
        const prv = new MockRequestProvider(data);
        const svc = new LinqService("", prv);
        const query = svc.createQuery<{ company: ICompany }>("Companies");
        const result = await query.select<ICompany>((d) => d.company, Company).toArrayAsync();

        result.forEach((r) => expect(r).to.be.instanceOf(Company));
    });

    it("should pascalize member names", () => {
        const options: QueryOptions = { pascalize: true };
        const query = service.companies()
            .withOptions(options)
            .where((c) => !c.deleted && ((c.id < 3 && c.name === "Netflix") || (c.id >= 3 && c.name !== "Netflix")));

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].key).to.equal("$where");
        expect(provider.options.params[0].value)
            .to.contain(`c => !c.Deleted && ((c.Id < 3 && c.Name == "Netflix") || (c.Id >= 3 && c.Name != "Netflix"))`);
    });

    it("should throw when executed synchronously", () => {
        expect(() => service.companies().toArray()).to.throw();
    });

    it("should throw for unknown expression", () => {
        const invalidPart = new QueryPart("NONE", [{ exp: { type: "NONE" } } as any]);
        expect(() => new LinqQueryProvider(service).handlePart(invalidPart)).to.throw();
    });
});
