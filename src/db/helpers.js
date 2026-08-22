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
