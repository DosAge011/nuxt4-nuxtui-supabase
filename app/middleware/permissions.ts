export type AppRole = "user" | "admin" | "director" | "webmaster";

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth();

  // Check authentication first
  if (!auth.isAuthenticated.value) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  const meta = to.meta;

  // Check exact role
  if (meta.role) {
    if (!auth.isRole(meta.role as AppRole)) {
      return navigateTo({
        path: "/error",
        query: { 
          status: "403", 
          message: `Forbidden - Invalid role. Required: ${meta.role}` 
        },
      });
    }
    return;
  }

  // Check minimum role (hasRole includes hierarchy)
  if (meta.minRole) {
    if (!auth.hasRole(meta.minRole as AppRole)) {
      return navigateTo({
        path: "/error",
        query: { 
          status: "403", 
          message: `Forbidden - Role level too low. Minimum required: ${meta.minRole}` 
        },
      });
    }
    return;
  }

  // Check strictly above role (isAbove excludes the specified role)
  if (meta.aboveRole) {
    if (!auth.isAbove(meta.aboveRole as AppRole)) {
      return navigateTo({
        path: "/error",
        query: { 
          status: "403", 
          message: `Forbidden - Insufficient role level. Must be above: ${meta.aboveRole}` 
        },
      });
    }
    return;
  }

  // No restriction specified - warn in dev
  if (process.dev) {
    console.warn(
      `[Permission Middleware] Route "${to.path}" uses permission middleware without specifying role, minRole, or aboveRole.`,
    );
  }
});
