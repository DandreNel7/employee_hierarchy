import { describe, expect, it } from "vitest";

import { safeCell } from "@/lib/csv";
import { groupDigits, initials } from "@/lib/format";

describe("groupDigits", () => {
  it("puts a space between each group of three", () => {
    expect(groupDigits("300000")).toBe("300 000");
    expect(groupDigits("1250000")).toBe("1 250 000");
  });

  it("keeps short numbers as they are", () => {
    expect(groupDigits("500")).toBe("500");
    expect(groupDigits("")).toBe("");
  });

  it("drops anything that is not a digit", () => {
    expect(groupDigits("R650 000.50")).toBe("65 000 050");
  });
});

describe("initials", () => {
  it("takes the first letter of each name", () => {
    expect(initials("Thandi", "Mokoena")).toBe("TM");
  });

  it("copes with a missing name", () => {
    expect(initials("", "")).toBe("");
  });
});

describe("safeCell", () => {
  it("quotes values Excel would treat as a formula", () => {
    expect(safeCell("=1+1")).toBe("'=1+1");
    expect(safeCell("+27821234567")).toBe("'+27821234567");
    expect(safeCell("-5")).toBe("'-5");
    expect(safeCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("leaves ordinary values alone", () => {
    expect(safeCell("Thandi")).toBe("Thandi");
    expect(safeCell("SAP Consultant")).toBe("SAP Consultant");
  });
});
