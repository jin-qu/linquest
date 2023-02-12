import { CompanyService, MockRequestProvider } from "./fixture";

describe("Inline function tests", () => {

    const provider = new MockRequestProvider();
    const service = new CompanyService(provider);

    it("should be able to call Math", () => {
        const query = service.companies().where(c => Math.floor(c.id) === 1);

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].value).to.equal(`c => Math.Floor(c.id) == 1`);
    });

    it("should be able to call Substring", () => {
        const query = service.companies().where(c => c.name.substr(1, 3) === "etf");

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].value).to.equal(`c => c.name.Substring(1, 3) == "etf"`);
    });

    it("should be able to call Includes", () => {
        const query = service.companies().where(c => c.name.includes("flix"));

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].value).to.equal(`c => c.name.Contains("flix")`);
    });

    it("should be able to call ToString", () => {
        const query = service.companies().where("c => c.toString()");

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(1);
        expect(provider.options.params[0].value).to.equal(`c => c.ToString()`);
    });

    it("should be able to call from VariableExpression", () => {
        const query = service.companies().select(c => c.name).select("toLowerCase()");

        expect(query.toArrayAsync()).to.be.fulfilled.and.eventually.be.null;
        expect(provider.options.params).to.have.length(2);
        expect(provider.options.params[0].value).to.equal(`c => c.name`);
        expect(provider.options.params[1].value).to.equal(`ToLower()`);
    });

    it("should throw for invalid arguments", () => {
        const query = service.companies().select(c => c.id.toString(42));

        expect(() => query.toArrayAsync()).to.throw();
    });

    it("should throw for invalid callee", () => {
        const query = service.companies().select("c => c.id.toString()()");

        expect(() => query.toArrayAsync()).to.throw();
    });
});
