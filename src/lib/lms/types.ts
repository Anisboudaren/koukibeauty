export type StudentStatus = "active" | "suspended";
export type OrderStatus = "pending" | "done" | "cancelled";

export interface Student {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  whatsapp: string;
  wilaya: string;
  status: StudentStatus;
  enrolledCourseIds: string[];
  createdAt: string;
}

export interface CourseOrder {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  status: OrderStatus;
  note?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CertificateOrder {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  status: OrderStatus;
  createdAt: string;
  completedAt?: string;
}

export interface CourseProgress {
  studentId: string;
  courseId: string;
  completedLessonIds: string[];
  lessonCount: number;
}

export type Session =
  | { role: "admin" }
  | { role: "student"; studentId: string }
  | null;

export interface LmsState {
  students: Student[];
  courseOrders: CourseOrder[];
  certificateOrders: CertificateOrder[];
  progress: CourseProgress[];
  session: Session;
}

export const DEFAULT_COURSE_PRICE = 4500;
