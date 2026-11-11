import { describe, expect, it } from "vitest";
import { getDashboardRoute, ROLES } from "./rbac";

describe("role dashboard routes", () => {
  it.each([
    [ROLES.ADMIN, "/admin"],
    [ROLES.MANAGER, "/manager"],
    [ROLES.CUSTOMER_MANAGER, "/customer-manager"],
    [ROLES.AUDITOR, "/auditor"],
    [ROLES.USER, "/user"],
  ])("routes %s to its dashboard", (role, expectedPath) => {
    expect(getDashboardRoute([role])).toBe(expectedPath);
  });
});
