type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  searchParams?: Record<string, string | number | boolean | undefined>;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9999";

const buildUrl = (base: string, path: string, searchParams?: RequestOptions["searchParams"]) => {
  const clean = [base.replace(/\/+$/, ""), path.replace(/^\/+/, "")].filter(Boolean).join("/");
  const url = new URL(clean);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v === undefined) return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
};

export class BaseApi {
  private readonly basePath: string;

  constructor(basePath: string = "") {
    this.basePath = basePath;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const { path, method = "GET", body, token, headers, searchParams } = options;
    const url = buildUrl(API_URL, `${this.basePath}/${path}`, searchParams);

    const init: RequestInit = {
      method,
      headers: {
        ...(headers ?? {}),
      },
    };

    if (token) {
      init.headers = { ...init.headers, Authorization: `Bearer ${token}` };
    }

    if (body !== undefined) {
      init.headers = { ...init.headers, "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `Request failed with status ${res.status}`);
    }
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  get<T>(path: string, options?: Omit<RequestOptions, "path" | "method" | "body">) {
    return this.request<T>({ path, method: "GET", ...(options ?? {}) });
  }

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "path" | "method" | "body">) {
    return this.request<T>({ path, method: "POST", body, ...(options ?? {}) });
  }

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "path" | "method" | "body">) {
    return this.request<T>({ path, method: "PUT", body, ...(options ?? {}) });
  }

  delete<T>(path: string, options?: Omit<RequestOptions, "path" | "method" | "body">) {
    return this.request<T>({ path, method: "DELETE", ...(options ?? {}) });
  }
}
