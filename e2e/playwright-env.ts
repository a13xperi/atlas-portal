const LOCAL_BASE_URL_PATTERN = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i;

const PRIMARY_VERCEL_BYPASS_ENV = "VERCEL_AUTOMATION_BYPASS_SECRET";
const LEGACY_VERCEL_BYPASS_ENV = "VERCEL_PROTECTION_BYPASS";

type Cookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
};

export function resolvePlaywrightBaseURL(defaultBaseURL: string) {
  return process.env.PLAYWRIGHT_BASE_URL?.trim() || defaultBaseURL;
}

export function isLocalBaseURL(baseURL: string) {
  return LOCAL_BASE_URL_PATTERN.test(baseURL);
}

export function resolveVercelBypassSecret() {
  return (
    process.env[PRIMARY_VERCEL_BYPASS_ENV]?.trim() ||
    process.env[LEGACY_VERCEL_BYPASS_ENV]?.trim() ||
    undefined
  );
}

export function resolveVercelBypassHeaders() {
  const bypassSecret = resolveVercelBypassSecret();
  return bypassSecret
    ? { "x-vercel-protection-bypass": bypassSecret }
    : undefined;
}

export function resolveVercelBypassCookies(domain: string): Cookie[] {
  const bypassSecret = resolveVercelBypassSecret();
  return bypassSecret
    ? [{ name: "_vercel_password", value: bypassSecret, domain, path: "/" }]
    : [];
}
