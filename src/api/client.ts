import { ApiError } from "@/api/problems"

export { ApiError, problemTypes } from "@/api/problems"
export type { ApiErrorBody, ApiFieldError } from "@/api/problems"

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "")

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  token?: string
  json?: object
  headers?: HeadersInit
}

type QueryValue = string | number | boolean | readonly string[] | undefined

export function withQuery(path: string, query: Record<string, QueryValue>) {
  const params = new URLSearchParams()

  for (const [name, value] of Object.entries(query)) {
    if (value === undefined) continue
    if (typeof value === "object") {
      for (const item of value) params.append(name, item)
    } else {
      params.set(name, String(value))
    }
  }

  const search = params.toString()
  return search ? `${path}?${search}` : path
}

async function request(
  path: string,
  options: ApiOptions = {}
): Promise<Response> {
  const { method, token, json } = options
  const headers = new Headers(options.headers)
  if (token !== undefined) headers.set("Authorization", `Bearer ${token}`)
  if (json !== undefined) headers.set("Content-Type", "application/json")

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: json === undefined ? undefined : JSON.stringify(json),
  })

  if (!response.ok) {
    // Error bodies are JSON even when the successful response is a file.
    const problem: unknown = await response.json().catch(() => undefined)
    throw new ApiError(response.status, problem)
  }

  return response
}

export async function requestJson<T>(
  path: string,
  options?: ApiOptions
): Promise<T> {
  const response = await request(path, options)
  return response.json() as Promise<T>
}

export async function requestEmpty(
  path: string,
  options?: ApiOptions
): Promise<void> {
  await request(path, options)
}

export async function requestFile(path: string, token: string): Promise<Blob> {
  return (await request(path, { token })).blob()
}

export type Page<T> = {
  items: T[]
  totalCount: number | null
  linkHeader: string | null
}

export async function requestPage<T>(
  path: string,
  token: string
): Promise<Page<T>> {
  const response = await request(path, { token })
  const count = response.headers.get("X-Total-Count")
  const total = count !== null && /^\d+$/.test(count) ? Number(count) : NaN

  return {
    items: (await response.json()) as T[],
    totalCount: Number.isSafeInteger(total) ? total : null,
    linkHeader: response.headers.get("Link"),
  }
}
