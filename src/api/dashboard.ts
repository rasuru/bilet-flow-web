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
): { sold: number; capacity: number } | null {
  if (!inventory) return null

  if (inventory.inventoryKind === "GENERAL_ADMISSION") {
    const rows = inventory.gaAvailability ?? []

    if (rows.length === 0) return null

    return {
      sold: rows.reduce((sum, row) => sum + (row.sold ?? 0), 0),
      capacity: rows.reduce((sum, row) => sum + (row.totalCapacity ?? 0), 0),
    }
  }

  if (inventory.inventoryKind === "ASSIGNED_SEATING") {
    const seats = inventory.seatAvailability ?? []

    if (seats.length === 0) return null

    return {
      sold: seats.filter((seat) => seat.status === "SOLD").length,
      capacity: seats.length,
    }
  }

  return null
}

export function getOrganizerEvents(): Promise<managedEvent[]> {
  return authenticatedGet<managedEvent[]>("/api/events/mine")
}
