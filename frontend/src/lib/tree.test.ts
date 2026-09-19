import { describe, expect, it } from "vitest";

import {
  chainOfCommand,
  matchesSearch,
  reportsByManager,
  visibleEmployees,
} from "@/lib/tree";
import type { Employee } from "@/types";

function employee(
  id: number,
  managerId: number | null,
  extra: Partial<Employee> = {},
): Employee {
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
    ...extra,
  };
}

const ceo = employee(1, null);
const head = employee(2, 1);
const otherHead = employee(3, 1);
const consultant = employee(4, 2);
const everyone = [ceo, head, otherHead, consultant];

describe("reportsByManager", () => {
  it("groups people under the manager they report to", () => {
    const reports = reportsByManager(everyone);

    expect(reports.get(null)).toEqual([ceo]);
    expect(reports.get(1)).toEqual([head, otherHead]);
    expect(reports.get(2)).toEqual([consultant]);
  });
});

describe("visibleEmployees", () => {
  it("shows everyone when nothing is collapsed", () => {
    expect(visibleEmployees(everyone, new Set())).toHaveLength(4);
  });

  it("hides a collapsed manager's team but keeps the manager", () => {
    const visible = visibleEmployees(everyone, new Set([2]));

    expect(visible.map((person) => person.id)).toEqual([1, 2, 3]);
  });

  it("hides a whole branch when the top of it is collapsed", () => {
    const visible = visibleEmployees(everyone, new Set([1]));

    expect(visible.map((person) => person.id)).toEqual([1]);
  });
});

describe("chainOfCommand", () => {
  it("runs from the top of the company down to the employee", () => {
    const chain = chainOfCommand(everyone, consultant);

    expect(chain.map((person) => person.id)).toEqual([1, 2, 4]);
  });

  it("is just the employee when they have no manager", () => {
    expect(chainOfCommand(everyone, ceo)).toEqual([ceo]);
  });
});

describe("matchesSearch", () => {
  const person = employee(5, null, {
    first_name: "Thandi",
    last_name: "Mokoena",
    role: "SAP Payroll Consultant",
    email: "thandi@example.com",
  });

  it("matches on name, role and email, ignoring case", () => {
    expect(matchesSearch(person, "thandi")).toBe(true);
    expect(matchesSearch(person, "MOKOENA")).toBe(true);
    expect(matchesSearch(person, "payroll")).toBe(true);
    expect(matchesSearch(person, "thandi@example")).toBe(true);
  });

  it("does not match an empty search or something unrelated", () => {
    expect(matchesSearch(person, "")).toBe(false);
    expect(matchesSearch(person, "   ")).toBe(false);
    expect(matchesSearch(person, "finance")).toBe(false);
  });
});
