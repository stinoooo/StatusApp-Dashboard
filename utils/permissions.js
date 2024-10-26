// utils/permissions.js

// Define all permission flags as BigInt constants
const PERMISSIONS = {
    CREATE_INSTANT_INVITE: 1n << 0n,
    KICK_MEMBERS: 1n << 1n,
    BAN_MEMBERS: 1n << 2n,
    ADMINISTRATOR: 1n << 3n,
    MANAGE_CHANNELS: 1n << 4n,
    MANAGE_GUILD: 1n << 5n,
    ADD_REACTIONS: 1n << 6n,
    VIEW_AUDIT_LOG: 1n << 7n,
    MANAGE_ROLES: 1n << 28n,
    MODERATE_MEMBERS: 1n << 40n,
};

// Utility function to check if a user has a specific permission
function hasPermission(userPermissions, permission) {
    return (userPermissions & permission) !== 0n;
}

// Utility function to check if a user has multiple permissions
function hasPermissions(userPermissions, ...permissions) {
    return permissions.every(permission => (userPermissions & permission) !== 0n);
}

// Export permissions and utility functions
module.exports = {
    PERMISSIONS,
    hasPermission,
    hasPermissions
};
