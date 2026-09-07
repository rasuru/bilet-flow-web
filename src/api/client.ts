import {
  clearAuthToken,
  getAuthToken,
} from "@/auth/token"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

export type ApiFieldError = {
  objectName?: string
  field?: string
  message?: string
}

export type ApiErrorBody = {
  type?: string
  title?: string
  status?: number
  detail?: string
  message?: string
  path?: string
  errorKey?: string
  fieldErrors?: ApiFieldError[]
}

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | undefined

  constructor(
    status: number,
    message: string,
    body: ApiErrorBody | undefined
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null
}

function errorMessage(
  status: number,
  body: unknown
): string {
  if (isApiErrorBody(body)) {
    if (body.detail) {
      return body.detail
    }

    if (body.title) {
      return body.title
    }

    if (body.message) {
      return body.message
    }
  }

  return `Request failed with status ${status}`
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) {
    return undefined
  }

  const contentType = response.headers.get("content-type")

  if (
    contentType?.includes("application/json") ||
    contentType?.includes("application/problem+json")
  ) {
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  }

  return text
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  const body = await readBody(response)

  if (!response.ok) {
    const errorBody = isApiErrorBody(body) ? body : undefined

    throw new ApiError(
      response.status,
      errorMessage(response.status, body),
      errorBody
    )
  }

  return body as T
}

export async function authenticatedApiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()

  if (!token) {
    throw new ApiError(
      401,
      "Authentication required",
      undefined
    )
  }

  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)

  try {
    return await apiRequest<T>(path, {
      ...init,
      headers,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthToken()
    }

    throw error
  }
}