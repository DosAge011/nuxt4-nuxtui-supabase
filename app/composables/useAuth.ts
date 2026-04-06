import type { Database } from "~/types/database.types";
import type { AppRole } from "~/types";
export function useAuth() {
  const _supabase = useSupabaseClient<Database>();
  const _user = useSupabaseUser();

  const isAuthenticated = computed(() => !!_user.value);

  const signIn = async (email: string, password: string) => {
    const { error } = await _supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await _supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    const { error } = await _supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

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

  const userAvatarUrl = computed(() => {
    if (!_user.value)
      return "https://ylzupstxfobqrotcbpfu.supabase.co/storage/v1/object/public/avatars/avatar-default.svg";
    if (!_user.value.user_metadata || !_user.value.user_metadata.avatar_url)
      return "https://ylzupstxfobqrotcbpfu.supabase.co/storage/v1/object/public/avatars/avatar-default.svg";
    return _user.value.user_metadata.avatar_url;
  });

  const roleHierarchy: AppRole[] = ["user", "admin", "director", "webmaster"];

  const isRole = (role: AppRole) => {
    // user_role is a top-level claim from custom_access_token_hook
    const userRole = (_user.value as any)?.user_role;
    if (!userRole) return false;
    return userRole === role;
  };

  const hasRole = (minRole: AppRole) => {
    // user_role is a top-level claim from custom_access_token_hook
    const userRole = (_user.value as any)?.user_role;
    if (!userRole) return false;
    const userRoleIndex = roleHierarchy.indexOf(userRole as AppRole);
    const minRoleIndex = roleHierarchy.indexOf(minRole);
    return userRoleIndex >= minRoleIndex;
  };

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
