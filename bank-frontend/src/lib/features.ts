export const FEATURES = {
  // Disabled by default until backend endpoints are available.
  enableAuditModule: import.meta.env.VITE_ENABLE_AUDIT === "true",
  enableSecurityModule: import.meta.env.VITE_ENABLE_SECURITY === "true",
} as const;

export interface DisabledFeatureModule {
  key: "audit" | "security";
  label: string;
  envVar: "VITE_ENABLE_AUDIT" | "VITE_ENABLE_SECURITY";
}

export function isFeatureRouteEnabled(path: string): boolean {
  if (path === "/audit") {
    return FEATURES.enableAuditModule;
  }

  if (path === "/security") {
    return FEATURES.enableSecurityModule;
  }

  return true;
}

export function getDisabledFeatureModules(): DisabledFeatureModule[] {
  const modules: DisabledFeatureModule[] = [];

  if (!FEATURES.enableAuditModule) {
    modules.push({
      key: "audit",
      label: "Audit Logs",
      envVar: "VITE_ENABLE_AUDIT",
    });
  }

  if (!FEATURES.enableSecurityModule) {
    modules.push({
      key: "security",
      label: "Security Center",
      envVar: "VITE_ENABLE_SECURITY",
    });
  }

  return modules;
}