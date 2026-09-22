// Anonymous device/user ID — dipakai sebagai user_id di Supabase SELAMA
// belum ada fitur login. Ini BUKAN sistem autentikasi: hanya sebuah UUID
// acak yang dibuat sekali per browser/perangkat dan disimpan di
// localStorage, supaya data planner yang disinkronkan ke Supabase tetap
// bisa dipisahkan per-perangkat (kolom user_id di tabel planner_data).
//
// Saat fitur login sungguhan dibangun nanti, ID anonim ini bisa dipetakan
// /dimigrasikan ke auth.uid() milik user yang sebenarnya. Untuk sekarang,
// ini murni identitas lokal — tidak melibatkan server autentikasi apa pun.

const DEVICE_ID_KEY = "studia:device_id";

function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback sederhana untuk lingkungan tanpa crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceUserId() {
  try {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateUUID();
      window.localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch (e) {
    // localStorage tidak tersedia — kembalikan ID sementara khusus sesi ini
    // saja (tidak persisten). Sinkronisasi Supabase tetap tidak akan
    // menggagalkan aplikasi karena caller selalu menangani kegagalan.
    return generateUUID();
  }
}
