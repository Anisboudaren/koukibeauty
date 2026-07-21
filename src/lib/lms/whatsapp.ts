const ACADEMY_WA =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "213555000000";

export function getAcademyWhatsApp(): string {
  return ACADEMY_WA;
}

/** Build wa.me link. `phone` should be digits, country code preferred. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("0")
    ? `213${digits.slice(1)}`
    : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function courseOrderMessage(opts: {
  studentName: string;
  courseTitle: string;
  amount: number;
  orderId: string;
}): string {
  return (
    `مرحباً، طلب وصول لدورة:\n` +
    `الطالبة: ${opts.studentName}\n` +
    `الدورة: ${opts.courseTitle}\n` +
    `المبلغ: ${opts.amount} د.ج\n` +
    `رقم الطلب: ${opts.orderId}`
  );
}

export function certificateOrderMessage(opts: {
  studentName: string;
  courseTitle: string;
  orderId: string;
}): string {
  return (
    `مرحباً، طلب شهادة:\n` +
    `الطالبة: ${opts.studentName}\n` +
    `الدورة: ${opts.courseTitle}\n` +
    `رقم الطلب: ${opts.orderId}`
  );
}
