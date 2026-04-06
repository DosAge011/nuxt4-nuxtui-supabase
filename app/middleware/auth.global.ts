/**
 * Global authentication middleware that runs on all routes.
 * 
 * Automatically redirects authenticated users away from auth pages
 * (login, register, forgot-password) to the home page.
 * 
 * This middleware runs globally due to the `.global.ts` suffix.
 * 
 * @example
 * When a logged-in user tries to access `/auth/login`, they are redirected to `/`
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();
  const authPages = ["/auth/login", "/auth/register", "/auth/forgot-password"];

  // Wait a moment for user to be loaded
  await new Promise((resolve) => setTimeout(resolve, 100));

  // If user is logged in and trying to access auth pages, redirect to home
  if (user.value && authPages.includes(to.path)) {
    return navigateTo("/");
  }
});
