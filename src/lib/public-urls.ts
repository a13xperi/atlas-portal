function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function stripLeadingSlash(value: string) {
  return value.replace(/^\/+/, "");
}

function normalizeHandle(value?: string | null) {
  return value?.trim().replace(/^@/, "") ?? "";
}

function getOrigin(value: string) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).origin;
  } catch {
    return stripTrailingSlash(value);
  }
}

function joinUrl(base: string, path: string) {
  if (!base) {
    return "";
  }

  return `${stripTrailingSlash(base)}/${stripLeadingSlash(path)}`;
}

function getHost(value: string) {
  if (!value) {
    return "NEXT_PUBLIC_APP_URL";
  }

  try {
    return new URL(value).host;
  } catch {
    return stripTrailingSlash(value).replace(/^https?:\/\//, "");
  }
}

export const publicUrls = {
  apiUrl: stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL ?? ""),
  appUrl: stripTrailingSlash(process.env.NEXT_PUBLIC_APP_URL ?? ""),
  supabaseUrl: stripTrailingSlash(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
  xBaseUrl: stripTrailingSlash(process.env.NEXT_PUBLIC_X_BASE_URL ?? ""),
  unavatarOrigin: stripTrailingSlash(
    process.env.NEXT_PUBLIC_UNAVATAR_ORIGIN ?? "https://unavatar.io"
  ),
  telegramBotUrl: stripTrailingSlash(process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ?? ""),
  xImageCdnOrigin: stripTrailingSlash(
    process.env.NEXT_PUBLIC_X_IMAGE_CDN_ORIGIN ?? "https://pbs.twimg.com"
  ),
  googleFontsStylesOrigin: stripTrailingSlash(
    process.env.NEXT_PUBLIC_GOOGLE_FONTS_STYLES_ORIGIN ?? "https://fonts.googleapis.com"
  ),
  googleFontsAssetsOrigin: stripTrailingSlash(
    process.env.NEXT_PUBLIC_GOOGLE_FONTS_ASSETS_ORIGIN ?? "https://fonts.gstatic.com"
  ),
  demoSourceUrl: stripTrailingSlash(process.env.NEXT_PUBLIC_DEMO_SOURCE_URL ?? ""),
} as const;

export const publicOrigins = {
  apiOrigin: getOrigin(publicUrls.apiUrl),
  supabaseOrigin: getOrigin(publicUrls.supabaseUrl),
  unavatarOrigin: getOrigin(publicUrls.unavatarOrigin),
  xImageCdnOrigin: getOrigin(publicUrls.xImageCdnOrigin),
  googleFontsStylesOrigin: getOrigin(publicUrls.googleFontsStylesOrigin),
  googleFontsAssetsOrigin: getOrigin(publicUrls.googleFontsAssetsOrigin),
} as const;

export const appHostDisplay = getHost(publicUrls.appUrl);

export function getAppUrl(path = "") {
  if (!publicUrls.appUrl) {
    return path;
  }

  if (!path) {
    return publicUrls.appUrl;
  }

  return new URL(path, `${publicUrls.appUrl}/`).toString();
}

export function getTwitterAvatarUrl(handle?: string | null) {
  const normalizedHandle = normalizeHandle(handle);

  if (!normalizedHandle || !publicUrls.unavatarOrigin) {
    return null;
  }

  return joinUrl(publicUrls.unavatarOrigin, `twitter/${normalizedHandle}`);
}

export function getXProfileUrl(handle?: string | null) {
  const normalizedHandle = normalizeHandle(handle);

  if (!normalizedHandle || !publicUrls.xBaseUrl) {
    return null;
  }

  return joinUrl(publicUrls.xBaseUrl, normalizedHandle);
}

export function getXIntentUrl(text: string) {
  if (!publicUrls.xBaseUrl) {
    return null;
  }

  const url = new URL("/intent/tweet", `${publicUrls.xBaseUrl}/`);
  url.searchParams.set("text", text);
  return url.toString();
}
