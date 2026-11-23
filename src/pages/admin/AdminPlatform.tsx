import { Plus } from "lucide-react"
import { useState } from "react"

import type { AdminUser } from "@/api/users"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  ActionFeedback,
  AdminDialog,
  AdminTable,
  FilterInput,
  QueryContent,
  RecordButton,
  RecordId,
  StatusBadge,
} from "./AdminUi"
import {
  useAdminUserFormViewModel,
  useAdminUserViewModel,
  useAdminUsersViewModel,
  useAuthoritiesViewModel,
} from "./usePlatformViewModels"

export function AdminUsers({ sessionId }: { sessionId: number }) {
  const model = useAdminUsersViewModel(sessionId)
  const selected = model.selected

  return (
    <>
      <Card className="px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form
            className="flex flex-1 flex-wrap items-end gap-3 sm:max-w-md"
            onSubmit={model.find}
          >
            <FilterInput
              id="find-user"
              label="Username"
              name="login"
              required
              maxLength={50}
            />
            <Button type="submit" variant="outline">
              Find user
            </Button>
          </form>
          <Button onClick={() => model.select("create")}>
            <Plus aria-hidden="true" /> New user
          </Button>
        </div>
      </Card>
      <AdminTable
        caption="Users"
        columns={["User", "Email", "Status", "Authorities", ""]}
        state={model.query}
        items={model.query.data?.items ?? []}
        rowKey={(user) => user.id}
        pagination={model.pagination}
        empty="No users on this page."
        cells={(user) => [
          <div className="min-w-24">
            <div className="font-medium">{user.login}</div>
            <RecordId value={user.id} />
          </div>,
          user.email ?? "—",
          <StatusBadge value={user.activated ? "ACTIVE" : "INACTIVE"} />,
          <span className="text-xs text-muted-foreground">
            {user.authorities.join(", ") || "—"}
          </span>,
          <RecordButton onClick={() => model.select({ login: user.login })}>
            Manage user
          </RecordButton>,
        ]}
      />
      {selected === "create" && (
        <UserFormDialog
          sessionId={sessionId}
          user={null}
          onClose={() => model.select(null)}
        />
      )}
      {selected && selected !== "create" && (
        <UserDetails
          key={selected.login}
          sessionId={sessionId}
          login={selected.login}
          onClose={() => model.select(null)}
        />
      )}
    </>
  )
}

function UserDetails({
  sessionId,
  login,
  onClose,
}: {
  sessionId: number
  login: string
  onClose: () => void
}) {
  const query = useAdminUserViewModel(sessionId, login)
  if (query.data)
    return (
      <UserFormDialog
        sessionId={sessionId}
        user={query.data}
        onClose={onClose}
      />
    )
  return (
    <AdminDialog title="User details" onClose={onClose}>
      <QueryContent state={query}>{null}</QueryContent>
    </AdminDialog>
  )
}

function UserFormDialog({
  sessionId,
  user,
  onClose,
}: {
  sessionId: number
  user: AdminUser | null
  onClose: () => void
}) {
  const model = useAdminUserFormViewModel(sessionId, user, onClose)
  return (
    <AdminDialog
      title={user ? `Manage ${user.login}` : "New user"}
      description={
        user
          ? undefined
          : "BiletFlow sends the user an email to set their password."
      }
      pending={model.pending}
      onClose={onClose}
    >
      {model.deleting ? (
        <div className="space-y-3">
          <p className="text-sm">
            Permanently delete the account <strong>{user?.login}</strong>?
          </p>
          <ActionFeedback error={model.error} />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={model.pending}
              onClick={model.cancelDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={model.pending}
              onClick={model.confirmDelete}
            >
              {model.pending ? "Deleting…" : "Delete user"}
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={model.submit}>
          <fieldset
            disabled={model.pending}
            className="grid gap-3 sm:grid-cols-2"
          >
            <FilterInput
              id="user-login"
              label="Username"
              name="login"
              defaultValue={user?.login}
              required
              maxLength={50}
            />
            <FilterInput
              id="user-email"
              label="Email"
              name="email"
              type="email"
              defaultValue={user?.email ?? ""}
              required={!user || Boolean(user.email)}
              maxLength={254}
            />
            <FilterInput
              id="user-first"
              label="First name"
              name="firstName"
              defaultValue={user?.firstName ?? ""}
              maxLength={50}
            />
            <FilterInput
              id="user-last"
              label="Last name"
              name="lastName"
              defaultValue={user?.lastName ?? ""}
              maxLength={50}
            />
            {user && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="user-active"
                  name="activated"
                  value="yes"
                  defaultChecked={user.activated}
                />
                <FieldLabel htmlFor="user-active">Account activated</FieldLabel>
              </div>
            )}
          </fieldset>
          <fieldset className="space-y-2" disabled={model.pending}>
            <legend className="text-sm font-medium">Authorities</legend>
            <QueryContent state={model.authorities}>
              {model.options.length ? (
                <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
                  {model.options.map((name, index) => (
                    <div className="flex min-w-0 items-center gap-2" key={name}>
                      <Checkbox
                        id={`user-role-${index}`}
                        checked={model.selected.includes(name)}
                        onCheckedChange={(checked) =>
                          model.changeAuthority(name, checked === true)
                        }
                      />
                      <FieldLabel
                        htmlFor={`user-role-${index}`}
                        className="break-all"
                      >
                        {name}
                      </FieldLabel>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No authorities available.
                </p>
              )}
            </QueryContent>
          </fieldset>
          <ActionFeedback error={model.error} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {user && (
              <Button
                type="button"
                variant="destructive"
                disabled={model.pending}
                onClick={model.beginDelete}
              >
                Delete user
              </Button>
            )}
            <Button className="ml-auto" type="submit" disabled={!model.canSave}>
              {model.pending
                ? "Saving…"
                : user
                  ? "Save changes"
                  : "Create user"}
            </Button>
          </div>
        </form>
      )}
    </AdminDialog>
  )
}

export function AdminAuthorities({ sessionId }: { sessionId: number }) {
  const model = useAuthoritiesViewModel(sessionId)
  const [showForm, setShowForm] = useState(false)
  return (
    <>
      <Card className="px-4">
        {showForm ? (
          <form onSubmit={model.submit} className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <Field className="flex-1 basis-48">
                <FieldLabel htmlFor="new-authority">Authority name</FieldLabel>
                <Input
                  id="new-authority"
                  value={model.name}
                  onChange={(event) => model.change(event.currentTarget.value)}
                  required
                  maxLength={50}
                  pattern="[A-Za-z0-9_.\-]+"
                  disabled={model.pending}
                  placeholder="ROLE_EXAMPLE"
                />
              </Field>
              <Button type="submit" disabled={model.pending}>
                {model.pending ? "Creating…" : "Create authority"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={model.pending}
                onClick={() => setShowForm(false)}
              >
                Close
              </Button>
            </div>
            <ActionFeedback error={model.error} success={model.success} />
          </form>
        ) : (
          <Button className="self-start" onClick={() => setShowForm(true)}>
            <Plus aria-hidden="true" /> New authority
          </Button>
        )}
      </Card>
      <AdminTable
        caption="Authorities"
        columns={["Authority", ""]}
        state={model.query}
        items={model.query.data ?? []}
        rowKey={(item) => item.name}
        empty="No authorities are configured."
        cells={(item) => [
          <RecordId value={item.name} />,
          <Button
            variant="destructive"
            size="sm"
            onClick={() => model.chooseTarget(item.name)}
          >
            Delete authority
          </Button>,
        ]}
      />
      {model.target && (
        <AdminDialog
          title="Delete authority"
          description={`Permanently delete ${model.target}?`}
          onClose={() => model.chooseTarget(null)}
          pending={model.deletionPending}
        >
          <ActionFeedback error={model.deletionError} />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={model.deletionPending}
              onClick={() => model.chooseTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={model.deletionPending}
              onClick={model.confirmDelete}
            >
              {model.deletionPending ? "Deleting…" : "Delete authority"}
            </Button>
          </div>
        </AdminDialog>
      )}
    </>
  )
}
