/**
 * Application role hierarchy from lowest to highest permission level.
 * 
 * - `user`: Basic user with default permissions
 * - `admin`: Can view user management but cannot modify roles
 * - `director`: Can assign 'user' and 'admin' roles
 * - `webmaster`: Full control, can assign any role
 * 
 * @example
 * ```ts
 * const userRole: AppRole = 'admin';
 * ```
 */
export type AppRole = "user" | "admin" | "director" | "webmaster";
