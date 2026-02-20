/**
 * Role configuration.
 *
 * Same in most projects (boilerplate): central list of allowed roles + a helper to validate roles.
 * Project-specific: the role names used by this app (admin/user).
 *
 * This is intentionally tiny: we keep the list of valid roles in one place so
 * schema validation and controller checks stay consistent.
 */

const allowedRoles = ["admin", "user"];

/**
 * Returns true when a role string is in the allowed list.
 * @param {string} role
 */
const isRoleAllowed = (role) => allowedRoles.includes(role);

module.exports = { allowedRoles, isRoleAllowed };
