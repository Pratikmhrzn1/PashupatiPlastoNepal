import { apiBaseUrl } from "@/config/env";

/**
 * Normalized API error. Every failure thrown by the http client is one of these,
 * so callers never have to deal with raw fetch TypeError vs HTTP status vs JSON parse.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Query string params. Undefined values are omitted. */
  params?: Record<string, string | number | undefined>;
}

/**
 * Single HTTP client for the whole app. All network requests go through `http`.
 * - Resolves base URL from env (mock vs live is handled by MSW, not here).
 * - Always sends JSON.
 * - Normalizes every failure into an ApiError.
 * - Auth-header interceptor hook point: add a token header in the headers block below.
 */
export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers, ...rest } = options;

  const url = new URL(apiBaseUrl() + path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        // Future auth: Authorization: `Bearer ${getToken()}`,
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    throw new ApiError(
      cause instanceof Error ? cause.message : "Network request failed",
      0, // status 0 = network-level failure (offline, DNS, CORS)
    );
  }

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      // non-JSON error body — leave undefined
    }
    const message =
      typeof errorBody === "object" && errorBody !== null && "message" in errorBody
        ? String((errorBody as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, errorBody);
  }

  // 204 No Content → return undefined-ish value
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
