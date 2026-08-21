// export const hasPermission = (permissions, key) => {
//   return permissions.includes(key);
// };

export const hasPermission = (permissions = [], key) => {
  if (!Array.isArray(permissions)) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(key);
};

// export const hasPermission = (permissions = [], key) => {
//   if (!Array.isArray(permissions)) return false;

//   // super admin wildcard support
//   if (permissions.includes("*")) return true;

//   return permissions.includes(key);
// };