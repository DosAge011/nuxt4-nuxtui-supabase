import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  // Only allow PUT requests
  if (event.method !== "PUT") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  const client = await serverSupabaseClient(event);

  // Get current user
  const { data: { user } } = await client.auth.getUser();

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  // Query the user's role directly from the database
  const { data: currentUserRoleData } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const currentUserRole = currentUserRoleData?.role;

  const body = await readBody(event);
  const { userId, role } = body;

  // Validate required fields
  if (!userId || !role) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required fields: userId and role",
    });
  }

  // Validate role is one of allowed values
  const allowedRoles = ["user", "admin", "director", "webmaster"];
  if (!allowedRoles.includes(role)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid role. Must be one of: ${allowedRoles.join(", ")}`,
    });
  }

  // Authorization checks based on role hierarchy
  // Admin: read-only, cannot modify roles
  if (currentUserRole === "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Admins cannot modify user roles",
    });
  }

  // Director: can only assign/update 'admin' or 'user' roles
  if (currentUserRole === "director") {
    if (!["admin", "user"].includes(role)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Directors can only assign 'admin' or 'user' roles",
      });
    }
  }

  // User: cannot modify any roles
  if (currentUserRole === "user" || !currentUserRole) {
    throw createError({
      statusCode: 403,
      statusMessage: "Insufficient permissions to modify roles",
    });
  }

  // Webmaster: can assign any role (no additional checks needed)

  console.log(`Updating user ${userId} role to ${role}...`);

  // Update the user's role using regular client
  // RLS policies will enforce permissions at database level too
  const { data, error } = await client
    .from("user_roles")
    .upsert(
      { user_id: userId, role: role },
      { onConflict: "user_id" }
    )
    .select();

  if (error) {
    console.error("Error updating role:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update role: ${error.message}`,
    });
  }

  return {
    status: "success",
    message: `User role updated to ${role}`,
    data,
  };
});
