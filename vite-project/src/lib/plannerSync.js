// Sinkronisasi data planner ke Supabase (tabel `planner_data`).
//
// PRINSIP UTAMA:
// - localStorage TETAP menjadi sumber data utama untuk UI. Tidak ada alur
//   baca/tulis di App.jsx yang diubah — komponen tetap membaca dari state
//   React seperti sebelumnya, dan state itu tetap di-load/disimpan ke
//   localStorage seperti sebelumnya (lihat loadFromStorage/saveToStorage
//   di App.jsx, tidak disentuh oleh modul ini).
// - Modul ini hanya menambah lapisan SINKRONISASI DI ATAS localStorage:
//     1. Saat aplikasi pertama kali dibuka, coba tarik data dari Supabase.
//        Jika ada, dipakai untuk menggantikan state awal (yang tadinya
//        dimuat dari localStorage) supaya data yang sama muncul di semua
//        perangkat yang memakai user_id yang sama.
//     2. Setiap kali data berubah, selain disimpan ke localStorage
//        (seperti biasa), juga dikirim ke Supabase secara asinkron.
// - Jika Supabase belum dikonfigurasi (env var kosong) atau request gagal
//   (offline, RLS belum diset, dsb), semua fungsi di sini diam-diam gagal
//   tanpa melempar error — aplikasi tetap 100% berfungsi dengan
//   localStorage saja, sesuai perilaku sebelumnya.
//
// Struktur tabel yang diharapkan (dibuat manual di Supabase SQL editor):
//
//   create table planner_data (
//     user_id uuid not null,
//     key text not null,
//     value jsonb not null,
//     updated_at timestamptz not null default now(),
//     primary key (user_id, key)
//   );
//
// Satu baris per (user_id, key) — key adalah salah satu dari:
// "schedule", "courses", "tasks", "exams", "attendance", "notes".

import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getDeviceUserId } from "./deviceId";

const TABLE_NAME = "planner_data";

// Debounce per key supaya perubahan beruntun (mis. mengetik di form) tidak
// memicu satu request per keystroke — hanya request terakhir dalam jendela
// waktu ini yang benar-benar dikirim.
const DEBOUNCE_MS = 800;
const pendingTimers = {};

/**
 * Ambil satu baris planner_data untuk key tertentu milik user perangkat
 * ini. Mengembalikan `null` jika Supabase belum dikonfigurasi, request
 * gagal, atau baris belum ada — caller wajib punya fallback (biasanya
 * nilai dari localStorage) untuk semua kasus tersebut.
 */
export async function fetchPlannerData(key) {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const userId = getDeviceUserId();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("value, updated_at")
      .eq("user_id", userId)
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.warn(`[Supabase] Gagal mengambil data untuk "${key}":`, error.message);
      return null;
    }
    return data ?? null;
  } catch (e) {
    console.warn(`[Supabase] Request gagal untuk "${key}":`, e.message);
    return null;
  }
}

/**
 * Simpan (upsert) satu baris planner_data untuk key tertentu. Dipanggil
 * dengan debounce lewat scheduleSyncToSupabase — tidak dipakai langsung
 * oleh App.jsx.
 */
async function upsertPlannerData(key, value) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const userId = getDeviceUserId();
    const { error } = await supabase.from(TABLE_NAME).upsert(
      {
        user_id: userId,
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,key" }
    );

    if (error) {
      console.warn(`[Supabase] Gagal menyimpan data untuk "${key}":`, error.message);
    }
  } catch (e) {
    console.warn(`[Supabase] Request gagal untuk "${key}":`, e.message);
  }
}

/**
 * Jadwalkan sinkronisasi ke Supabase untuk satu key, dengan debounce.
 * Aman dipanggil berkali-kali secara berurutan (mis. dari useEffect yang
 * bereaksi tiap kali state berubah) — hanya panggilan terakhir dalam
 * jendela DEBOUNCE_MS yang benar-benar mengirim request.
 *
 * Tidak pernah melempar error dan tidak mengembalikan Promise yang perlu
 * ditunggu — dipanggil "fire-and-forget" dari useEffect.
 */
export function scheduleSyncToSupabase(key, value) {
  if (!isSupabaseConfigured) return;

  if (pendingTimers[key]) {
    clearTimeout(pendingTimers[key]);
  }
  pendingTimers[key] = setTimeout(() => {
    delete pendingTimers[key];
    upsertPlannerData(key, value);
  }, DEBOUNCE_MS);
}

/**
 * Tarik data awal dari Supabase untuk satu key (dipanggil sekali per key
 * saat App pertama kali mount, lewat useEffect terpisah — lihat App.jsx).
 *
 * Alur:
 *   1. Jika Supabase belum dikonfigurasi -> tidak melakukan apa-apa,
 *      caller tetap pakai nilai localStorage yang sudah dimuat duluan.
 *   2. Jika Supabase dikonfigurasi dan punya data untuk key ini -> data
 *      itu dipakai untuk MENGGANTI state React (lewat setter yang
 *      diberikan) sekaligus localStorage-nya, supaya kedua sumber selalu
 *      konsisten setelah sinkronisasi awal.
 *   3. Jika Supabase dikonfigurasi tapi belum punya data (user baru) ->
 *      tidak ada perubahan; data localStorage yang ada saat ini (dummy
 *      default atau hasil pemakaian sebelumnya) akan otomatis terkirim ke
 *      Supabase lewat useEffect sinkronisasi biasa.
 */
export async function pullPlannerDataOnce(key, setter, saveLocalFn) {
  if (!isSupabaseConfigured) return;

  const remote = await fetchPlannerData(key);
  if (remote && remote.value !== undefined && remote.value !== null) {
    setter(remote.value);
    saveLocalFn(key, remote.value);
  }
}
