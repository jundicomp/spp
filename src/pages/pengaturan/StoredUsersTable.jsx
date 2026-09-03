import { useState } from 'react';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import { USER_FIELDS, USER_HEADERS } from '../../db/userFields';
import { fetchUsersFromSheet, updateUserInSheet, deleteUserFromSheet } from '../../services/googleSheets';

export default function StoredUsersTable({ refreshKey }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <GenericStoredTable
      title="Daftar User (Google Sheets)"
      subtitle="Akun ini bisa langsung dipakai login — edit atau hapus lewat kolom Aksi."
      headers={USER_HEADERS}
      fields={USER_FIELDS}
      fetchFn={fetchUsersFromSheet}
      updateFn={updateUserInSheet}
      deleteFn={deleteUserFromSheet}
      moduleLabel="Manajemen User"
      labelKey="Nama"
      searchFn={(r, t) => (r['Nama'] || '').toLowerCase().includes(t) || (r['Username'] || '').toLowerCase().includes(t)}
      onChanged={() => {}}
      refreshSignal={refreshKey}
      columnRenderers={{
        Password: (r) => (showPassword ? r['Password'] : '••••••••'),
      }}
      headExtra={
        <button className="btn btn-sm" onClick={() => setShowPassword(s => !s)}>{showPassword ? '🙈 Sembunyikan' : '👁 Tampilkan'} Password</button>
      }
    />
  );
}
