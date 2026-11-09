const biletFlowProblems =
  "https://github.com/rasuru/bilet-flow/blob/main/docs/api-errors.md#"
const jhipsterProblems = "https://www.jhipster.tech/problem/"

export const problemTypes = {
  validation: `${jhipsterProblems}constraint-violation`,
  emailAlreadyUsed: `${jhipsterProblems}email-already-used`,
  loginAlreadyUsed: `${jhipsterProblems}login-already-used`,
  invalidPassword: `${jhipsterProblems}invalid-password`,
  malformedRequest: `${biletFlowProblems}malformed-request`,
  invalidCredentials: `${biletFlowProblems}invalid-credentials`,
  accountNotActivated: `${biletFlowProblems}account-not-activated`,
  invalidActivationKey: `${biletFlowProblems}invalid-activation-key`,
  invalidPasswordResetKey: `${biletFlowProblems}invalid-password-reset-key`,
  checkoutIdempotencyConflict: `${biletFlowProblems}checkout-idempotency-conflict`,
  registrationClosed: `${biletFlowProblems}registration-closed`,
  mixedSeatingModes: `${biletFlowProblems}mixed-seating-modes`,
  inventoryUnavailable: `${biletFlowProblems}inventory-unavailable`,
  paymentProviderUnavailable: `${biletFlowProblems}payment-provider-unavailable`,
  ticketNotFound: `${biletFlowProblems}ticket-not-found`,
  ticketCheckInStateConflict: `${biletFlowProblems}ticket-check-in-state-conflict`,
  concurrentUpdate: `${biletFlowProblems}concurrent-update`,
} as const

const problemMessages: ReadonlyMap<string, string> = new Map([
  [problemTypes.validation, "Check the information you entered and try again."],
  [problemTypes.emailAlreadyUsed, "This email address is already in use."],
  [problemTypes.loginAlreadyUsed, "This username is already in use."],
  [problemTypes.invalidPassword, "The current password is incorrect."],
  [problemTypes.malformedRequest, "The request could not be read."],
  [problemTypes.invalidCredentials, "The username or password is incorrect."],
  [
    problemTypes.accountNotActivated,
    "Activate your account using the link in your email before signing in.",
  ],
  [
    problemTypes.invalidActivationKey,
    "This activation link is invalid or has already been used.",
  ],
  [
    problemTypes.invalidPasswordResetKey,
    "This password reset link is invalid or has expired.",
  ],
  [
    problemTypes.checkoutIdempotencyConflict,
    "This checkout key was already used for a different purchase.",
  ],
  [problemTypes.registrationClosed, "Registration for this event is closed."],
  [
    problemTypes.mixedSeatingModes,
    "Choose either assigned seats or general admission for this checkout.",
  ],
  [
    problemTypes.inventoryUnavailable,
    "Some of your selected tickets are no longer available.",
  ],
  [
    problemTypes.paymentProviderUnavailable,
    "The payment provider is temporarily unavailable.",
  ],
  [problemTypes.ticketNotFound, "No ticket matches that ID or code."],
  [
    problemTypes.ticketCheckInStateConflict,
    "The current ticket status prevents this check-in action.",
  ],
  [
    problemTypes.concurrentUpdate,
    "This item changed. Refresh it and try again.",
  ],
])

const statusMessages: ReadonlyMap<number, string> = new Map([
  [400, "The server could not accept this request."],
  [401, "Sign in to continue."],
  [403, "You do not have permission to do this."],
  [404, "The requested item could not be found."],
  [409, "This action conflicts with the current state."],
  [422, "Check the information you entered and try again."],
  [429, "Too many requests. Try again in a moment."],
])

export type ApiFieldError = {
  field: string
  message: string
  code?: string
  objectName?: string
}

export type ApiErrorBody = {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  message?: string
  path?: string
  errorKey?: string
  params?: unknown
  fieldErrors: ApiFieldError[]
  unavailableSeatIds?: string[]
  ticketStatus?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function parseFieldErrors(value: unknown): ApiFieldError[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry: unknown) => {
    if (
      !isRecord(entry) ||
      typeof entry.field !== "string" ||
      typeof entry.message !== "string"
    ) {
      return []
    }

    return [
      {
        field: entry.field,
        message: entry.message,
        code: readString(entry.code),
        objectName: readString(entry.objectName),
      },
    ]
  })
}

function parseProblem(value: unknown): ApiErrorBody | undefined {
  if (!isRecord(value)) return undefined

  return {
    type: readString(value.type),
    title: readString(value.title),
    status: typeof value.status === "number" ? value.status : undefined,
    detail: readString(value.detail),
    instance: readString(value.instance),
    message: readString(value.message),
    path: readString(value.path),
    errorKey: readString(value.errorKey),
    params: value.params,
    fieldErrors: parseFieldErrors(value.fieldErrors),
    unavailableSeatIds: Array.isArray(value.unavailableSeatIds)
      ? value.unavailableSeatIds.filter(
          (id): id is string => typeof id === "string"
        )
      : undefined,
    ticketStatus: readString(value.ticketStatus),
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | undefined

  constructor(status: number, payload: unknown) {
    const body = parseProblem(payload)
    const message = body?.type && problemMessages.get(body.type)
    super(
      message ||
        statusMessages.get(status) ||
        (status >= 500
          ? "The service is temporarily unavailable."
          : `Request failed with status ${status}.`)
    )
    this.name = "ApiError"
    this.status = status
    this.body = body
  }

  get type() {
    return this.body?.type
  }

  get fieldErrors(): readonly ApiFieldError[] {
    return this.body?.fieldErrors ?? []
  }
}
