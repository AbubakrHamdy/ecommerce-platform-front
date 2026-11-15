// Only same-site paths are followed after login: "/orders/7" yes, "https://evil.com" or "//evil.com" no.
export function safeReturnUrl(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/';
}
