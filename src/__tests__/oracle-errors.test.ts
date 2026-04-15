import { buildOracleErrorMessage } from "@/lib/oracle-errors";

class MockApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

describe("buildOracleErrorMessage", () => {
  it("returns session-expired message for 401", () => {
    expect(buildOracleErrorMessage(new MockApiError("Unauthorized", 401))).toBe(
      "Your session expired. Please refresh the page to log in again."
    );
  });

  it("returns rate-limit message for 429", () => {
    expect(buildOracleErrorMessage(new MockApiError("Too Many Requests", 429))).toBe(
      "I'm getting too many requests right now. Give me a few seconds and try again."
    );
  });

  it("returns provider-unavailable message for 503", () => {
    expect(buildOracleErrorMessage(new MockApiError("Service Unavailable", 503))).toBe(
      "My AI providers are temporarily unavailable. Please try again in a moment."
    );
  });

  it("returns network message for TypeError", () => {
    expect(buildOracleErrorMessage(new TypeError("Failed to fetch"))).toBe(
      "I can't reach the server right now. Check your connection and try again."
    );
  });

  it("returns timeout message for AbortError", () => {
    expect(buildOracleErrorMessage(new DOMException("Aborted", "AbortError"))).toBe(
      "That took too long. Please try again."
    );
  });

  it("returns default message for unknown errors", () => {
    expect(buildOracleErrorMessage(new Error("Something else"))).toBe(
      "I'm having trouble connecting right now. Try again in a moment."
    );
  });
});
