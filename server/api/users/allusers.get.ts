import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  // Query the user's role directly from the database
  // This is more reliable than relying on JWT custom claims on the server
  const { data: currentUserRole, error: roleError } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError) {
    console.error("Error fetching user role:", roleError);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to verify user permissions",
    });
  }

  const userRole = currentUserRole?.role;

  // Only allow elevated roles to list users
  if (!userRole || !["admin", "director", "webmaster"].includes(userRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden - Insufficient permissions",
    });
  }

  // Query user_profiles
  const { data: profiles, error: profilesError } = await client
    .from("user_profiles")
    .select("user_id, email, first_name, last_name, phone_number, avatar_url");

  if (profilesError) {
    console.error("Error fetching user profiles:", profilesError);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch user profiles: ${profilesError.message}`,
    });
  }

  // Query user_roles
  const { data: roles, error: rolesError } = await client
    .from("user_roles")
    .select("user_id, role");

  if (rolesError) {
    console.error("Error fetching user roles:", rolesError);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch user roles: ${rolesError.message}`,
    });
  }

  // Create a map of user_id to role for quick lookup
  const roleMap = new Map<string, string>(
    roles
      ?.filter((r): r is { user_id: string; role: string } => !!r.user_id)
      .map((r) => [r.user_id, r.role]) ?? [],
  );

  // Combine profiles with roles
  const enrichedUsers =
    profiles
      ?.filter((p): p is typeof p & { user_id: string } => !!p.user_id)
      .map((profile) => ({
        id: profile.user_id,
        email: profile.email ?? "N/A",
        user_role: roleMap.get(profile.user_id) ?? "user",
        first_name: profile.first_name ?? null,
        last_name: profile.last_name ?? null,
        phone_number: profile.phone_number ?? null,
        avatar_url: profile.avatar_url ?? null,
      })) ?? [];

  return {
    status: "success",
    message: "Fetched users successfully",
    count: enrichedUsers.length,
    data: enrichedUsers,
  };
});
