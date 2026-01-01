export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super("Request failed");
    this.status = status;
    this.data = data;
  }
}

let refreshPromise: Promise<void> | null = null;

async function refreshTokens(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new ApiError(res.status, null);
        }
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

type ApiFetchOptions = RequestInit & {
  json?: unknown;
  retry?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { json, retry = true, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (json !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api${path}`, {
    ...rest,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "include",
    headers: requestHeaders,
  });

  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    await refreshTokens();
    return apiFetch<T>(path, { ...options, retry: false });
  }

  const data = await parseJson(response);
  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (typeof error.data === "string") {
      return error.data;
    }
    if (error.data && typeof error.data === "object" && "message" in error.data) {
      const message = (error.data as { message?: string | string[] }).message;
      if (Array.isArray(message)) {
        return message.join(", ");
      }
      if (message) {
        return message;
      }
    }
    return "Something went wrong. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}
