/** Hard navigation after auth — soft router.push can leave LMS session stale. */
export function redirectAfterAuth(
  path: string | null | undefined,
  fallback: string
) {
  const raw = (path || "").trim();
  let dest = fallback;
  if (
    raw.startsWith("/") &&
    !raw.startsWith("//") &&
    !raw.startsWith("/login") &&
    !raw.startsWith("/signup")
  ) {
    dest = raw;
  }
  window.location.assign(dest);
}
