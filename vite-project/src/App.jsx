import React, { useState, useMemo, useEffect } from "react";
import {
  Home,
  CalendarDays,
  CheckSquare,
  BookOpen,
  StickyNote,
  ChevronRight,
  ChevronLeft,
  Circle,
  CheckCircle2,
  Clock,
  Flame,
  Sparkles,
  Plus,
  X,
  MapPin,
  User,
  Pencil,
  Trash2,
  CalendarClock,
  GraduationCap,
  ClipboardList,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  MoreHorizontal,
  ChevronDown,
  Check,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Dummy data — nanti akan digantikan oleh data dari localStorage / backend
// ---------------------------------------------------------------------------

const DUMMY_USER = { name: "Gilang" };

// ---------------------------------------------------------------------------
// localStorage persistence helpers — hanya untuk fitur baru (Mata Kuliah,
// Tugas, Ujian, Presensi, Catatan). Jadwal (Schedule) TIDAK diubah mekanisme
// statenya agar fitur yang sudah stabil tidak berisiko rusak.
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "studia:";

function loadFromStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // localStorage tidak tersedia (mis. private browsing penuh) — abaikan,
    // aplikasi tetap berjalan dengan state in-memory saja.
  }
}

// ---------------------------------------------------------------------------
// Mata Kuliah — sumber data utama nama mata kuliah untuk Jadwal, Tugas,
// Ujian, Presensi, dan Catatan
// ---------------------------------------------------------------------------

let courseIdCounter = 100;
function nextCourseId() {
  courseIdCounter += 1;
  return courseIdCounter;
}

const DUMMY_COURSES = [
  {
    id: 1,
    name: "Pendidikan Kewarganegaraan",
    code: "",
    lecturer: "Dr. Indriyana Dwi M., S.H., M.H.",
    sks: "",
    room: "E.404",
    notes: "",
  },
  {
    id: 2,
    name: "Menggambar Teknik",
    code: "",
    lecturer: "Ir. Yudha Adi K., S.T., M.T.",
    sks: "",
    room: "E.201",
    notes: "",
  },
  {
    id: 3,
    name: "Praktikum Menggambar Teknik",
    code: "",
    lecturer: "Ir. Yudha Adi K., S.T., M.T.",
    sks: "",
    room: "E.201",
    notes: "",
  },
  {
    id: 4,
    name: "Kalkulus I",
    code: "",
    lecturer: "Doni Susanto, S.Pd., M.Pd.",
    sks: "",
    room: "E.201",
    notes: "",
  },
  {
    id: 5,
    name: "Bahasa Indonesia",
    code: "",
    lecturer: "Yunita Furinawati, S.Hum., M.A.",
    sks: "",
    room: "E.401",
    notes: "Kelas digabung dengan Sistem Informasi",
  },
  {
    id: 6,
    name: "Pengantar Teknik Industri",
    code: "",
    lecturer: "Aloysius Tommy H., S.T., M.T.",
    sks: "",
    room: "E.404",
    notes: "",
  },
  {
    id: 7,
    name: "Fisika I",
    code: "",
    lecturer: "Doni Susanto, S.Pd., M.Pd.",
    sks: "",
    room: "E.404",
    notes: "",
  },
  {
    id: 8,
    name: "Bahasa Inggris",
    code: "",
    lecturer: "Rizqi Husaini, S.Pd., M.Pd.",
    sks: "",
    room: "E.404",
    notes: "",
  },
  {
    id: 9,
    name: "Material Teknik",
    code: "",
    lecturer: "Aan Zainal M., S.T., M.T., IPP.",
    sks: "",
    room: "E.404",
    notes: "",
  },
];

// ---------------------------------------------------------------------------
// Tugas — mencakup Tugas Umum dan Tugas Kuliah dalam satu sistem
// ---------------------------------------------------------------------------

let taskIdCounter = 100;
function nextTaskId() {
  taskIdCounter += 1;
  return taskIdCounter;
}

const TASK_PRIORITIES = ["Rendah", "Sedang", "Tinggi"];
const TASK_CATEGORIES = ["Tugas Umum", "Tugas Kuliah"];
const TASK_STATUSES = ["Belum selesai", "Dikumpulkan", "Selesai"];

function todayISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DUMMY_TASKS = [
  {
    id: 1,
    title: "Laporan Praktikum Menggambar Teknik",
    course: "Praktikum Menggambar Teknik",
    dueDate: addDaysISO(2),
    dueTime: "23:59",
    priority: "Tinggi",
    category: "Tugas Kuliah",
    notes: "Kumpulkan lewat Google Classroom",
    status: "Belum selesai",
  },
  {
    id: 2,
    title: "Latihan soal Kalkulus I bab limit",
    course: "Kalkulus I",
    dueDate: addDaysISO(4),
    dueTime: "",
    priority: "Sedang",
    category: "Tugas Kuliah",
    notes: "",
    status: "Belum selesai",
  },
  {
    id: 3,
    title: "Beli alat gambar teknik",
    course: "",
    dueDate: addDaysISO(1),
    dueTime: "",
    priority: "Rendah",
    category: "Tugas Umum",
    notes: "",
    status: "Belum selesai",
  },
  {
    id: 4,
    title: "Essay Bahasa Inggris — self introduction",
    course: "Bahasa Inggris",
    dueDate: addDaysISO(-1),
    dueTime: "10:00",
    priority: "Tinggi",
    category: "Tugas Kuliah",
    notes: "Terlambat — segera kumpulkan susulan",
    status: "Belum selesai",
  },
  {
    id: 5,
    title: "Rangkuman bab 1 Fisika I",
    course: "Fisika I",
    dueDate: addDaysISO(-3),
    dueTime: "",
    priority: "Sedang",
    category: "Tugas Kuliah",
    notes: "",
    status: "Selesai",
  },
];

// ---------------------------------------------------------------------------
// Ujian
// ---------------------------------------------------------------------------

let examIdCounter = 100;
function nextExamId() {
  examIdCounter += 1;
  return examIdCounter;
}

const EXAM_TYPES = ["Kuis", "UTS", "UAS", "Lainnya"];

const DUMMY_EXAMS = [
  {
    id: 1,
    name: "Kuis Kalkulus I — Limit & Turunan",
    course: "Kalkulus I",
    type: "Kuis",
    date: addDaysISO(3),
    time: "10:00",
    room: "R.201",
    notes: "",
  },
  {
    id: 2,
    name: "UTS Fisika I",
    course: "Fisika I",
    type: "UTS",
    date: addDaysISO(9),
    time: "08:00",
    room: "Aula 1",
    notes: "Bawa kalkulator scientific",
  },
  {
    id: 3,
    name: "UTS Pengantar Teknik Industri",
    course: "Pengantar Teknik Industri",
    type: "UTS",
    date: addDaysISO(11),
    time: "13:00",
    room: "R.305",
    notes: "",
  },
];

// ---------------------------------------------------------------------------
// Presensi
// ---------------------------------------------------------------------------

let attendanceIdCounter = 100;
function nextAttendanceId() {
  attendanceIdCounter += 1;
  return attendanceIdCounter;
}

const ATTENDANCE_STATUSES = ["Hadir", "Terlambat", "Izin", "Alpa"];

const DUMMY_ATTENDANCE = [
  { id: 1, course: "Kalkulus I", date: addDaysISO(-21), status: "Hadir" },
  { id: 2, course: "Kalkulus I", date: addDaysISO(-14), status: "Hadir" },
  { id: 3, course: "Kalkulus I", date: addDaysISO(-7), status: "Terlambat" },
  { id: 4, course: "Fisika I", date: addDaysISO(-20), status: "Hadir" },
  { id: 5, course: "Fisika I", date: addDaysISO(-13), status: "Izin" },
  { id: 6, course: "Fisika I", date: addDaysISO(-6), status: "Hadir" },
];

// ---------------------------------------------------------------------------
// Catatan
// ---------------------------------------------------------------------------

let noteIdCounter = 100;
function nextNoteId() {
  noteIdCounter += 1;
  return noteIdCounter;
}

const DUMMY_NOTES = [
  {
    id: 1,
    title: "Rumus turunan dasar",
    body: "d/dx(x^n) = n·x^(n-1)\nd/dx(sin x) = cos x\nd/dx(cos x) = -sin x",
    course: "Kalkulus I",
    updatedAt: addDaysISO(-2),
  },
  {
    id: 2,
    title: "Istilah proyeksi gambar teknik",
    body: "Proyeksi Eropa (First Angle) vs Proyeksi Amerika (Third Angle) — beda posisi bidang proyeksi terhadap objek.",
    course: "Menggambar Teknik",
    updatedAt: addDaysISO(-5),
  },
];

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
// getDay(): 0=Minggu..6=Sabtu → index ke DAYS (0=Senin..6=Minggu)
const JS_DAY_TO_DAYS_INDEX = [6, 0, 1, 2, 3, 4, 5];

const CLASS_TYPES = ["Kuliah", "Praktikum", "Tutorial", "Ujian"];

const CLASS_COLORS = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];

let scheduleIdCounter = 100;
function nextScheduleId() {
  scheduleIdCounter += 1;
  return scheduleIdCounter;
}

const DUMMY_SCHEDULE = [
  {
    id: 1,
    course: "Pendidikan Kewarganegaraan",
    day: "Senin",
    start: "09:10",
    end: "10:50",
    lecturer: "Dr. Indriyana Dwi M., S.H., M.H.",
    room: "E.404",
    type: "Kuliah",
    notes: "",
    color: "#4F46E5",
  },
  {
    id: 2,
    course: "Menggambar Teknik",
    day: "Senin",
    start: "10:50",
    end: "12:30",
    lecturer: "Ir. Yudha Adi K., S.T., M.T.",
    room: "E.201",
    type: "Kuliah",
    notes: "",
    color: "#0EA5E9",
  },
  {
    id: 3,
    course: "Praktikum Menggambar Teknik",
    day: "Senin",
    start: "13:00",
    end: "15:30",
    lecturer: "Ir. Yudha Adi K., S.T., M.T.",
    room: "E.201",
    type: "Praktikum",
    notes: "",
    color: "#10B981",
  },
  {
    id: 4,
    course: "Kalkulus I",
    day: "Selasa",
    start: "07:30",
    end: "09:10",
    lecturer: "Doni Susanto, S.Pd., M.Pd.",
    room: "E.201",
    type: "Kuliah",
    notes: "",
    color: "#F59E0B",
  },
  {
    id: 5,
    course: "Bahasa Indonesia",
    day: "Selasa",
    start: "10:50",
    end: "12:30",
    lecturer: "Yunita Furinawati, S.Hum., M.A.",
    room: "E.401",
    type: "Kuliah",
    notes: "Kelas digabung dengan Sistem Informasi",
    color: "#8B5CF6",
  },
  {
    id: 6,
    course: "Pengantar Teknik Industri",
    day: "Rabu",
    start: "10:50",
    end: "12:30",
    lecturer: "Aloysius Tommy H., S.T., M.T.",
    room: "E.404",
    type: "Kuliah",
    notes: "",
    color: "#EC4899",
  },
  {
    id: 7,
    course: "Fisika I",
    day: "Kamis",
    start: "07:30",
    end: "09:10",
    lecturer: "Doni Susanto, S.Pd., M.Pd.",
    room: "E.404",
    type: "Kuliah",
    notes: "",
    color: "#4F46E5",
  },
  {
    id: 8,
    course: "Bahasa Inggris",
    day: "Kamis",
    start: "09:10",
    end: "10:50",
    lecturer: "Rizqi Husaini, S.Pd., M.Pd.",
    room: "E.404",
    type: "Kuliah",
    notes: "",
    color: "#0EA5E9",
  },
  {
    id: 9,
    course: "Material Teknik",
    day: "Jumat",
    start: "07:30",
    end: "09:10",
    lecturer: "Aan Zainal M., S.T., M.T., IPP.",
    room: "E.404",
    type: "Kuliah",
    notes: "",
    color: "#10B981",
  },
];

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { key: "dashboard", label: "Beranda", icon: Home },
  { key: "schedule", label: "Jadwal", icon: CalendarDays },
  { key: "tasks", label: "Tugas", icon: CheckSquare },
  { key: "courses", label: "Mata Kuliah", icon: BookOpen },
  { key: "exams", label: "Ujian", icon: GraduationCap },
  { key: "attendance", label: "Presensi", icon: ClipboardList },
  { key: "notes", label: "Catatan", icon: StickyNote },
];

// Bottom nav mobile hanya menampilkan 4 item utama + "Lainnya" agar tetap
// nyaman disentuh; sisanya diakses lewat sheet "Lainnya". Sidebar desktop
// tetap menampilkan semua item seperti sebelumnya.
const PRIMARY_MOBILE_KEYS = ["dashboard", "schedule", "tasks", "courses"];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

function formatTodayID() {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function deadlineTone(daysLeft) {
  if (daysLeft <= 2) return { text: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-100" };
  if (daysLeft <= 4) return { text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100" };
  return { text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" };
}

function todayDayName() {
  return DAYS[JS_DAY_TO_DAYS_INDEX[new Date().getDay()]];
}

function sortByStart(list) {
  return [...list].sort((a, b) => a.start.localeCompare(b.start));
}

function typeTone(type) {
  switch (type) {
    case "Praktikum":
      return { text: "text-amber-700", bg: "bg-amber-50" };
    case "Tutorial":
      return { text: "text-sky-700", bg: "bg-sky-50" };
    case "Ujian":
      return { text: "text-rose-700", bg: "bg-rose-50" };
    default:
      return { text: "text-indigo-700", bg: "bg-indigo-50" };
  }
}

function priorityTone(priority) {
  switch (priority) {
    case "Tinggi":
      return { text: "text-rose-600", bg: "bg-rose-50" };
    case "Sedang":
      return { text: "text-amber-600", bg: "bg-amber-50" };
    default:
      return { text: "text-zinc-500", bg: "bg-zinc-100" };
  }
}

// Parse "YYYY-MM-DD" jadi Date lokal (hindari pergeseran timezone dari new Date(string))
function parseISODate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Rentang minggu berjalan: Senin s/d Minggu, dalam format YYYY-MM-DD,
// dipakai khusus untuk kalkulasi Progress Mingguan di Dashboard.
function getCurrentWeekRange() {
  const today = startOfToday();
  const jsDay = today.getDay(); // 0=Minggu..6=Sabtu
  const offsetToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + offsetToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return { startISO: toISO(monday), endISO: toISO(sunday) };
}

function daysBetween(dateA, dateB) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((dateA.getTime() - dateB.getTime()) / msPerDay);
}

function isTaskOverdue(task) {
  if (task.status === "Selesai" || task.status === "Dikumpulkan") return false;
  const due = parseISODate(task.dueDate);
  if (!due) return false;
  return daysBetween(due, startOfToday()) < 0;
}

function formatDateID(iso) {
  if (!iso) return "";
  const d = parseISODate(iso);
  if (!d) return "";
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

// Label relatif Indonesia: "Hari ini", "Besok", "3 hari lagi", "1 minggu lagi", dst
function relativeDayLabel(iso) {
  const d = parseISODate(iso);
  if (!d) return "";
  const diff = daysBetween(d, startOfToday());
  if (diff < 0) return `Terlambat ${Math.abs(diff)} hari`;
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Besok";
  if (diff < 7) return `${diff} hari lagi`;
  if (diff === 7) return "1 minggu lagi";
  if (diff < 14) return `${diff} hari lagi`;
  const weeks = Math.round(diff / 7);
  return `${weeks} minggu lagi`;
}

function attendancePercentage(records) {
  if (records.length === 0) return 0;
  const hadirCount = records.filter((r) => r.status === "Hadir" || r.status === "Terlambat").length;
  return Math.round((hadirCount / records.length) * 100);
}

// ---------------------------------------------------------------------------
// Layout shell
// ---------------------------------------------------------------------------

export default function App() {
  const [active, setActive] = useState("dashboard");

  // Jadwal — TIDAK diubah mekanisme statenya, tetap sama persis seperti sebelumnya
  const [schedule, setSchedule] = useState(DUMMY_SCHEDULE);
  const [scheduleView, setScheduleView] = useState("today");
  const [scheduleSelectedDay, setScheduleSelectedDay] = useState(todayDayName());

  // Fitur baru — state dinaikkan ke App, sumber tunggal untuk semua halaman,
  // dimuat dari localStorage sekali saat pertama render
  const [courses, setCourses] = useState(() => loadFromStorage("courses", DUMMY_COURSES));
  const [tasks, setTasks] = useState(() => loadFromStorage("tasks", DUMMY_TASKS));
  const [exams, setExams] = useState(() => loadFromStorage("exams", DUMMY_EXAMS));
  const [attendance, setAttendance] = useState(() => loadFromStorage("attendance", DUMMY_ATTENDANCE));
  const [notes, setNotes] = useState(() => loadFromStorage("notes", DUMMY_NOTES));

  const [moreOpen, setMoreOpen] = useState(false);

  // Simpan ke localStorage setiap kali data berubah — hanya fitur baru
  useEffect(() => saveToStorage("courses", courses), [courses]);
  useEffect(() => saveToStorage("tasks", tasks), [tasks]);
  useEffect(() => saveToStorage("exams", exams), [exams]);
  useEffect(() => saveToStorage("attendance", attendance), [attendance]);
  useEffect(() => saveToStorage("notes", notes), [notes]);

  const courseNames = useMemo(() => courses.map((c) => c.name), [courses]);

  const goTo = (key) => {
    setActive(key);
    setMoreOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans antialiased">
      <div className="flex">
        <Sidebar active={active} setActive={goTo} />

        <div className="flex-1 min-w-0">
          <TopBar />
          <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 md:px-8 md:pb-10 lg:max-w-5xl">
            {active === "dashboard" && (
              <Dashboard setActive={goTo} tasks={tasks} setTasks={setTasks} exams={exams} schedule={schedule} />
            )}
            {active === "schedule" && (
              <Schedule
                schedule={schedule}
                setSchedule={setSchedule}
                view={scheduleView}
                setView={setScheduleView}
                selectedDay={scheduleSelectedDay}
                setSelectedDay={setScheduleSelectedDay}
              />
            )}
            {active === "tasks" && (
              <TasksPage tasks={tasks} setTasks={setTasks} courseNames={courseNames} />
            )}
            {active === "courses" && (
              <CoursesPage courses={courses} setCourses={setCourses} />
            )}
            {active === "exams" && (
              <ExamsPage exams={exams} setExams={setExams} courseNames={courseNames} />
            )}
            {active === "attendance" && (
              <AttendancePage
                attendance={attendance}
                setAttendance={setAttendance}
                courseNames={courseNames}
              />
            )}
            {active === "notes" && (
              <NotesPage notes={notes} setNotes={setNotes} courseNames={courseNames} />
            )}
          </main>
        </div>
      </div>

      <BottomNav active={active} setActive={goTo} onMore={() => setMoreOpen(true)} />

      {moreOpen && <MoreSheet active={active} setActive={goTo} onClose={() => setMoreOpen(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top bar (mobile only — shows brand; desktop uses sidebar instead)
// ---------------------------------------------------------------------------

function TopBar() {
  return (
    <header className="flex items-center justify-between px-4 pt-5 pb-1 md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
          <Sparkles className="h-4 w-4 text-white" strokeWidth={2.25} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Studia</span>
      </div>
      <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-medium text-zinc-600">
        {DUMMY_USER.name.charAt(0)}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Sidebar (desktop/tablet only)
// ---------------------------------------------------------------------------

function Sidebar({ active, setActive }) {
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-zinc-200 min-h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-6 pt-7 pb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
          <Sparkles className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
        </div>
        <span className="text-[17px] font-semibold tracking-tight">Studia</span>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14.5px] font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-6 rounded-xl bg-zinc-100 px-3.5 py-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white">
          {DUMMY_USER.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium text-zinc-800">{DUMMY_USER.name}</p>
          <p className="truncate text-[12px] text-zinc-500">Mahasiswa</p>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Bottom nav (mobile/tablet only)
// ---------------------------------------------------------------------------

function BottomNav({ active, setActive, onMore }) {
  const primaryItems = NAV_ITEMS.filter((item) => PRIMARY_MOBILE_KEYS.includes(item.key));
  const overflowKeys = NAV_ITEMS.filter((item) => !PRIMARY_MOBILE_KEYS.includes(item.key)).map((i) => i.key);
  const isOverflowActive = overflowKeys.includes(active);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-3xl items-stretch justify-between px-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-w-0"
            >
              <Icon
                className={`h-[22px] w-[22px] transition-colors ${isActive ? "text-indigo-600" : "text-zinc-400"}`}
                strokeWidth={isActive ? 2.3 : 2}
              />
              <span
                className={`text-[10.5px] leading-none font-medium transition-colors ${
                  isActive ? "text-indigo-600" : "text-zinc-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={onMore}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-w-0"
        >
          <MoreHorizontal
            className={`h-[22px] w-[22px] transition-colors ${isOverflowActive ? "text-indigo-600" : "text-zinc-400"}`}
            strokeWidth={isOverflowActive ? 2.3 : 2}
          />
          <span
            className={`text-[10.5px] leading-none font-medium transition-colors ${
              isOverflowActive ? "text-indigo-600" : "text-zinc-400"
            }`}
          >
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// "Lainnya" sheet — menu overflow mobile untuk item nav yang tidak muat di
// bottom nav (Ujian, Presensi, Catatan)
// ---------------------------------------------------------------------------

function MoreSheet({ active, setActive, onClose }) {
  const overflowItems = NAV_ITEMS.filter((item) => !PRIMARY_MOBILE_KEYS.includes(item.key));

  return (
    <div className="md:hidden fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-zinc-900">Menu lainnya</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 active:bg-zinc-100">
            <X className="h-5 w-5 text-zinc-400" strokeWidth={2} />
          </button>
        </div>
        <div className="space-y-1">
          {overflowItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[14.5px] font-medium transition-colors ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-zinc-600 active:bg-zinc-50"
                }`}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function Dashboard({ setActive, tasks, setTasks, exams, schedule }) {
  const today = todayDayName();

  const todayClasses = useMemo(
    () => sortByStart(schedule.filter((c) => c.day === today)),
    [schedule, today]
  );

  const todayISO = todayISODate();
  const tasksToday = useMemo(
    () => tasks.filter((t) => t.dueDate === todayISO),
    [tasks, todayISO]
  );
  const doneCount = tasksToday.filter((t) => t.status === "Selesai" || t.status === "Dikumpulkan").length;

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "Selesai" ? "Belum selesai" : "Selesai" } : t
      )
    );
  };

  // Deadline mendatang: gabungan tugas yang belum selesai + ujian, diurutkan berdasarkan tanggal terdekat
  const upcomingDeadlines = useMemo(() => {
    const fromTasks = tasks
      .filter((t) => t.status !== "Selesai" && t.status !== "Dikumpulkan" && t.dueDate)
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title,
        course: t.course || "Umum",
        date: t.dueDate,
      }));
    const fromExams = exams
      .filter((e) => e.date)
      .map((e) => ({
        id: `exam-${e.id}`,
        title: e.name,
        course: e.course || "",
        date: e.date,
      }));
    const combined = [...fromTasks, ...fromExams]
      .map((item) => {
        const due = parseISODate(item.date);
        const diff = due ? daysBetween(due, startOfToday()) : 999;
        return { ...item, daysLeft: diff };
      })
      .filter((item) => item.daysLeft >= -3) // masih tampilkan yang baru sedikit terlambat
      .sort((a, b) => a.daysLeft - b.daysLeft);
    return combined.slice(0, 4);
  }, [tasks, exams]);

  const nextClass = todayClasses[0];

  // Progress Mingguan — dihitung dari tugas nyata yang jatuh tempo Senin-Minggu
  // minggu berjalan. Selesai = status "Selesai" atau "Dikumpulkan" (sama dengan
  // definisi selesai yang dipakai di tempat lain pada Dashboard/Tugas).
  const weeklyProgress = useMemo(() => {
    const { startISO, endISO } = getCurrentWeekRange();
    const tasksThisWeek = tasks.filter(
      (t) => t.dueDate && t.dueDate >= startISO && t.dueDate <= endISO
    );
    if (tasksThisWeek.length === 0) return 0;
    const completedCount = tasksThisWeek.filter(
      (t) => t.status === "Selesai" || t.status === "Dikumpulkan"
    ).length;
    return Math.round((completedCount / tasksThisWeek.length) * 100);
  }, [tasks]);

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Greeting */}
      <section>
        <p className="text-[13px] font-medium text-zinc-400">{formatTodayID()}</p>
        <h1 className="mt-0.5 text-[23px] md:text-[26px] font-semibold tracking-tight text-zinc-900">
          {getGreeting()}, {DUMMY_USER.name}
        </h1>
        <p className="mt-1 text-[14px] text-zinc-500">
          {nextClass
            ? `Kelas pertama hari ini: ${nextClass.course} pukul ${nextClass.start}.`
            : "Tidak ada kelas hari ini."}
        </p>
      </section>

      {/* Top stat row */}
      <section className="grid grid-cols-2 gap-3 md:gap-4">
        <StatCard
          label="Tugas hari ini"
          value={`${doneCount}/${tasksToday.length}`}
          sub="selesai"
          icon={CheckSquare}
          tone="indigo"
        />
        <StatCard
          label="Progress minggu ini"
          value={`${weeklyProgress}%`}
          sub="target tercapai"
          icon={Flame}
          tone="emerald"
        />
      </section>

      {/* Two-column area on desktop */}
      <div className="md:grid md:grid-cols-5 md:gap-6 space-y-6 md:space-y-0">
        <div className="md:col-span-3 space-y-6">
          {/* Today's Classes */}
          <Card>
            <CardHeader
              title="Kelas hari ini"
              action="Lihat jadwal"
              onAction={() => setActive("schedule")}
            />
            {todayClasses.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-zinc-400">Tidak ada kelas hari ini</p>
            ) : (
              <div className="space-y-2.5">
                {todayClasses.map((c) => (
                  <ClassRow key={c.id} item={c} />
                ))}
              </div>
            )}
          </Card>

          {/* Today's Tasks */}
          <Card>
            <CardHeader
              title="Tugas hari ini"
              action="Lihat semua"
              onAction={() => setActive("tasks")}
            />
            {tasksToday.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-zinc-400">Tidak ada tugas untuk hari ini</p>
            ) : (
              <div className="space-y-1">
                {tasksToday.map((t) => (
                  <TaskRow
                    key={t.id}
                    item={{ id: t.id, title: t.title, done: t.status === "Selesai" || t.status === "Dikumpulkan" }}
                    onToggle={() => toggleTask(t.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader title="Deadline mendatang" />
            {upcomingDeadlines.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-zinc-400">Tidak ada deadline mendatang</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.map((d) => (
                  <DeadlineRow key={d.id} item={d} />
                ))}
              </div>
            )}
          </Card>

          {/* Weekly Progress */}
          <Card>
            <CardHeader title="Progress mingguan" />
            <div className="flex items-center gap-4">
              <ProgressRing value={weeklyProgress} />
              <div className="min-w-0">
                <p className="text-[13.5px] text-zinc-600 leading-snug">
                  Kamu sudah menyelesaikan <span className="font-semibold text-zinc-900">{weeklyProgress}%</span> dari
                  target tugas minggu ini.
                </p>
                <p className="mt-1.5 text-[12.5px] text-zinc-400">Terus pertahankan!</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable UI pieces
// ---------------------------------------------------------------------------

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {children}
    </div>
  );
}

function CardHeader({ title, action, onAction }) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <h2 className="text-[15px] font-semibold text-zinc-900">{title}</h2>
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-0.5 text-[12.5px] font-medium text-indigo-600 active:text-indigo-800"
        >
          {action}
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, tone }) {
  const tones = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  };
  const t = tones[tone];
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${t.bg}`}>
        <Icon className={`h-4 w-4 ${t.text}`} strokeWidth={2.25} />
      </div>
      <p className="mt-2.5 text-[20px] font-semibold tracking-tight text-zinc-900">{value}</p>
      <p className="text-[12.5px] text-zinc-400">
        {label} <span className="text-zinc-400">· {sub}</span>
      </p>
    </div>
  );
}

function ClassRow({ item }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 -mx-2.5 active:bg-zinc-50">
      <div className="flex w-14 shrink-0 flex-col items-start">
        <span className="text-[13px] font-semibold text-zinc-800 tabular-nums">{item.start}</span>
        <span className="text-[11px] text-zinc-400 tabular-nums">{item.end}</span>
      </div>
      <div className="h-8 w-[3px] rounded-full shrink-0" style={{ backgroundColor: item.color }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-zinc-800">{item.course}</p>
        <p className="truncate text-[12px] text-zinc-400">{item.room}</p>
      </div>
    </div>
  );
}

function TaskRow({ item, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 -mx-2.5 text-left active:bg-zinc-50"
    >
      {item.done ? (
        <CheckCircle2 className="h-[19px] w-[19px] shrink-0 text-indigo-600" strokeWidth={2} />
      ) : (
        <Circle className="h-[19px] w-[19px] shrink-0 text-zinc-300" strokeWidth={2} />
      )}
      <span
        className={`text-[14px] leading-snug ${
          item.done ? "text-zinc-400 line-through" : "text-zinc-800"
        }`}
      >
        {item.title}
      </span>
    </button>
  );
}

function DeadlineRow({ item }) {
  const tone = deadlineTone(item.daysLeft);
  const label =
    item.daysLeft < 0
      ? `Terlambat ${Math.abs(item.daysLeft)} hari`
      : item.daysLeft === 0
      ? "Hari ini"
      : `${item.daysLeft} hari lagi`;
  return (
    <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 -mx-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-zinc-800">{item.title}</p>
        <p className="truncate text-[12px] text-zinc-400">{item.course}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${tone.bg} ${tone.text} ${tone.ring}`}
      >
        {label}
      </span>
    </div>
  );
}

function ProgressRing({ value }) {
  const size = 64;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#EEEEF0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4F46E5"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[14px] font-semibold text-zinc-900">{value}%</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

const EMPTY_FORM = {
  course: "",
  day: "Senin",
  start: "",
  end: "",
  lecturer: "",
  room: "",
  type: "Kuliah",
  notes: "",
};

function Schedule({ schedule, setSchedule, view, setView, selectedDay, setSelectedDay }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [justSaved, setJustSaved] = useState(null); // { course, day } — untuk toast konfirmasi singkat

  const today = todayDayName();

  const openAddForm = (presetDay) => {
    setEditingId(null);
    setFormValues({ ...EMPTY_FORM, day: presetDay || selectedDay || today });
    setFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setFormValues({
      course: item.course,
      day: item.day,
      start: item.start,
      end: item.end,
      lecturer: item.lecturer,
      room: item.room,
      type: item.type,
      notes: item.notes || "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const saveForm = () => {
    const trimmedCourse = formValues.course.trim();
    if (!trimmedCourse || !formValues.start || !formValues.end) return;

    const cleanValues = { ...formValues, course: trimmedCourse };

    if (editingId) {
      setSchedule((prev) =>
        prev.map((item) => (item.id === editingId ? { ...item, ...cleanValues } : item))
      );
    } else {
      setSchedule((prev) => {
        const color = CLASS_COLORS[prev.length % CLASS_COLORS.length];
        return [...prev, { id: nextScheduleId(), ...cleanValues, color }];
      });
    }

    // Bawa user ke tampilan tempat jadwal ini berada, supaya selalu langsung terlihat
    // — sebelumnya jadwal tersimpan tapi tersembunyi jika ditambahkan untuk hari selain hari ini.
    setSelectedDay(cleanValues.day);
    setView(cleanValues.day === today ? "today" : "week");
    setJustSaved({ course: cleanValues.course, day: cleanValues.day });

    closeForm();
  };

  const deleteItem = (id) => {
    setSchedule((prev) => prev.filter((item) => item.id !== id));
    setConfirmDeleteId(null);
  };

  const todayClasses = useMemo(
    () => sortByStart(schedule.filter((c) => c.day === today)),
    [schedule, today]
  );

  const selectedDayClasses = useMemo(
    () => sortByStart(schedule.filter((c) => c.day === selectedDay)),
    [schedule, selectedDay]
  );

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(null), 2500);
    return () => clearTimeout(t);
  }, [justSaved]);

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <section className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-zinc-400">{formatTodayID()}</p>
          <h1 className="mt-0.5 text-[23px] md:text-[26px] font-semibold tracking-tight text-zinc-900">
            Jadwal Kuliah
          </h1>
        </div>
        <button
          onClick={() => openAddForm(view === "today" ? today : selectedDay)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[13px] font-semibold text-white active:bg-indigo-700 md:px-4"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Tambah Kelas</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </section>

      {/* View toggle */}
      <section className="inline-flex rounded-xl bg-zinc-100 p-1">
        <button
          onClick={() => setView("today")}
          className={`rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors ${
            view === "today" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setView("week")}
          className={`rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors ${
            view === "week" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
          }`}
        >
          Minggu
        </button>
      </section>

      {view === "today" ? (
        <TodayView
          classes={todayClasses}
          dayLabel={today}
          onEdit={openEditForm}
          onDelete={(id) => setConfirmDeleteId(id)}
          onAdd={() => openAddForm(today)}
        />
      ) : (
        <WeekView
          schedule={schedule}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          today={today}
          dayClasses={selectedDayClasses}
          onEdit={openEditForm}
          onDelete={(id) => setConfirmDeleteId(id)}
          onAdd={() => openAddForm(selectedDay)}
        />
      )}

      {formOpen && (
        <ClassFormSheet
          values={formValues}
          setValues={setFormValues}
          isEditing={!!editingId}
          onCancel={closeForm}
          onSave={saveForm}
        />
      )}

      {confirmDeleteId !== null && (
        <ConfirmDeleteSheet
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteItem(confirmDeleteId)}
        />
      )}

      {justSaved && (
        <div className="fixed inset-x-4 top-4 z-40 mx-auto max-w-sm md:left-1/2 md:right-auto md:-translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-xl bg-zinc-900 px-4 py-3 shadow-lg">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2.25} />
            <p className="text-[13px] font-medium text-white">
              {justSaved.course} tersimpan di hari {justSaved.day}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TodayView({ classes, dayLabel, onEdit, onDelete, onAdd }) {
  return (
    <Card>
      <CardHeader title={`Kelas — ${dayLabel}`} />
      {classes.length === 0 ? (
        <EmptyDayState onAdd={onAdd} />
      ) : (
        <div className="space-y-2.5">
          {classes.map((item) => (
            <ScheduleRow key={item.id} item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
          ))}
        </div>
      )}
    </Card>
  );
}

function WeekView({ schedule, selectedDay, setSelectedDay, today, dayClasses, onEdit, onDelete, onAdd }) {
  const countByDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => (map[d] = 0));
    schedule.forEach((c) => {
      if (map[c.day] !== undefined) map[c.day] += 1;
    });
    return map;
  }, [schedule]);

  return (
    <div className="space-y-4">
      {/* Day selector — horizontally scrollable, never overflows page */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DAYS.map((d) => {
            const isSelected = d === selectedDay;
            const isToday = d === today;
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`flex shrink-0 flex-col items-center gap-1 rounded-xl px-3.5 py-2.5 min-w-[58px] transition-colors ${
                  isSelected ? "bg-indigo-600" : "bg-white border border-zinc-200"
                }`}
              >
                <span
                  className={`text-[12px] font-semibold ${isSelected ? "text-white" : "text-zinc-700"}`}
                >
                  {d.slice(0, 3)}
                </span>
                <span
                  className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : isToday
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {countByDay[d]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader title={selectedDay === today ? `${selectedDay} · Hari ini` : selectedDay} />
        {dayClasses.length === 0 ? (
          <EmptyDayState onAdd={onAdd} />
        ) : (
          <div className="space-y-2.5">
            {dayClasses.map((item) => (
              <ScheduleRow key={item.id} item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmptyDayState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100">
        <CalendarClock className="h-5 w-5 text-zinc-400" strokeWidth={2} />
      </div>
      <p className="mt-3 text-[13.5px] font-medium text-zinc-600">Belum ada kelas</p>
      <button
        onClick={onAdd}
        className="mt-3 flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-[12.5px] font-medium text-zinc-600 active:bg-zinc-200"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        Tambah kelas
      </button>
    </div>
  );
}

function ScheduleRow({ item, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const tone = typeTone(item.type);

  return (
    <div className="rounded-xl -mx-2.5 px-2.5 py-2 active:bg-zinc-50">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-center gap-3 text-left">
        <div className="flex w-14 shrink-0 flex-col items-start">
          <span className="text-[13px] font-semibold text-zinc-800 tabular-nums">{item.start}</span>
          <span className="text-[11px] text-zinc-400 tabular-nums">{item.end}</span>
        </div>
        <div className="h-9 w-[3px] rounded-full shrink-0" style={{ backgroundColor: item.color }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-zinc-800">{item.course}</p>
          <p className="truncate text-[12px] text-zinc-400">{item.room}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${tone.bg} ${tone.text}`}
        >
          {item.type}
        </span>
      </button>

      {expanded && (
        <div className="mt-2.5 ml-[68px] space-y-2 border-t border-zinc-100 pt-2.5">
          <div className="flex items-center gap-2 text-[12.5px] text-zinc-500">
            <User className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} />
            <span className="truncate">{item.lecturer || "Dosen belum diisi"}</span>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-zinc-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} />
            <span className="truncate">{item.room || "Ruangan belum diisi"}</span>
          </div>
          {item.notes && (
            <p className="rounded-lg bg-zinc-50 px-2.5 py-2 text-[12.5px] leading-snug text-zinc-600">
              {item.notes}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 active:bg-zinc-200"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-[12.5px] font-medium text-rose-600 active:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Class — bottom sheet on mobile, centered modal on desktop
// ---------------------------------------------------------------------------

function ClassFormSheet({ values, setValues, isEditing, onCancel, onSave }) {
  const [attempted, setAttempted] = useState(false);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const isValid = values.course.trim() && values.start && values.end;

  const handleSaveClick = () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 md:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:rounded-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-zinc-900">
            {isEditing ? "Edit Kelas" : "Tambah Kelas"}
          </h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 active:bg-zinc-100">
            <X className="h-5 w-5 text-zinc-400" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-3.5">
          <Field label="Nama mata kuliah" required error={attempted && !values.course.trim()}>
            <input
              type="text"
              value={values.course}
              onChange={set("course")}
              placeholder="mis. Pemrograman Web"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:ring-2 ${
                attempted && !values.course.trim()
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-zinc-200 focus:border-indigo-400 focus:ring-indigo-100"
              }`}
            />
          </Field>

          <Field label="Hari">
            <select
              value={values.day}
              onChange={set("day")}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam mulai" required error={attempted && !values.start}>
              <input
                type="time"
                value={values.start}
                onChange={set("start")}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:ring-2 ${
                  attempted && !values.start
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                    : "border-zinc-200 focus:border-indigo-400 focus:ring-indigo-100"
                }`}
              />
            </Field>
            <Field label="Jam selesai" required error={attempted && !values.end}>
              <input
                type="time"
                value={values.end}
                onChange={set("end")}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:ring-2 ${
                  attempted && !values.end
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                    : "border-zinc-200 focus:border-indigo-400 focus:ring-indigo-100"
                }`}
              />
            </Field>
          </div>

          <Field label="Jenis kelas">
            <select
              value={values.type}
              onChange={set("type")}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {CLASS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Dosen">
            <input
              type="text"
              value={values.lecturer}
              onChange={set("lecturer")}
              placeholder="mis. Dr. Andri Wijaya"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>

          <Field label="Ruangan">
            <input
              type="text"
              value={values.room}
              onChange={set("room")}
              placeholder="mis. Lab 2"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>

          <Field label="Catatan (opsional)">
            <textarea
              value={values.notes}
              onChange={set("notes")}
              placeholder="mis. Bawa laptop"
              rows={2}
              className="w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>
        </div>

        {attempted && !isValid && (
          <p className="mt-3 text-[12.5px] font-medium text-rose-600">
            Lengkapi nama mata kuliah, jam mulai, dan jam selesai terlebih dahulu.
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[14px] font-medium text-zinc-600 active:bg-zinc-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-[14px] font-semibold text-white active:bg-indigo-700"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required, error }) {
  return (
    <label className="block">
      <span
        className={`mb-1.5 block text-[12.5px] font-medium ${
          error ? "text-rose-600" : "text-zinc-500"
        }`}
      >
        {label}
        {required && <span className={error ? "text-rose-500" : "text-zinc-400"}> *</span>}
      </span>
      {children}
    </label>
  );
}

function ConfirmDeleteSheet({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 md:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:rounded-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
          <Trash2 className="h-5 w-5 text-rose-600" strokeWidth={2} />
        </div>
        <h2 className="mt-3.5 text-[16px] font-semibold text-zinc-900">Hapus kelas ini?</h2>
        <p className="mt-1 text-[13.5px] text-zinc-500">
          Jadwal yang dihapus tidak dapat dikembalikan.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[14px] font-medium text-zinc-600 active:bg-zinc-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-[14px] font-semibold text-white active:bg-rose-700"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tugas — mendukung Tugas Umum dan Tugas Kuliah dalam satu sistem terpadu
// ---------------------------------------------------------------------------

const EMPTY_TASK_FORM = {
  title: "",
  course: "",
  dueDate: "",
  dueTime: "",
  priority: "Sedang",
  category: "Tugas Umum",
  notes: "",
  status: "Belum selesai",
};

const TASK_FILTERS = ["Semua", "Belum selesai", "Selesai", "Terlambat"];

function TasksPage({ tasks, setTasks, courseNames }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_TASK_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [justSaved, setJustSaved] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(null), 2200);
    return () => clearTimeout(t);
  }, [justSaved]);

  const openAddForm = () => {
    setEditingId(null);
    setFormValues(EMPTY_TASK_FORM);
    setFormOpen(true);
  };

  const openEditForm = (task) => {
    setEditingId(task.id);
    setFormValues({
      title: task.title,
      course: task.course || "",
      dueDate: task.dueDate || "",
      dueTime: task.dueTime || "",
      priority: task.priority,
      category: task.category,
      notes: task.notes || "",
      status: task.status,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const saveForm = () => {
    const trimmedTitle = formValues.title.trim();
    if (!trimmedTitle || !formValues.dueDate) return;
    const cleanValues = { ...formValues, title: trimmedTitle };

    if (editingId) {
      setTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...cleanValues } : t)));
    } else {
      setTasks((prev) => [...prev, { id: nextTaskId(), ...cleanValues }]);
    }
    setJustSaved({ title: cleanValues.title });
    closeForm();
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setConfirmDeleteId(null);
  };

  const toggleStatus = (task) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: t.status === "Selesai" ? "Belum selesai" : "Selesai" } : t
      )
    );
  };

  // Statistik — dihitung ulang otomatis tiap kali tasks berubah
  const stats = useMemo(() => {
    const total = tasks.length;
    const selesai = tasks.filter((t) => t.status === "Selesai" || t.status === "Dikumpulkan").length;
    const terlambat = tasks.filter((t) => isTaskOverdue(t)).length;
    const belumSelesai = total - selesai;
    return { total, selesai, belumSelesai, terlambat };
  }, [tasks]);

  // Pencarian + filter bekerja bersamaan
  const filteredTasks = useMemo(() => {
    let list = tasks;

    if (filter === "Belum selesai") {
      list = list.filter((t) => t.status !== "Selesai" && t.status !== "Dikumpulkan");
    } else if (filter === "Selesai") {
      list = list.filter((t) => t.status === "Selesai" || t.status === "Dikumpulkan");
    } else if (filter === "Terlambat") {
      list = list.filter((t) => isTaskOverdue(t));
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.course || "").toLowerCase().includes(q)
      );
    }

    // Tugas belum selesai diurutkan berdasarkan deadline terdekat; tugas selesai di bawah
    const pending = list.filter((t) => t.status !== "Selesai" && t.status !== "Dikumpulkan");
    const done = list.filter((t) => t.status === "Selesai" || t.status === "Dikumpulkan");
    pending.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    done.sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""));

    return [...pending, ...done];
  }, [tasks, filter, search]);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-zinc-400">{formatTodayID()}</p>
          <h1 className="mt-0.5 text-[23px] md:text-[26px] font-semibold tracking-tight text-zinc-900">
            Tugas
          </h1>
        </div>
        <button
          onClick={openAddForm}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[13px] font-semibold text-white active:bg-indigo-700 md:px-4"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Tambah Tugas</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </section>

      {/* Statistik */}
      <section className="grid grid-cols-4 gap-2 md:gap-3">
        <MiniStat label="Total" value={stats.total} tone="zinc" />
        <MiniStat label="Belum" value={stats.belumSelesai} tone="indigo" />
        <MiniStat label="Selesai" value={stats.selesai} tone="emerald" />
        <MiniStat label="Terlambat" value={stats.terlambat} tone="rose" />
      </section>

      {/* Pencarian */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={2} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul tugas atau mata kuliah..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3.5 text-[13.5px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Filter */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TASK_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                filter === f ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar tugas */}
      <Card>
        {filteredTasks.length === 0 ? (
          <EmptyState
            message={
              search.trim() || filter !== "Semua" ? "Tidak ada tugas yang ditemukan" : "Belum ada tugas"
            }
            actionLabel={!search.trim() && filter === "Semua" ? "Tambah tugas" : undefined}
            onAction={!search.trim() && filter === "Semua" ? openAddForm : undefined}
          />
        ) : (
          <div className="space-y-1">
            {filteredTasks.map((task) => (
              <TaskListRow
                key={task.id}
                task={task}
                onToggle={() => toggleStatus(task)}
                onEdit={() => openEditForm(task)}
                onDelete={() => setConfirmDeleteId(task.id)}
              />
            ))}
          </div>
        )}
      </Card>

      {formOpen && (
        <TaskFormSheet
          values={formValues}
          setValues={setFormValues}
          isEditing={!!editingId}
          courseNames={courseNames}
          onCancel={closeForm}
          onSave={saveForm}
        />
      )}

      {confirmDeleteId !== null && (
        <ConfirmDeleteGeneric
          title="Hapus tugas ini?"
          description="Tugas yang dihapus tidak dapat dikembalikan."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteTask(confirmDeleteId)}
        />
      )}

      {justSaved && <Toast text={`${justSaved.title} tersimpan`} />}
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const tones = {
    zinc: "text-zinc-700",
    indigo: "text-indigo-600",
    emerald: "text-emerald-600",
    rose: "text-rose-600",
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-center">
      <p className={`text-[17px] font-semibold tracking-tight ${tones[tone]}`}>{value}</p>
      <p className="text-[10.5px] text-zinc-400 leading-tight">{label}</p>
    </div>
  );
}

function TaskListRow({ task, onToggle, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isDone = task.status === "Selesai" || task.status === "Dikumpulkan";
  const overdue = isTaskOverdue(task);
  const pTone = priorityTone(task.priority);

  return (
    <div className="rounded-xl -mx-2.5 px-2.5 py-2 active:bg-zinc-50">
      <div className="flex w-full items-start gap-3">
        <button onClick={onToggle} className="mt-0.5 shrink-0">
          {isDone ? (
            <CheckCircle2 className="h-[19px] w-[19px] text-indigo-600" strokeWidth={2} />
          ) : (
            <Circle className="h-[19px] w-[19px] text-zinc-300" strokeWidth={2} />
          )}
        </button>

        <button onClick={() => setExpanded((v) => !v)} className="min-w-0 flex-1 text-left">
          <p
            className={`text-[14px] leading-snug ${
              isDone ? "text-zinc-400 line-through" : "text-zinc-800 font-medium"
            }`}
          >
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {task.course && (
              <span className="truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-medium text-zinc-500">
                {task.course}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${pTone.bg} ${pTone.text}`}>
              {task.priority}
            </span>
            {overdue && !isDone && (
              <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10.5px] font-semibold text-rose-600">
                <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
                Terlambat
              </span>
            )}
          </div>
          {task.dueDate && (
            <p className={`mt-1 text-[11.5px] ${overdue && !isDone ? "text-rose-500" : "text-zinc-400"}`}>
              {formatDateID(task.dueDate)}
              {task.dueTime ? ` · ${task.dueTime}` : ""}
            </p>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 ml-8 space-y-2.5 border-t border-zinc-100 pt-2.5">
          {task.notes && (
            <p className="rounded-lg bg-zinc-50 px-2.5 py-2 text-[12.5px] leading-snug text-zinc-600">
              {task.notes}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 active:bg-zinc-200"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-[12.5px] font-medium text-rose-600 active:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskFormSheet({ values, setValues, isEditing, courseNames, onCancel, onSave }) {
  const [attempted, setAttempted] = useState(false);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const isValid = values.title.trim() && values.dueDate;

  const handleSaveClick = () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 md:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:rounded-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-zinc-900">
            {isEditing ? "Edit Tugas" : "Tambah Tugas"}
          </h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 active:bg-zinc-100">
            <X className="h-5 w-5 text-zinc-400" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-3.5">
          <Field label="Judul tugas" required error={attempted && !values.title.trim()}>
            <input
              type="text"
              value={values.title}
              onChange={set("title")}
              placeholder="mis. Laporan Praktikum"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:ring-2 ${
                attempted && !values.title.trim()
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-zinc-200 focus:border-indigo-400 focus:ring-indigo-100"
              }`}
            />
          </Field>

          <Field label="Mata kuliah (opsional)">
            <select
              value={values.course}
              onChange={set("course")}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Tidak terkait mata kuliah</option>
              {courseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal jatuh tempo" required error={attempted && !values.dueDate}>
              <input
                type="date"
                value={values.dueDate}
                onChange={set("dueDate")}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:ring-2 ${
                  attempted && !values.dueDate
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                    : "border-zinc-200 focus:border-indigo-400 focus:ring-indigo-100"
                }`}
              />
            </Field>
            <Field label="Waktu (opsional)">
              <input
                type="time"
                value={values.dueTime}
                onChange={set("dueTime")}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </Field>
          </div>

          <Field label="Prioritas">
            <div className="grid grid-cols-3 gap-2">
              {TASK_PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, priority: p }))}
                  className={`rounded-xl border py-2 text-[13px] font-medium transition-colors ${
                    values.priority === p
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-zinc-200 text-zinc-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Jenis">
            <div className="grid grid-cols-2 gap-2">
              {TASK_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, category: c }))}
                  className={`rounded-xl border py-2 text-[13px] font-medium transition-colors ${
                    values.category === c
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-zinc-200 text-zinc-600"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          {isEditing && (
            <Field label="Status">
              <select
                value={values.status}
                onChange={set("status")}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Catatan (opsional)">
            <textarea
              value={values.notes}
              onChange={set("notes")}
              placeholder="Detail tambahan..."
              rows={2}
              className="w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>
        </div>

        {attempted && !isValid && (
          <p className="mt-3 text-[12.5px] font-medium text-rose-600">
            Lengkapi judul tugas dan tanggal jatuh tempo terlebih dahulu.
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[14px] font-medium text-zinc-600 active:bg-zinc-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-[14px] font-semibold text-white active:bg-indigo-700"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared small pieces reused across new pages
// ---------------------------------------------------------------------------

function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100">
        <ClipboardList className="h-5 w-5 text-zinc-400" strokeWidth={2} />
      </div>
      <p className="mt-3 text-[13.5px] font-medium text-zinc-600">{message}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-3 flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-[12.5px] font-medium text-zinc-600 active:bg-zinc-200"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ConfirmDeleteGeneric({ title, description, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 md:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:rounded-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
          <Trash2 className="h-5 w-5 text-rose-600" strokeWidth={2} />
        </div>
        <h2 className="mt-3.5 text-[16px] font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-[13.5px] text-zinc-500">{description}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[14px] font-medium text-zinc-600 active:bg-zinc-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-[14px] font-semibold text-white active:bg-rose-700"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ text }) {
  return (
    <div className="fixed inset-x-4 top-4 z-40 mx-auto max-w-sm md:left-1/2 md:right-auto md:-translate-x-1/2">
      <div className="flex items-center gap-2.5 rounded-xl bg-zinc-900 px-4 py-3 shadow-lg">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2.25} />
        <p className="text-[13px] font-medium text-white">{text}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mata Kuliah — sumber data utama untuk Jadwal, Tugas, Ujian, Presensi, Catatan
// ---------------------------------------------------------------------------

const EMPTY_COURSE_FORM = {
  name: "",
  code: "",
  lecturer: "",
  sks: "",
  room: "",
  notes: "",
};

function CoursesPage({ courses, setCourses }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_COURSE_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [justSaved, setJustSaved] = useState(null);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(null), 2200);
    return () => clearTimeout(t);
  }, [justSaved]);

  const openAddForm = () => {
    setEditingId(null);
    setFormValues(EMPTY_COURSE_FORM);
    setFormOpen(true);
  };

  const openEditForm = (course) => {
    setEditingId(course.id);
    setFormValues({
      name: course.name,
      code: course.code || "",
      lecturer: course.lecturer || "",
      sks: course.sks || "",
      room: course.room || "",
      notes: course.notes || "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const saveForm = () => {
    const trimmedName = formValues.name.trim();
    if (!trimmedName) return;
    const cleanValues = { ...formValues, name: trimmedName };

    if (editingId) {
      setCourses((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...cleanValues } : c)));
    } else {
      setCourses((prev) => [...prev, { id: nextCourseId(), ...cleanValues }]);
    }
    setJustSaved({ name: cleanValues.name });
    closeForm();
  };

  const deleteCourse = (id) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-zinc-400">Semester 1 · Gasal 2026/2027</p>
          <h1 className="mt-0.5 text-[23px] md:text-[26px] font-semibold tracking-tight text-zinc-900">
            Mata Kuliah
          </h1>
        </div>
        <button
          onClick={openAddForm}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[13px] font-semibold text-white active:bg-indigo-700 md:px-4"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Tambah Mata Kuliah</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </section>

      {courses.length === 0 ? (
        <Card>
          <EmptyState message="Belum ada mata kuliah" actionLabel="Tambah mata kuliah" onAction={openAddForm} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={() => openEditForm(course)}
              onDelete={() => setConfirmDeleteId(course.id)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <CourseFormSheet
          values={formValues}
          setValues={setFormValues}
          isEditing={!!editingId}
          onCancel={closeForm}
          onSave={saveForm}
        />
      )}

      {confirmDeleteId !== null && (
        <ConfirmDeleteGeneric
          title="Hapus mata kuliah ini?"
          description="Data mata kuliah akan dihapus. Jadwal, tugas, dan catatan yang sudah dibuat tidak ikut terhapus."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteCourse(confirmDeleteId)}
        />
      )}

      {justSaved && <Toast text={`${justSaved.name} tersimpan`} />}
    </div>
  );
}

function CourseCard({ course, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-semibold text-zinc-900">{course.name}</p>
          {course.code && <p className="text-[12px] text-zinc-400">{course.code}</p>}
        </div>
        {course.sks && (
          <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
            {course.sks} SKS
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[12.5px] text-zinc-500">
          <User className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} />
          <span className="truncate">{course.lecturer || "Dosen belum diisi"}</span>
        </div>
        <div className="flex items-center gap-2 text-[12.5px] text-zinc-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} />
          <span className="truncate">{course.room || "Ruangan belum diisi"}</span>
        </div>
      </div>

      {course.notes && (
        <p className="mt-3 rounded-lg bg-zinc-50 px-2.5 py-2 text-[12.5px] leading-snug text-zinc-600">
          {course.notes}
        </p>
      )}

      <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 active:bg-zinc-200"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-[12.5px] font-medium text-rose-600 active:bg-rose-100"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Hapus
        </button>
      </div>
    </div>
  );
}

function CourseFormSheet({ values, setValues, isEditing, onCancel, onSave }) {
  const [attempted, setAttempted] = useState(false);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const isValid = values.name.trim();

  const handleSaveClick = () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 md:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:rounded-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-zinc-900">
            {isEditing ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
          </h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 active:bg-zinc-100">
            <X className="h-5 w-5 text-zinc-400" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-3.5">
          <Field label="Nama mata kuliah" required error={attempted && !values.name.trim()}>
            <input
              type="text"
              value={values.name}
              onChange={set("name")}
              placeholder="mis. Kalkulus I"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:ring-2 ${
                attempted && !values.name.trim()
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-zinc-200 focus:border-indigo-400 focus:ring-indigo-100"
              }`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kode (opsional)">
              <input
                type="text"
                value={values.code}
                onChange={set("code")}
                placeholder="mis. MA101"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </Field>
            <Field label="SKS (opsional)">
              <input
                type="text"
                inputMode="numeric"
                value={values.sks}
                onChange={set("sks")}
                placeholder="mis. 3"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </Field>
          </div>

          <Field label="Dosen (opsional)">
            <input
              type="text"
              value={values.lecturer}
              onChange={set("lecturer")}
              placeholder="mis. Dr. Andri Wijaya"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>

          <Field label="Ruangan (opsional)">
            <input
              type="text"
              value={values.room}
              onChange={set("room")}
              placeholder="mis. R.304"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>

          <Field label="Catatan (opsional)">
            <textarea
              value={values.notes}
              onChange={set("notes")}
              placeholder="Detail tambahan..."
              rows={2}
              className="w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>
        </div>

        {attempted && !isValid && (
          <p className="mt-3 text-[12.5px] font-medium text-rose-600">Lengkapi nama mata kuliah terlebih dahulu.</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[14px] font-medium text-zinc-600 active:bg-zinc-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-[14px] font-semibold text-white active:bg-indigo-700"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ujian
// ---------------------------------------------------------------------------

const EMPTY_EXAM_FORM = {
  name: "",
  course: "",
  type: "Kuis",
  date: "",
  time: "",
  room: "",
  notes: "",
};

function relativeDayTone(iso) {
  const d = parseISODate(iso);
  if (!d) return { text: "text-zinc-500", bg: "bg-zinc-100" };
  const diff = daysBetween(d, startOfToday());
  if (diff < 0) return { text: "text-zinc-400", bg: "bg-zinc-100" };
  if (diff <= 2) return { text: "text-rose-600", bg: "bg-rose-50" };
  if (diff <= 6) return { text: "text-amber-600", bg: "bg-amber-50" };
  return { text: "text-emerald-600", bg: "bg-emerald-50" };
}

function ExamsPage({ exams, setExams, courseNames }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_EXAM_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [justSaved, setJustSaved] = useState(null);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(null), 2200);
    return () => clearTimeout(t);
  }, [justSaved]);

  const openAddForm = () => {
    setEditingId(null);
    setFormValues(EMPTY_EXAM_FORM);
    setFormOpen(true);
  };

  const openEditForm = (exam) => {
    setEditingId(exam.id);
    setFormValues({
      name: exam.name,
      course: exam.course || "",
      type: exam.type,
      date: exam.date || "",
      time: exam.time || "",
      room: exam.room || "",
      notes: exam.notes || "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const saveForm = () => {
    const trimmedName = formValues.name.trim();
    if (!trimmedName || !formValues.date) return;
    const cleanValues = { ...formValues, name: trimmedName };

    if (editingId) {
      setExams((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...cleanValues } : e)));
    } else {
      setExams((prev) => [...prev, { id: nextExamId(), ...cleanValues }]);
    }
    setJustSaved({ name: cleanValues.name });
    closeForm();
  };

  const deleteExam = (id) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteId(null);
  };

  // Diurutkan kronologis — ujian terdekat di atas
  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => {
      const dateCompare = (a.date || "9999").localeCompare(b.date || "9999");
      if (dateCompare !== 0) return dateCompare;
      return (a.time || "").localeCompare(b.time || "");
    });
  }, [exams]);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-zinc-400">{formatTodayID()}</p>
          <h1 className="mt-0.5 text-[23px] md:text-[26px] font-semibold tracking-tight text-zinc-900">
            Ujian
          </h1>
        </div>
        <button
          onClick={openAddForm}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[13px] font-semibold text-white active:bg-indigo-700 md:px-4"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Tambah Ujian</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </section>

      <Card>
        {sortedExams.length === 0 ? (
          <EmptyState message="Belum ada ujian" actionLabel="Tambah ujian" onAction={openAddForm} />
        ) : (
          <div className="space-y-2.5">
            {sortedExams.map((exam) => (
              <ExamRow
                key={exam.id}
                exam={exam}
                onEdit={() => openEditForm(exam)}
                onDelete={() => setConfirmDeleteId(exam.id)}
              />
            ))}
          </div>
        )}
      </Card>

      {formOpen && (
        <ExamFormSheet
          values={formValues}
          setValues={setFormValues}
          isEditing={!!editingId}
          courseNames={courseNames}
          onCancel={closeForm}
          onSave={saveForm}
        />
      )}

      {confirmDeleteId !== null && (
        <ConfirmDeleteGeneric
          title="Hapus ujian ini?"
          description="Data ujian yang dihapus tidak dapat dikembalikan."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteExam(confirmDeleteId)}
        />
      )}

      {justSaved && <Toast text={`${justSaved.name} tersimpan`} />}
    </div>
  );
}

function ExamRow({ exam, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const tone = relativeDayTone(exam.date);
  const label = relativeDayLabel(exam.date);

  return (
    <div className="rounded-xl -mx-2.5 px-2.5 py-2 active:bg-zinc-50">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-start gap-3 text-left">
        <div className="flex w-16 shrink-0 flex-col items-start pt-0.5">
          <span className="text-[12px] font-semibold text-zinc-800">{formatDateID(exam.date)}</span>
          {exam.time && <span className="text-[11px] text-zinc-400 tabular-nums">{exam.time}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-zinc-800">{exam.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {exam.course && (
              <span className="truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-medium text-zinc-500">
                {exam.course}
              </span>
            )}
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-semibold text-indigo-600">
              {exam.type}
            </span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.bg} ${tone.text}`}>
          {label}
        </span>
      </button>

      {expanded && (
        <div className="mt-2.5 ml-[76px] space-y-2 border-t border-zinc-100 pt-2.5">
          <div className="flex items-center gap-2 text-[12.5px] text-zinc-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} />
            <span className="truncate">{exam.room || "Ruangan belum diisi"}</span>
          </div>
          {exam.notes && (
            <p className="rounded-lg bg-zinc-50 px-2.5 py-2 text-[12.5px] leading-snug text-zinc-600">
              {exam.notes}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 active:bg-zinc-200"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-[12.5px] font-medium text-rose-600 active:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamFormSheet({ values, setValues, isEditing, courseNames, onCancel, onSave }) {
  const [attempted, setAttempted] = useState(false);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const isValid = values.name.trim() && values.date;

  const handleSaveClick = () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 md:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:rounded-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-zinc-900">
            {isEditing ? "Edit Ujian" : "Tambah Ujian"}
          </h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 active:bg-zinc-100">
            <X className="h-5 w-5 text-zinc-400" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-3.5">
          <Field label="Nama ujian" required error={attempted && !values.name.trim()}>
            <input
              type="text"
              value={values.name}
              onChange={set("name")}
              placeholder="mis. UTS Kalkulus I"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:ring-2 ${
                attempted && !values.name.trim()
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-zinc-200 focus:border-indigo-400 focus:ring-indigo-100"
              }`}
            />
          </Field>

          <Field label="Mata kuliah (opsional)">
            <select
              value={values.course}
              onChange={set("course")}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Tidak terkait mata kuliah</option>
              {courseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Jenis">
            <div className="grid grid-cols-4 gap-2">
              {EXAM_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, type: t }))}
                  className={`rounded-xl border py-2 text-[12.5px] font-medium transition-colors ${
                    values.type === t
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-zinc-200 text-zinc-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal" required error={attempted && !values.date}>
              <input
                type="date"
                value={values.date}
                onChange={set("date")}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:ring-2 ${
                  attempted && !values.date
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                    : "border-zinc-200 focus:border-indigo-400 focus:ring-indigo-100"
                }`}
              />
            </Field>
            <Field label="Waktu (opsional)">
              <input
                type="time"
                value={values.time}
                onChange={set("time")}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </Field>
          </div>

          <Field label="Ruangan (opsional)">
            <input
              type="text"
              value={values.room}
              onChange={set("room")}
              placeholder="mis. Aula 1"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>

          <Field label="Catatan (opsional)">
            <textarea
              value={values.notes}
              onChange={set("notes")}
              placeholder="mis. Bawa kalkulator"
              rows={2}
              className="w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>
        </div>

        {attempted && !isValid && (
          <p className="mt-3 text-[12.5px] font-medium text-rose-600">Lengkapi nama ujian dan tanggal terlebih dahulu.</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[14px] font-medium text-zinc-600 active:bg-zinc-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-[14px] font-semibold text-white active:bg-indigo-700"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presensi
// ---------------------------------------------------------------------------

function attendanceStatusTone(status) {
  switch (status) {
    case "Hadir":
      return { text: "text-emerald-700", bg: "bg-emerald-50" };
    case "Terlambat":
      return { text: "text-amber-700", bg: "bg-amber-50" };
    case "Izin":
      return { text: "text-sky-700", bg: "bg-sky-50" };
    default:
      return { text: "text-rose-700", bg: "bg-rose-50" };
  }
}

function AttendancePage({ attendance, setAttendance, courseNames }) {
  const [selectedCourse, setSelectedCourse] = useState(courseNames[0] || "");
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [justSaved, setJustSaved] = useState(null);
  const [newDate, setNewDate] = useState(todayISODate());
  const [newStatus, setNewStatus] = useState("Hadir");

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(null), 2200);
    return () => clearTimeout(t);
  }, [justSaved]);

  // Jika daftar mata kuliah berubah dan course terpilih hilang, pilih yang pertama
  useEffect(() => {
    if (courseNames.length > 0 && !courseNames.includes(selectedCourse)) {
      setSelectedCourse(courseNames[0]);
    }
  }, [courseNames, selectedCourse]);

  // Ringkasan per mata kuliah
  const summaryByCourse = useMemo(() => {
    return courseNames.map((name) => {
      const records = attendance.filter((r) => r.course === name);
      const hadir = records.filter((r) => r.status === "Hadir").length;
      const terlambat = records.filter((r) => r.status === "Terlambat").length;
      const izin = records.filter((r) => r.status === "Izin").length;
      const alpa = records.filter((r) => r.status === "Alpa").length;
      return {
        name,
        total: records.length,
        hadir,
        terlambat,
        izin,
        alpa,
        percentage: attendancePercentage(records),
      };
    });
  }, [attendance, courseNames]);

  const selectedRecords = useMemo(
    () =>
      [...attendance.filter((r) => r.course === selectedCourse)].sort((a, b) =>
        (b.date || "").localeCompare(a.date || "")
      ),
    [attendance, selectedCourse]
  );

  const selectedSummary = summaryByCourse.find((s) => s.name === selectedCourse);

  const openAddForm = () => {
    setNewDate(todayISODate());
    setNewStatus("Hadir");
    setFormOpen(true);
  };

  const saveRecord = () => {
    if (!selectedCourse || !newDate) return;
    setAttendance((prev) => [
      ...prev,
      { id: nextAttendanceId(), course: selectedCourse, date: newDate, status: newStatus },
    ]);
    setJustSaved({ course: selectedCourse });
    setFormOpen(false);
  };

  const deleteRecord = (id) => {
    setAttendance((prev) => prev.filter((r) => r.id !== id));
    setConfirmDeleteId(null);
  };

  if (courseNames.length === 0) {
    return (
      <div className="space-y-5 md:space-y-6">
        <section>
          <p className="text-[13px] font-medium text-zinc-400">{formatTodayID()}</p>
          <h1 className="mt-0.5 text-[23px] md:text-[26px] font-semibold tracking-tight text-zinc-900">
            Presensi
          </h1>
        </section>
        <Card>
          <EmptyState message="Tambahkan mata kuliah terlebih dahulu untuk mencatat presensi" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <section>
        <p className="text-[13px] font-medium text-zinc-400">{formatTodayID()}</p>
        <h1 className="mt-0.5 text-[23px] md:text-[26px] font-semibold tracking-tight text-zinc-900">
          Presensi
        </h1>
      </section>

      {/* Pilih mata kuliah */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {courseNames.map((name) => (
            <button
              key={name}
              onClick={() => setSelectedCourse(name)}
              className={`shrink-0 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                selectedCourse === name ? "bg-indigo-600 text-white" : "bg-white border border-zinc-200 text-zinc-600"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {selectedSummary && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-900">{selectedSummary.name}</h2>
              <p className="text-[12.5px] text-zinc-400">{selectedSummary.total} pertemuan</p>
            </div>
            <button
              onClick={openAddForm}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[12.5px] font-semibold text-white active:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Catat
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <ProgressRing value={selectedSummary.percentage} />
            <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px]">
              <AttendanceStatLine label="Hadir" value={selectedSummary.hadir} dotClass="bg-emerald-500" />
              <AttendanceStatLine label="Terlambat" value={selectedSummary.terlambat} dotClass="bg-amber-500" />
              <AttendanceStatLine label="Izin" value={selectedSummary.izin} dotClass="bg-sky-500" />
              <AttendanceStatLine label="Alpa" value={selectedSummary.alpa} dotClass="bg-rose-500" />
            </div>
          </div>
        </Card>
      )}

      {/* Riwayat pertemuan */}
      <Card>
        <CardHeader title="Riwayat pertemuan" />
        {selectedRecords.length === 0 ? (
          <EmptyState message="Belum ada catatan presensi" actionLabel="Catat presensi" onAction={openAddForm} />
        ) : (
          <div className="space-y-1">
            {selectedRecords.map((record) => {
              const tone = attendanceStatusTone(record.status);
              return (
                <div key={record.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2 -mx-2.5">
                  <span className="flex-1 text-[13.5px] text-zinc-700">{formatDateID(record.date)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${tone.bg} ${tone.text}`}>
                    {record.status}
                  </span>
                  <button
                    onClick={() => setConfirmDeleteId(record.id)}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 active:bg-rose-50 active:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {formOpen && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 md:items-center"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:rounded-2xl md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-zinc-900">Catat Presensi — {selectedCourse}</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg p-1.5 active:bg-zinc-100">
                <X className="h-5 w-5 text-zinc-400" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-3.5">
              <Field label="Tanggal pertemuan">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </Field>

              <Field label="Status">
                <div className="grid grid-cols-2 gap-2">
                  {ATTENDANCE_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewStatus(s)}
                      className={`rounded-xl border py-2 text-[13px] font-medium transition-colors ${
                        newStatus === s
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-zinc-200 text-zinc-600"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[14px] font-medium text-zinc-600 active:bg-zinc-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveRecord}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-[14px] font-semibold text-white active:bg-indigo-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <ConfirmDeleteGeneric
          title="Hapus catatan presensi ini?"
          description="Catatan yang dihapus tidak dapat dikembalikan."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteRecord(confirmDeleteId)}
        />
      )}

      {justSaved && <Toast text={`Presensi ${justSaved.course} tersimpan`} />}
    </div>
  );
}

function AttendanceStatLine({ label, value, dotClass }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
      <span className="text-zinc-500">{label}:</span>
      <span className="font-semibold text-zinc-800">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Catatan
// ---------------------------------------------------------------------------

const EMPTY_NOTE_FORM = { title: "", body: "", course: "" };

function NotesPage({ notes, setNotes, courseNames }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_NOTE_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [justSaved, setJustSaved] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(null), 2200);
    return () => clearTimeout(t);
  }, [justSaved]);

  const openAddForm = () => {
    setEditingId(null);
    setFormValues(EMPTY_NOTE_FORM);
    setFormOpen(true);
  };

  const openEditForm = (note) => {
    setEditingId(note.id);
    setFormValues({ title: note.title, body: note.body || "", course: note.course || "" });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const saveForm = () => {
    const trimmedTitle = formValues.title.trim();
    if (!trimmedTitle) return;
    const cleanValues = { ...formValues, title: trimmedTitle, updatedAt: todayISODate() };

    if (editingId) {
      setNotes((prev) => prev.map((n) => (n.id === editingId ? { ...n, ...cleanValues } : n)));
    } else {
      setNotes((prev) => [...prev, { id: nextNoteId(), ...cleanValues }]);
    }
    setJustSaved({ title: cleanValues.title });
    closeForm();
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setConfirmDeleteId(null);
  };

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...notes];
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.body || "").toLowerCase().includes(q) ||
          (n.course || "").toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }, [notes, search]);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-zinc-400">{formatTodayID()}</p>
          <h1 className="mt-0.5 text-[23px] md:text-[26px] font-semibold tracking-tight text-zinc-900">
            Catatan
          </h1>
        </div>
        <button
          onClick={openAddForm}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[13px] font-semibold text-white active:bg-indigo-700 md:px-4"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Buat Catatan</span>
          <span className="sm:hidden">Buat</span>
        </button>
      </section>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={2} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari catatan..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3.5 text-[13.5px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {filteredNotes.length === 0 ? (
        <Card>
          <EmptyState
            message={search.trim() ? "Tidak ada catatan yang ditemukan" : "Belum ada catatan"}
            actionLabel={!search.trim() ? "Buat catatan" : undefined}
            onAction={!search.trim() ? openAddForm : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => openEditForm(note)}
              onDelete={() => setConfirmDeleteId(note.id)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <NoteFormSheet
          values={formValues}
          setValues={setFormValues}
          isEditing={!!editingId}
          courseNames={courseNames}
          onCancel={closeForm}
          onSave={saveForm}
        />
      )}

      {confirmDeleteId !== null && (
        <ConfirmDeleteGeneric
          title="Hapus catatan ini?"
          description="Catatan yang dihapus tidak dapat dikembalikan."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteNote(confirmDeleteId)}
        />
      )}

      {justSaved && <Toast text={`${justSaved.title} tersimpan`} />}
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-zinc-900">{note.title}</p>
        {note.course && (
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-medium text-zinc-500">
            {note.course}
          </span>
        )}
      </div>
      {note.body && (
        <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-zinc-600 line-clamp-4">
          {note.body}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
        <p className="text-[11px] text-zinc-400">
          {note.updatedAt ? `Diperbarui ${formatDateID(note.updatedAt)}` : ""}
        </p>
        <div className="flex gap-2">
          <button onClick={onEdit} className="rounded-lg bg-zinc-100 p-1.5 text-zinc-600 active:bg-zinc-200">
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button onClick={onDelete} className="rounded-lg bg-rose-50 p-1.5 text-rose-600 active:bg-rose-100">
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteFormSheet({ values, setValues, isEditing, courseNames, onCancel, onSave }) {
  const [attempted, setAttempted] = useState(false);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const isValid = values.title.trim();

  const handleSaveClick = () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 md:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:rounded-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-zinc-900">
            {isEditing ? "Edit Catatan" : "Buat Catatan"}
          </h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 active:bg-zinc-100">
            <X className="h-5 w-5 text-zinc-400" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-3.5">
          <Field label="Judul" required error={attempted && !values.title.trim()}>
            <input
              type="text"
              value={values.title}
              onChange={set("title")}
              placeholder="mis. Rumus turunan dasar"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:ring-2 ${
                attempted && !values.title.trim()
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-zinc-200 focus:border-indigo-400 focus:ring-indigo-100"
              }`}
            />
          </Field>

          <Field label="Mata kuliah / kategori (opsional)">
            <select
              value={values.course}
              onChange={set("course")}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Umum</option>
              {courseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Isi catatan (opsional)">
            <textarea
              value={values.body}
              onChange={set("body")}
              placeholder="Tulis catatan di sini..."
              rows={6}
              className="w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>
        </div>

        {attempted && !isValid && (
          <p className="mt-3 text-[12.5px] font-medium text-rose-600">Lengkapi judul catatan terlebih dahulu.</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[14px] font-medium text-zinc-600 active:bg-zinc-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-[14px] font-semibold text-white active:bg-indigo-700"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
