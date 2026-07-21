import type {
  CertificateOrder,
  CourseOrder,
  CourseProgress,
  LmsState,
  Session,
  Student,
} from "./types";
import { DEFAULT_COURSE_PRICE } from "./types";

const STORAGE_KEY = "kouki-lms-v1";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function now() {
  return new Date().toISOString();
}

export function createSeedState(): LmsState {
  const s1: Student = {
    id: "stu_demo_1",
    fullName: "نور عبدي",
    phone: "0555123456",
    email: "nour@example.com",
    whatsapp: "0555123456",
    wilaya: "16",
    status: "active",
    enrolledCourseIds: ["17510", "17522"],
    createdAt: now(),
  };
  const s2: Student = {
    id: "stu_demo_2",
    fullName: "ليندا خالدي",
    phone: "0666987654",
    whatsapp: "0666987654",
    wilaya: "31",
    status: "active",
    enrolledCourseIds: ["17659"],
    createdAt: now(),
  };
  const s3: Student = {
    id: "stu_demo_3",
    fullName: "سارة مسعودي",
    phone: "0777111222",
    whatsapp: "0777111222",
    wilaya: "19",
    status: "suspended",
    enrolledCourseIds: [],
    createdAt: now(),
  };

  const progress: CourseProgress[] = [
    {
      studentId: s1.id,
      courseId: "17510",
      completedLessonIds: ["l1", "l2", "l3"],
      lessonCount: 3,
    },
    {
      studentId: s1.id,
      courseId: "17522",
      completedLessonIds: [],
      lessonCount: 39,
    },
    {
      studentId: s2.id,
      courseId: "17659",
      completedLessonIds: ["a", "b", "c", "d"],
      lessonCount: 8,
    },
  ];

  const courseOrders: CourseOrder[] = [
    {
      id: "co_seed_1",
      studentId: s2.id,
      courseId: "17526",
      courseTitle: "دورة شاملة دوة في التسريحات العصرية",
      amount: DEFAULT_COURSE_PRICE,
      status: "pending",
      createdAt: now(),
    },
    {
      id: "co_seed_2",
      studentId: s1.id,
      courseId: "17510",
      courseTitle: "علاجات الشعر و الفرق بينها و كيفية استعمالها",
      amount: DEFAULT_COURSE_PRICE,
      status: "done",
      createdAt: now(),
      completedAt: now(),
    },
  ];

  const certificateOrders: CertificateOrder[] = [
    {
      id: "cert_seed_1",
      studentId: s1.id,
      courseId: "17510",
      courseTitle: "علاجات الشعر و الفرق بينها و كيفية استعمالها",
      status: "pending",
      createdAt: now(),
    },
  ];

  return {
    students: [s1, s2, s3],
    courseOrders,
    certificateOrders,
    progress,
    session: null,
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

const SESSION_KEY = "kouki-lms-session";

/** Plain passwords waiting to be hashed on next API persist (never stored in state). */
const pendingPasswords = new Map<string, string>();

export function queueStudentPassword(studentId: string, password: string) {
  if (password.trim().length >= 6) {
    pendingPasswords.set(studentId, password.trim());
  }
}

export function takePendingPasswords(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, pw] of pendingPasswords) out[id] = pw;
  pendingPasswords.clear();
  return out;
}

export function peekPendingPasswords(): Record<string, string> {
  return Object.fromEntries(pendingPasswords);
}

export function emptyLmsState(): LmsState {
  return {
    students: [],
    courseOrders: [],
    certificateOrders: [],
    progress: [],
    session: null,
  };
}

export function loadState(): LmsState {
  if (!canUseStorage()) return emptyLmsState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyLmsState();
    const parsed = JSON.parse(raw) as LmsState;
    // Prefer dedicated session key when present
    try {
      const sRaw = localStorage.getItem(SESSION_KEY);
      if (sRaw) parsed.session = JSON.parse(sRaw) as Session;
    } catch {
      /* keep parsed.session */
    }
    return parsed;
  } catch {
    return emptyLmsState();
  }
}

export function saveState(state: LmsState) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (state.session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function hydrateFromApi(): Promise<LmsState> {
  const res = await fetch("/api/lms");
  if (!res.ok) throw new Error("Failed to load LMS");
  const data = (await res.json()) as Omit<LmsState, "session">;
  const current = loadState();
  const next: LmsState = { ...data, session: current.session };
  saveState(next);
  return next;
}

export async function persistToApi(state: LmsState): Promise<void> {
  const { session: _, ...payload } = state;
  void _;
  const passwords = takePendingPasswords();
  await fetch("/api/lms", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, passwords }),
  });
}

export function resetLmsStore() {
  const seed = createSeedState();
  saveState(seed);
  return seed;
}

/* ---------- Session ---------- */

export function setSession(session: Session, state = loadState()): LmsState {
  const next = { ...state, session };
  saveState(next);
  return next;
}

export function clearSession(state = loadState()): LmsState {
  return setSession(null, state);
}

/* ---------- Students ---------- */

export function upsertStudent(
  input: Omit<Student, "id" | "createdAt" | "enrolledCourseIds" | "status"> & {
    id?: string;
    enrolledCourseIds?: string[];
    status?: Student["status"];
    password?: string;
  },
  state = loadState()
): LmsState {
  if (input.id) {
    const students = state.students.map((s) =>
      s.id === input.id
        ? {
            ...s,
            fullName: input.fullName,
            phone: input.phone,
            email: input.email,
            whatsapp: input.whatsapp,
            wilaya: input.wilaya,
            enrolledCourseIds: input.enrolledCourseIds ?? s.enrolledCourseIds,
            status: input.status ?? s.status,
          }
        : s
    );
    if (input.password) queueStudentPassword(input.id, input.password);
    const next = { ...state, students };
    saveState(next);
    return next;
  }

  const student: Student = {
    id: uid("stu"),
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    whatsapp: input.whatsapp,
    wilaya: input.wilaya,
    status: input.status ?? "active",
    enrolledCourseIds: input.enrolledCourseIds ?? [],
    createdAt: now(),
  };
  if (input.password) queueStudentPassword(student.id, input.password);
  const next = { ...state, students: [...state.students, student] };
  saveState(next);
  return next;
}

export function setStudentStatus(
  id: string,
  status: Student["status"],
  state = loadState()
): LmsState {
  const students = state.students.map((s) =>
    s.id === id ? { ...s, status } : s
  );
  const next = { ...state, students };
  saveState(next);
  return next;
}

export function deleteStudent(id: string, state = loadState()): LmsState {
  const next: LmsState = {
    ...state,
    students: state.students.filter((s) => s.id !== id),
    courseOrders: state.courseOrders.filter((o) => o.studentId !== id),
    certificateOrders: state.certificateOrders.filter((o) => o.studentId !== id),
    progress: state.progress.filter((p) => p.studentId !== id),
    session:
      state.session?.role === "student" && state.session.studentId === id
        ? null
        : state.session,
  };
  saveState(next);
  return next;
}

export function setStudentCourses(
  id: string,
  courseIds: string[],
  state = loadState()
): LmsState {
  const students = state.students.map((s) =>
    s.id === id ? { ...s, enrolledCourseIds: [...new Set(courseIds)] } : s
  );
  const next = { ...state, students };
  saveState(next);
  return next;
}

export function enrollStudent(
  studentId: string,
  courseId: string,
  state = loadState()
): LmsState {
  const students = state.students.map((s) => {
    if (s.id !== studentId) return s;
    if (s.enrolledCourseIds.includes(courseId)) return s;
    return { ...s, enrolledCourseIds: [...s.enrolledCourseIds, courseId] };
  });
  const next = { ...state, students };
  saveState(next);
  return next;
}

/* ---------- Course orders ---------- */

export function createCourseOrder(
  input: {
    studentId: string;
    courseId: string;
    courseTitle: string;
    amount?: number;
    note?: string;
  },
  state = loadState()
): { state: LmsState; order: CourseOrder } {
  const existing = state.courseOrders.find(
    (o) =>
      o.studentId === input.studentId &&
      o.courseId === input.courseId &&
      o.status === "pending"
  );
  if (existing) return { state, order: existing };

  const student = state.students.find((s) => s.id === input.studentId);
  if (student?.enrolledCourseIds.includes(input.courseId)) {
    throw new Error("already_enrolled");
  }

  const order: CourseOrder = {
    id: uid("co"),
    studentId: input.studentId,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    amount: input.amount ?? DEFAULT_COURSE_PRICE,
    status: "pending",
    note: input.note,
    createdAt: now(),
  };
  const next = { ...state, courseOrders: [order, ...state.courseOrders] };
  saveState(next);
  return { state: next, order };
}

export function completeCourseOrder(
  orderId: string,
  state = loadState()
): LmsState {
  const order = state.courseOrders.find((o) => o.id === orderId);
  if (!order || order.status === "done") return state;

  let next: LmsState = {
    ...state,
    courseOrders: state.courseOrders.map((o) =>
      o.id === orderId
        ? { ...o, status: "done" as const, completedAt: now() }
        : o
    ),
  };
  next = enrollStudent(order.studentId, order.courseId, next);
  saveState(next);
  return next;
}

export function cancelCourseOrder(
  orderId: string,
  state = loadState()
): LmsState {
  const order = state.courseOrders.find((o) => o.id === orderId);
  if (!order || order.status === "cancelled") return state;

  // If it was already accepted, revoke course access (error / refund cases)
  let students = state.students;
  if (order.status === "done") {
    students = state.students.map((s) =>
      s.id === order.studentId
        ? {
            ...s,
            enrolledCourseIds: s.enrolledCourseIds.filter(
              (id) => id !== order.courseId
            ),
          }
        : s
    );
  }

  const next: LmsState = {
    ...state,
    students,
    courseOrders: state.courseOrders.map((o) =>
      o.id === orderId ? { ...o, status: "cancelled" as const } : o
    ),
  };
  saveState(next);
  return next;
}

export function restoreCourseOrder(
  orderId: string,
  state = loadState()
): LmsState {
  const order = state.courseOrders.find((o) => o.id === orderId);
  if (!order || order.status !== "cancelled") return state;

  const next: LmsState = {
    ...state,
    courseOrders: state.courseOrders.map((o) =>
      o.id === orderId
        ? { ...o, status: "pending" as const, completedAt: undefined }
        : o
    ),
  };
  saveState(next);
  return next;
}

/* ---------- Certificate orders ---------- */

export function createCertificateOrder(
  input: { studentId: string; courseId: string; courseTitle: string },
  state = loadState()
): { state: LmsState; order: CertificateOrder } {
  const existing = state.certificateOrders.find(
    (o) =>
      o.studentId === input.studentId &&
      o.courseId === input.courseId &&
      (o.status === "pending" || o.status === "done")
  );
  if (existing) return { state, order: existing };

  const order: CertificateOrder = {
    id: uid("cert"),
    studentId: input.studentId,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    status: "pending",
    createdAt: now(),
  };
  const next = {
    ...state,
    certificateOrders: [order, ...state.certificateOrders],
  };
  saveState(next);
  return { state: next, order };
}

export function completeCertificateOrder(
  orderId: string,
  state = loadState()
): LmsState {
  const next = {
    ...state,
    certificateOrders: state.certificateOrders.map((o) =>
      o.id === orderId
        ? { ...o, status: "done" as const, completedAt: now() }
        : o
    ),
  };
  saveState(next);
  return next;
}

export function cancelCertificateOrder(
  orderId: string,
  state = loadState()
): LmsState {
  const next = {
    ...state,
    certificateOrders: state.certificateOrders.map((o) =>
      o.id === orderId ? { ...o, status: "cancelled" as const } : o
    ),
  };
  saveState(next);
  return next;
}

export function restoreCertificateOrder(
  orderId: string,
  state = loadState()
): LmsState {
  const order = state.certificateOrders.find((o) => o.id === orderId);
  if (!order || order.status !== "cancelled") return state;

  const next: LmsState = {
    ...state,
    certificateOrders: state.certificateOrders.map((o) =>
      o.id === orderId
        ? { ...o, status: "pending" as const, completedAt: undefined }
        : o
    ),
  };
  saveState(next);
  return next;
}

/* ---------- Progress ---------- */

export function getProgressPercent(p: CourseProgress | undefined): number {
  if (!p || p.lessonCount <= 0) return 0;
  return Math.min(
    100,
    Math.round((p.completedLessonIds.length / p.lessonCount) * 100)
  );
}

export function markLessonComplete(
  studentId: string,
  courseId: string,
  lessonId: string,
  lessonCount: number,
  state = loadState()
): LmsState {
  const existing = state.progress.find(
    (p) => p.studentId === studentId && p.courseId === courseId
  );
  let progress: CourseProgress[];
  if (existing) {
    progress = state.progress.map((p) =>
      p.studentId === studentId && p.courseId === courseId
        ? {
            ...p,
            lessonCount,
            completedLessonIds: p.completedLessonIds.includes(lessonId)
              ? p.completedLessonIds
              : [...p.completedLessonIds, lessonId],
          }
        : p
    );
  } else {
    progress = [
      ...state.progress,
      {
        studentId,
        courseId,
        lessonCount,
        completedLessonIds: [lessonId],
      },
    ];
  }
  const next = { ...state, progress };
  saveState(next);
  return next;
}

/* ---------- Stats ---------- */

export function getTotalIncome(state = loadState()): number {
  return state.courseOrders
    .filter((o) => o.status === "done")
    .reduce((sum, o) => sum + o.amount, 0);
}

export function getBestCourse(state = loadState()): {
  courseId: string;
  courseTitle: string;
  count: number;
  revenue: number;
} | null {
  const map = new Map<
    string,
    { courseId: string; courseTitle: string; count: number; revenue: number }
  >();
  for (const o of state.courseOrders.filter((x) => x.status === "done")) {
    const cur = map.get(o.courseId) ?? {
      courseId: o.courseId,
      courseTitle: o.courseTitle,
      count: 0,
      revenue: 0,
    };
    cur.count += 1;
    cur.revenue += o.amount;
    map.set(o.courseId, cur);
  }
  const list = [...map.values()].sort((a, b) => b.count - a.count);
  return list[0] ?? null;
}
