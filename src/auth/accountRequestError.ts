import { ApiError, problemTypes } from "@/api/client"

type AccountFieldError = {
  field: string
  message: string
  code?: string
}

export class AccountRequestError extends Error {
  readonly fieldErrors: readonly AccountFieldError[]
  readonly duplicateField: "email" | "login" | undefined

  constructor(error: ApiError) {
    super(error.message, { cause: error })
    this.name = "AccountRequestError"
    this.fieldErrors = error.fieldErrors
    this.duplicateField =
      error.type === problemTypes.emailAlreadyUsed
        ? "email"
        : error.type === problemTypes.loginAlreadyUsed
          ? "login"
          : undefined
  }
}

export async function accountRequest<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (error) {
    throw error instanceof ApiError ? new AccountRequestError(error) : error
  }
}
