import { describe, expect, it } from "vitest";
import { REQUIRED_FIELDS, explain, hasPlainTerm } from "./plain-terms";

describe("plain-terms glossary", () => {
  it("covers every field the app renders", () => {
    const missing = REQUIRED_FIELDS.filter((field) => !hasPlainTerm(field));
    expect(missing).toEqual([]);
  });

  it("returns a layman label and a sentence with the value substituted", () => {
    const result = explain("spot_vs_period_gap", 14.2);
    expect(result.label).toBe("Short-term vs daily market");
    expect(result.sentence).toContain("14.2%");
    expect(result.sentence).toContain("cheaper");
  });

  it("always carries a unit when the field is a measurement", () => {
    expect(explain("loa", 289).unit).toBe("m");
    expect(explain("dwt", 75000).unit).toBe("tons");
    expect(explain("baf", 1.1).unit).toBe("$/ton");
  });

  it("falls back to a readable version of the raw field when unknown", () => {
    const result = explain("some_new_metric", 5);
    expect(result.label).toBe("Some new metric");
    expect(result.sentence).toBe("Some new metric: 5");
  });
});
