import { requestEmpty, requestJson, requestPage, withQuery } from "@/api/client"
import type { AccountResponse } from "@/api/auth"

type PageQuery = {
  page?: number
  size?: number
  sort?: readonly string[]
}

export type PublicUser = { id: number; login: string }

export type Authority = { name: string }

export type AdminUser = AccountResponse & {
  createdBy: string | null
  createdDate: string | null
  lastModifiedBy: string | null
  lastModifiedDate: string | null
}

export type AdminUserRequest = {
  login: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  imageUrl?: string | null
  activated?: boolean
  langKey?: string | null
  authorities?: string[]
}

type CreatedAdminUser = Omit<AdminUser, "authorities"> & {
  resetDate: string | null
}

export function listUsers(token: string, query: PageQuery = {}) {
  return requestPage<PublicUser>(withQuery("/api/users", query), token)
}

export function searchUsers(token: string, query: string) {
  return requestJson<PublicUser[]>(
    `/api/users/_search/${encodeURIComponent(query)}`,
    { token }
  )
}

export function listAdminUsers(token: string, query: PageQuery = {}) {
  return requestPage<AdminUser>(withQuery("/api/admin/users", query), token)
}

export function getAdminUser(token: string, login: string) {
  return requestJson<AdminUser>(
    `/api/admin/users/${encodeURIComponent(login)}`,
    { token }
  )
}

export function createAdminUser(token: string, json: AdminUserRequest) {
  return requestJson<CreatedAdminUser>("/api/admin/users", {
    token,
    method: "POST",
    json,
  })
}

export function updateAdminUser(
  token: string,
  json: AdminUserRequest & { id: number },
  login?: string
) {
  const path =
    login === undefined
      ? "/api/admin/users"
      : `/api/admin/users/${encodeURIComponent(login)}`
  return requestJson<AdminUser>(path, { token, method: "PUT", json })
}

export function deleteAdminUser(token: string, login: string) {
  return requestEmpty(`/api/admin/users/${encodeURIComponent(login)}`, {
    token,
    method: "DELETE",
  })
}

export function listAuthorities(token: string) {
  return requestJson<Authority[]>("/api/authorities", { token })
}

export function getAuthority(token: string, name: string) {
  return requestJson<Authority>(
    `/api/authorities/${encodeURIComponent(name)}`,
    { token }
  )
}

export function createAuthority(token: string, name: string) {
  return requestJson<Authority>("/api/authorities", {
    token,
    method: "POST",
    json: { name },
  })
}

export function deleteAuthority(token: string, name: string) {
  return requestEmpty(`/api/authorities/${encodeURIComponent(name)}`, {
    token,
    method: "DELETE",
  })
}
