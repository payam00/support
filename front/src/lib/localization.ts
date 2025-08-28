import { Ticket } from "@/types";

// ترجمه فارسی برای وضعیت‌های تیکت
export const TICKET_STATUS_PERSIAN: Record<Ticket['status'], string> = {
  Open: 'باز',
  Answered: 'پاسخ داده شده',
  'In-Progress': 'در حال بررسی',
  Closed: 'بسته شده',
   Referred: 'ارجاع داده شده',
};

// رنگ‌های متناظر با هر وضعیت
export const TICKET_STATUS_COLORS: Record<Ticket['status'], string> = {
  Open: 'blue',
  Answered: 'green',
  'In-Progress': 'orange',
  Closed: 'default',
  Referred: 'gold',
};

// ترجمه فارسی برای اولویت‌های تیکت
export const TICKET_PRIORITY_PERSIAN: Record<Ticket['priority'], string> = {
  Low: 'پایین',
  Medium: 'متوسط',
  High: 'بالا',
};
// --- NEW: Localization for WooCommerce statuses ---
export const WOOCOMMERCE_STATUS_PERSIAN: Record<string, string> = {
  'pending': 'در انتظار پرداخت',
  'processing': 'در حال انجام',
  'on-hold': 'در انتظار بررسی',
  'completed': 'تکمیل شده',
  'cancelled': 'لغو شده',
  'refunded': 'مسترد شده',
  'failed': 'ناموفق',
};

export const WOOCOMMERCE_STATUS_COLORS: Record<string, string> = {
    'pending': 'gold',
    'processing': 'blue',
    'on-hold': 'orange',
    'completed': 'green',
    'cancelled': 'red',
    'refunded': 'purple',
    'failed': 'magenta',
};