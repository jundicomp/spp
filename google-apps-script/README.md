# Menyambungkan Data Siswa ke Google Sheets

Arsitekturnya: **React (di GitHub Pages) → Google Apps Script (Web App) → Google Sheets**.

React tidak bisa langsung baca/tulis ke Google Sheets tanpa perantara (butuh kredensial Google
yang tidak aman kalau ditaruh di kode frontend). Apps Script berperan sebagai "jembatan" —
kode-nya jalan di server Google, bukan di browser, jadi aman.

## Langkah Setup (sekali saja)

1. **Buat / buka Google Sheet** yang mau dipakai sebagai database siswa.
2. Menu **Extensions → Apps Script**.
3. Hapus isi `Code.gs` bawaan, **tempel seluruh isi file `Code.gs`** yang ada di folder ini.
4. Cari baris ini di kode:
   ```js
   const SECRET = 'GANTI_DENGAN_KATA_SANDI_RAHASIA_ANDA';
   ```
   Ganti dengan kata sandi bebas pilihan Anda (jangan dibagikan ke siapa pun, ini kunci
   supaya orang lain tidak bisa menulis ke sheet Anda meski tahu URL-nya).
5. Klik **Deploy → New deployment**.
6. Pilih tipe **Web app**. Isi:
   - **Execute as**: Me (akun Anda)
   - **Who has access**: Anyone
7. Klik **Deploy**, lalu **izinkan akses** saat diminta (klik "Advanced" → "Go to project (unsafe)"
   kalau muncul peringatan — ini normal untuk script buatan sendiri).
8. **Salin URL Web App** yang muncul (diakhiri `/exec`).
9. Buka aplikasi React → menu **Data Siswa → Pengaturan Koneksi** → tempel URL itu + kata sandi
   yang sama seperti langkah 4 → **Simpan & Tes Koneksi**.

Selesai. Sheet akan otomatis dibuatkan tab bernama **"Data Siswa"** dengan header yang sesuai,
begitu ada data pertama yang dikirim dari aplikasi.

## Catatan

- **Setiap kali mengubah kode `Code.gs`**, Anda harus **Deploy → Manage deployments → Edit (ikon
  pensil) → Version: New version → Deploy** lagi supaya perubahan aktif. Sekadar menyimpan file
  saja tidak cukup.
- Kata sandi (`SECRET`) dikirim di setiap permintaan tulis (tambah data) — ini proteksi ringan,
  cocok untuk skala sekolah, bukan enkripsi tingkat bank.
- Kalau URL Web App diganti (redeploy baru), ingat update lagi di halaman Pengaturan Koneksi
  React-nya.
