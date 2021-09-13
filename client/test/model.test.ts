import {getAggregate} from "../src/js/model";

describe("test aggregate function", () => {
    it("should return empty aggregate data", () => {
        expect(getAggregate()).toBe('');
    });
});