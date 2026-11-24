import { t } from "@/i18n/locale"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { adminRepository } from "@/admin/adminRepository"
import type { AdminUser } from "@/api/users"

import { adminError } from "./adminPresentation"
import { adminQueryView } from "./adminQueryView"

export function useAdminUsersViewModel(sessionId: number) {
  const [page, setPage] = useState(0)
  const [selected, select] = useState<{ login: string } | "create" | null>(null)
  const query = useQuery(adminRepository.users(sessionId, page))

  function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const login = String(new FormData(event.currentTarget).get("login") ?? "")
      .trim()
      .toLowerCase()
    if (login) select({ login })
  }

  return {
    query: adminQueryView(query),
    selected,
    select,
    find,
    pagination: {
      page,
      hasNext: query.data?.hasNext ?? false,
      previous: () => setPage((current) => Math.max(0, current - 1)),
      next: () => setPage((current) => current + 1),
    },
  }
}

export function useAdminUserViewModel(sessionId: number, login: string) {
  return adminQueryView(useQuery(adminRepository.user(sessionId, login)))
}

export function useAdminUserFormViewModel(
  sessionId: number,
  user: AdminUser | null,
  onSuccess: () => void
) {
  const client = useQueryClient()
  const authorities = useQuery(adminRepository.authorities(sessionId))
  const [deleting, setDeleting] = useState(false)
  const [validation, setValidation] = useState<string | null>(null)
  const [selection, setSelection] = useState<string[] | null>(null)
  const options =
    authorities.data?.map((authority) => authority.name).sort() ?? []
  const selected =
    selection ??
    user?.authorities ??
    options.filter((name) => name === "ROLE_USER")

  const save = useMutation({
    mutationFn: (data: FormData) =>
      adminRepository.saveUser(client, sessionId, user, {
        login: String(data.get("login") ?? "").trim(),
        firstName: String(data.get("firstName") ?? "").trim() || null,
        lastName: String(data.get("lastName") ?? "").trim() || null,
        email: String(data.get("email") ?? "").trim() || null,
        activated: data.get("activated") === "yes",
        authorities: selected,
        imageUrl: user?.imageUrl ?? null,
        langKey: user?.langKey ?? null,
      }),
    onSuccess,
  })
  const remove = useMutation({
    mutationFn: (target: AdminUser) =>
      adminRepository.deleteUser(client, sessionId, target),
    onSuccess,
  })
  const pending = save.isPending || remove.isPending

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !authorities.isSuccess) return
    const data = new FormData(event.currentTarget)
    if (!String(data.get("login") ?? "").trim()) {
      setValidation("Enter a username.")
      return
    }
    setValidation(null)
    save.mutate(data)
  }

  return {
    authorities: adminQueryView(authorities),
    canSave: authorities.isSuccess && !pending,
    options,
    selected,
    deleting,
    pending,
    submit,
    error: validation ?? adminError(deleting ? remove.error : save.error),
    changeAuthority: (name: string, checked: boolean) => {
      setSelection(
        checked
          ? [...new Set([...selected, name])]
          : selected.filter((item) => item !== name)
      )
    },
    beginDelete: () => {
      remove.reset()
      setDeleting(true)
    },
    cancelDelete: () => {
      remove.reset()
      setDeleting(false)
    },
    confirmDelete: () => {
      if (!pending && user) remove.mutate(user)
    },
  }
}

export function useAuthoritiesViewModel(sessionId: number) {
  const client = useQueryClient()
  const query = useQuery(adminRepository.authorities(sessionId))
  const [target, setTarget] = useState<string | null>(null)
  const [name, setName] = useState("")
  const create = useMutation({
    mutationFn: (name: string) =>
      adminRepository.createAuthority(client, sessionId, name),
    onSuccess: () => setName(""),
  })
  const remove = useMutation({
    mutationFn: (name: string) =>
      adminRepository.deleteAuthority(client, sessionId, name),
    onSuccess: () => setTarget(null),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!create.isPending && name.trim()) create.mutate(name.trim())
  }

  return {
    query: adminQueryView(query),
    name,
    submit,
    change: (name: string) => {
      setName(name)
      create.reset()
    },
    pending: create.isPending,
    error: adminError(create.error),
    success: create.isSuccess ? t("Authority created.") : null,
    target,
    deletionPending: remove.isPending,
    deletionError: adminError(remove.error),
    chooseTarget: (name: string | null) => {
      remove.reset()
      setTarget(name)
    },
    confirmDelete: () => {
      if (target && !remove.isPending) remove.mutate(target)
    },
  }
}


