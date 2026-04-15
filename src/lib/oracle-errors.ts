import type { ApiError } from "@/lib/api";

export function buildOracleErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "statusCode" in err) {
    const statusCode = (err as ApiError).statusCode;
    if (statusCode === 401) {
      return "Your session expired. Please refresh the page to log in again.";
    }
    if (statusCode === 429) {
      return "I'm getting too many requests right now. Give me a few seconds and try again.";
    }
    if (statusCode === 503) {
      return "My AI providers are temporarily unavailable. Please try again in a moment.";
    }
    if (statusCode >= 500 && statusCode <= 599) {
      return "Something went wrong on my end. Please try again.";
    }
  }
  if (err instanceof TypeError) {
    return "I can't reach the server right now. Check your connection and try again.";
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return "That took too long. Please try again.";
  }
  return "I'm having trouble connecting right now. Try again in a moment.";
}

export function isTransientError(err: unknown): boolean {
  if (err && typeof err === "object" && "statusCode" in err) {
    const statusCode = (err as ApiError).statusCode;
    return [408, 429, 502, 503, 504].includes(statusCode);
  }
  return err instanceof TypeError;
}
