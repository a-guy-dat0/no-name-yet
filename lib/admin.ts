// Admin access guard — only superdrea13@gmail.com can use admin routes.
// Import and call isAdmin() in every admin API route and page.

const ADMIN_EMAIL = "superdrea13@gmail.com";

export function isAdmin(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}
