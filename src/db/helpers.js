export const BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
export const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export function formatRupiah(n){
  const v = Math.round(n || 0);
  return 'Rp ' + v.toLocaleString('id-ID');
}
export function formatTanggal(d){
  if(!d) return '-';
  const dt = (d instanceof Date) ? d : new Date(d);
  return dt.getDate() + ' ' + BULAN_ID[dt.getMonth()] + ' ' + dt.getFullYear();
}
export function isoDate(d){
  const dt = (d instanceof Date) ? d : new Date(d);
  return dt.toISOString().slice(0,10);
}
export function pad(n, len){ return String(n).padStart(len, '0'); }

export function initials(name){
  if(!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
const AVATAR_COLORS = ['#1C7A3C','#1E4FA0','#B23B2E','#5B3E8E','#B9790E','#2B5138'];
export function avatarColor(seed){
  let hash = 0;
  const s = String(seed || '');
  for(let i=0;i<s.length;i++) hash = (hash*31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function tagihanStatus(nominal, terbayar){
  if(terbayar <= 0) return 'Belum Lunas';
  if(terbayar >= nominal) return 'Lunas';
  return 'Sebagian';
}

// Parse tanggal dari berbagai format yang mungkin masuk dari Excel/Sheets:
// "10/05/2017" (dd/mm/yyyy, format Indonesia -- dari toLocaleDateString('id-ID')),
// "2017-05-10" (ISO), atau objek Date asli. Return null kalau tidak bisa diparse.
export function parseTanggalFleksibel(input){
  if(!input) return null;
  if(input instanceof Date && !isNaN(input)) return input;
  const s = String(input).trim();
  if(!s) return null;
  // dd/mm/yyyy atau dd-mm-yyyy
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if(m){
    const d = new Date(parseInt(m[3]), parseInt(m[2])-1, parseInt(m[1]));
    return isNaN(d) ? null : d;
  }
  // yyyy-mm-dd (ISO)
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m){
    const d = new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]));
    return isNaN(d) ? null : d;
  }
  const fallback = new Date(s);
  return isNaN(fallback) ? null : fallback;
}

export function hitungUsia(tanggalLahirInput){
  const lahir = parseTanggalFleksibel(tanggalLahirInput);
  if(!lahir) return null;
  const now = new Date();
  let usia = now.getFullYear() - lahir.getFullYear();
  const belumUlangTahun = (now.getMonth() < lahir.getMonth()) ||
    (now.getMonth() === lahir.getMonth() && now.getDate() < lahir.getDate());
  if(belumUlangTahun) usia--;
  return usia >= 0 ? usia : null;
}
