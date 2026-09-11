/**
 * Strict Super Admin Access Control for Sawari Partner
 * Only the verified super admin phone (+919052931129) is authorized to access the Admin Panel.
 */

export const SUPER_ADMIN_PHONE = '+919052931129';
export const SUPER_ADMIN_RAW_PHONE = '9052931129';

/**
 * Validates if the phone number belongs to the Super Admin (+919052931129).
 */
export function isSuperAdminPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits === '9052931129' || digits === '919052931129';
}

/**
 * Validates if the user profile is the verified Super Admin.
 * Strictly checks the verified phone number (+919052931129).
 */
export function isSuperAdminUser(user?: { phone?: string | null } | null): boolean {
  if (!user || !user.phone) return false;
  return isSuperAdminPhone(user.phone);
}
