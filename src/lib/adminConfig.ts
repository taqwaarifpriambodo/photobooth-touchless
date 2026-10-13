/**
 * Konfigurasi Administrator
 * Hanya akun dengan email ini yang berhak mengakses dan mengelola frame di /admin/frames.
 */
export const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''
).toLowerCase().trim();

/**
 * Cek apakah email yang login adalah admin yang sah.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || !ADMIN_EMAIL) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL;
}
