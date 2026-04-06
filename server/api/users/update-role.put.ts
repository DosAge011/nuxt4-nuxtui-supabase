import { serverSupabaseClient } from "#supabase/server";

/**
 * API endpoint to update a user's role.
 * 
 * **Method:** PUT
 * **Route:** `/api/users/update-role`
 * 
 * **Authentication Required:** Yes
 * **Role Permissions:**
 * - Admin: Cannot modify roles (read-only)
 * - Director: Can only assign 'user' or 'admin' roles
 * - Webmaster: Can assign any role
 * 
 * @param {Object} body - Request body
 * @param {string} body.userId - UUID of the user to update
 * @param {string} body.role - New role to assign ('user', 'admin', 'director', 'webmaster')
 * 
 * @returns {Object} Response object containing:
 *   - `status`: "success" or "error"
 *   - `message`: Human-readable status message
 *   - `data`: Updated user role record
 * 
 * @example
 * **Request:**
 * ```json
 * {
 *   "userId": "uuid-here",
 *   "role": "admin"
 * }
 * ```
 * 
 * **Success Response:**
 * ```json
 * {
 *   "status": "success",
 *   "message": "User role updated to admin",
 *   "data": [{ "user_id": "uuid", "role": "admin" }]
 * }
 * ```
 * 
 * **Error Responses:**
 * - `400 Bad Request`: Missing userId/role or invalid role value
 * - `401 Unauthorized`: User not authenticated
 * - `403 Forbidden`: Insufficient permissions to assign this role
 * - `405 Method Not Allowed`: Only PUT method is accepted
 * - `500 Internal Server Error`: Database update failed
 */
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
