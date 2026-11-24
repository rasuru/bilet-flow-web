import { ApiError, requestJson } from "@/api/client"
import { getAuthToken } from "@/auth/token"

export type APIEventStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "CANCELLED"

export interface managedEvent {
  id: string
  title?: string
  description?: string
  category?: string
  imageUrl?: string
  status?: APIEventStatus
  visibility?: "PUBLIC" | "UNLISTED" | "PRIVATE"
  startAt?: string
  endAt?: string
  venue?: {
    name?: string
    address?: string
    totalCapacity?: number
    seatingMode?: "GENERAL_ADMISSION" | "ASSIGNED_SEATING"
  }
}

export interface GaAvailabilityView {
  ticketTypeId?: string
  totalCapacity?: number
  reserved?: number
  sold?: number
  available?: number
}

export interface SeatAvailabilityView {
  seatId?: string
  status?: "AVAILABLE" | "HELD" | "SOLD"
}

export interface EventInventoryView {
  inventoryKind?: "GENERAL_ADMISSION" | "ASSIGNED_SEATING"
  gaAvailability?: GaAvailabilityView[]
  seatAvailability?: SeatAvailabilityView[]
}

async function authenticatedGet<T>(path: string): Promise<T> {
  const token = getAuthToken()

  if (!token) {
    throw new Error("You must be signed in.")
  }

  return requestJson<T>(path, { token })
}
export async function getEventInventory(
  eventId: string
): Promise<EventInventoryView | null> {
  try {
    return await authenticatedGet<EventInventoryView>(
      `/api/events/${encodeURIComponent(eventId)}/inventory`
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }

    throw error
  }
}


export function getInventoryTotals(
  inventory: EventInventoryView | null | undefined
): {
  sold: number
  capacity: number
  remaining: number | null
  reserved: number | null
  percentageSold: number | null
} | null {
  if (!inventory) return null

  let sold: number
  let capacity: number
  let remaining: number | null
  let reserved: number | null

  if (inventory.inventoryKind === "GENERAL_ADMISSION") {
    const rows = inventory.gaAvailability ?? []

    if (rows.length === 0) return null

    if (rows.some((row) => row.sold == null || row.totalCapacity == null)) {
      return null
    }

    sold = rows.reduce((sum, row) => sum + row.sold!, 0)

    capacity = rows.reduce((sum, row) => sum + row.totalCapacity!, 0)

    reserved = rows.every((row) => row.reserved != null)
      ? rows.reduce((sum, row) => sum + row.reserved!, 0)
      : null

    if (rows.every((row) => row.available != null)) {
      remaining = rows.reduce((sum, row) => sum + row.available!, 0)
    } else if (reserved !== null) {
      remaining = Math.max(0, capacity - sold - reserved)
    } else {
      remaining = null
    }
  } else if (inventory.inventoryKind === "ASSIGNED_SEATING") {
    const seats = inventory.seatAvailability ?? []

    if (seats.length === 0) return null

    if (
      seats.some(
        (seat) =>
          seat.status !== "AVAILABLE" &&
          seat.status !== "HELD" &&
          seat.status !== "SOLD"
      )
    ) {
      return null
    }

    capacity = seats.length

    sold = seats.filter((seat) => seat.status === "SOLD").length

    reserved = seats.filter((seat) => seat.status === "HELD").length

    remaining = seats.filter((seat) => seat.status === "AVAILABLE").length
  } else {
    return null
  }

  const percentageSold =
    capacity > 0 ? Math.round((sold / capacity) * 1000) / 10 : null

  return {
    sold,
    capacity,
    remaining,
    reserved,
    percentageSold,
  }
}

export function getOrganizerEvents(): Promise<managedEvent[]> {
  return authenticatedGet<managedEvent[]>("/api/events/mine")
}
