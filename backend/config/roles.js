const allowedRoles = ["admin", "user"];

/**
 * Returns true when a role string is in the allowed list.
 * @param {string} role
 */
const isRoleAllowed = (role) => allowedRoles.includes(role);

module.exports = { allowedRoles, isRoleAllowed };
