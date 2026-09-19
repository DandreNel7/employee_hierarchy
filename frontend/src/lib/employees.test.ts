import { describe, expect, it } from "vitest";

import { descendantIds } from "@/lib/employees";
import type { Employee } from "@/types";

function employee(id: number, managerId: number | null): Employee {
  return {
    id,
    employee_number: `EMP-000${id}`,
    first_name: `First${id}`,
    last_name: `Last${id}`,
    email: `person${id}@example.com`,
    birth_date: "1990-01-01",
    salary: "500000",
    role: "SAP Consultant",
    manager_id: managerId,
    department: null,
    avatar_key: null,
    avatar_url: "",
  };
}

describe("descendantIds", () => {
  const everyone = [
    employee(1, null),
    employee(2, 1),
    employee(3, 2),
    employee(4, 1),
    employee(5, null),
  ];

  it("finds everyone below a manager, however deep", () => {
    expect(descendantIds(everyone, 1)).toEqual(new Set([2, 3, 4]));
  });

  it("follows the chain down from the middle", () => {
    expect(descendantIds(everyone, 2)).toEqual(new Set([3]));
  });

  it("is empty for someone with no reports", () => {
    expect(descendantIds(everyone, 3)).toEqual(new Set());
  });

  it("does not include the person themselves", () => {
    expect(descendantIds(everyone, 1).has(1)).toBe(false);
  });
});
