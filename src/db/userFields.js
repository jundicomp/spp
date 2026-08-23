export const USER_HEADERS = ['No', 'Nama', 'Role', 'Username', 'Password', 'Email'];

export const USER_ROLE_OPTIONS = ['Kepala Sekolah', 'Bendahara / TU', 'Staf TU', 'Admin'];

export const USER_FIELDS = [
  { key: 'Nama', label: 'Nama Lengkap', type: 'text', required: true },
  { key: 'Role', label: 'Role', type: 'select', options: USER_ROLE_OPTIONS, required: true },
  { key: 'Username', label: 'Username', type: 'text', required: true },
  { key: 'Password', label: 'Password', type: 'text', required: true },
  { key: 'Email', label: 'Email', type: 'email' },
];

export function emptyUserRow() {
  const row = {};
  USER_FIELDS.forEach(f => { row[f.key] = ''; });
  return row;
}
