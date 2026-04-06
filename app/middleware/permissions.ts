/**
 * Application role hierarchy from lowest to highest permission level.
 * Used for role-based access control throughout the application.
 */
export type AppRole = "user" | "admin" | "director" | "webmaster";

/**
 * Route middleware for role-based permission checks.
 * 
 * Supports three meta properties for access control:
 * - `role`: Exact role match required
 * - `minRole`: Minimum role level required (inclusive, uses hierarchy)
 * - `aboveRole`: Must have strictly higher role than specified
 * 
 * Redirects to `/error` with 403 status if permission check fails.
 * Redirects to `/auth/login` if user is not authenticated.
 * 
 * @example
 * ```ts
 * // Exact role match - only webmasters can access
 * definePageMeta({
 *   middleware: ['permissions'],
 *   role: 'webmaster'
 * })
 * 
 * // Minimum role - admin, director, or webmaster can access
 * definePageMeta({
 *   middleware: ['permissions'],
 *   minRole: 'admin'
 * })
 * 
 * // Strictly above - only director and webmaster (not admin)
 * definePageMeta({
 *   middleware: ['permissions'],
 *   aboveRole: 'admin'
 * })
 * ```
 */
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
