import type { Database } from "~/types/database.types";
import type { AppRole } from "~/types";

/**
 * Composable for authentication and role-based access control.
 * Provides reactive auth state, user profile data, and role hierarchy checks.
 * 
 * @example
 * ```ts
 * const { isAuthenticated, signIn, signOut, hasRole } = useAuth();
 * 
 * // Check if user has specific role
 * if (isRole('admin')) { ... }
 * 
 * // Check if user meets minimum role level
 * if (hasRole('director')) { ... }
 * ```
 */
export function useAuth() {
  const _supabase = useSupabaseClient<Database>();
  const _user = useSupabaseUser();

  /** Computed boolean indicating if a user is currently authenticated */
  const isAuthenticated = computed(() => !!_user.value);

  /**
   * Authenticate a user with email and password.
   * @param email - User's email address
   * @param password - User's password
   * @throws Will throw an error if authentication fails
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await _supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  /**
   * Sign out the current user.
   * @throws Will throw an error if sign out fails
   */
  const signOut = async () => {
    const { error } = await _supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  /**
   * Register a new user account.
   * @param email - New user's email address
   * @param password - New user's password
   * @throws Will throw an error if registration fails
   */
  const register = async (email: string, password: string) => {
    const { error } = await _supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  /**
   * Computed display name for the current user.
   * Returns full name if available, otherwise falls back to email.
   * @returns {string | null} Display name or null if not authenticated
   */
  const userDisplayName = computed(() => {
    if (!_user.value) return null;
    if (
      !_user.value.user_metadata ||
      !_user.value.user_metadata.first_name ||
      !_user.value.user_metadata.last_name
    )
      return _user.value.email;
    return (
      _user.value.user_metadata.first_name +
      " " +
      _user.value.user_metadata.last_name
    );
  });

  /**
   * Computed avatar URL for the current user.
   * Returns user's avatar or a default avatar if none is set.
   * @returns {string} Avatar URL
   */
  const userAvatarUrl = computed(() => {
    if (!_user.value)
      return "https://ylzupstxfobqrotcbpfu.supabase.co/storage/v1/object/public/avatars/avatar-default.svg";
    if (!_user.value.user_metadata || !_user.value.user_metadata.avatar_url)
      return "https://ylzupstxfobqrotcbpfu.supabase.co/storage/v1/object/public/avatars/avatar-default.svg";
    return _user.value.user_metadata.avatar_url;
  });

  /** Role hierarchy from lowest to highest permission level */
  const roleHierarchy: AppRole[] = ["user", "admin", "director", "webmaster"];

  /**
   * Check if the current user has an exact role match.
   * @param role - The role to check against
   * @returns {boolean} True if user's role matches exactly
   */
  const isRole = (role: AppRole) => {
    // user_role is a top-level claim from custom_access_token_hook
    const userRole = (_user.value as any)?.user_role;
    if (!userRole) return false;
    return userRole === role;
  };

  /**
   * Check if the current user has at least the specified role level.
   * Uses role hierarchy: user < admin < director < webmaster
   * @param minRole - Minimum required role
   * @returns {boolean} True if user's role is >= minRole in hierarchy
   */
  const hasRole = (minRole: AppRole) => {
    // user_role is a top-level claim from custom_access_token_hook
    const userRole = (_user.value as any)?.user_role;
    if (!userRole) return false;
    const userRoleIndex = roleHierarchy.indexOf(userRole as AppRole);
    const minRoleIndex = roleHierarchy.indexOf(minRole);
    return userRoleIndex >= minRoleIndex;
  };

  /**
   * Check if the current user's role is strictly above the specified role.
   * @param aboveRole - Role to compare against
   * @returns {boolean} True if user's role is higher than aboveRole
   */
  const isAbove = (aboveRole: AppRole) => {
    // user_role is a top-level claim from custom_access_token_hook
    const userRole = (_user.value as any)?.user_role;
    if (!userRole) return false;
    const userRoleIndex = roleHierarchy.indexOf(userRole as AppRole);
    const aboveRoleIndex = roleHierarchy.indexOf(aboveRole);
    return userRoleIndex > aboveRoleIndex;
  };

  return {
    isAuthenticated,
    signIn,
    signOut,
    register,
    userDisplayName,
    userAvatarUrl,
    isRole,
    hasRole,
    isAbove,
  };
}
