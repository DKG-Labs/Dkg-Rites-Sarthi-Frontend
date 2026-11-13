// Display names for roles whose DB name differs from what users should see.
// DB value stays unchanged; only the label shown in the UI changes.
export const ROLE_DISPLAY_NAMES = {
  'R Process IE': 'Rail Process IE', // SMS process IE (DB: 'R Process IE', formerly 'Rail SMS')
  'Rail SMS': 'Rail Process IE',
};

export const getRoleDisplayName = (role) => {
  if (role == null) return role;
  const key = String(role).trim();
  return ROLE_DISPLAY_NAMES[key] || key;
};

// For comma-separated role strings
export const formatRoleList = (roles) =>
  roles ? String(roles).split(',').map(r => getRoleDisplayName(r)).join(', ') : roles;
