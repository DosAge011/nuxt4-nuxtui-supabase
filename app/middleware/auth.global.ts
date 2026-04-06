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
