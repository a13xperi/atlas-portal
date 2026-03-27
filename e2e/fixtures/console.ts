import { Page } from "@playwright/test";

export interface CapturedError {
  type: "console-error" | "page-error" | "request-failure";
  message: string;
  url?: string;
}

/**
 * Attaches listeners to capture console errors, uncaught exceptions,
 * and failed network requests. Returns an array of captured errors
 * that tests can assert on or include in bug reports.
 */
export function captureErrors(page: Page): CapturedError[] {
  const errors: CapturedError[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push({
        type: "console-error",
        message: msg.text(),
        url: page.url(),
      });
    }
  });

  page.on("pageerror", (error) => {
    errors.push({
      type: "page-error",
      message: error.message,
      url: page.url(),
    });
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push({
        type: "request-failure",
        message: `${response.status()} ${response.statusText()} - ${response.url()}`,
        url: page.url(),
      });
    }
  });

  return errors;
}
