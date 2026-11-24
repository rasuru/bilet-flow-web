import type { VenueLayout } from "@/api/events"
import type { SeatAvailability } from "@/api/inventory"
import { t } from "@/i18n/locale"

const palette = ["#2563eb", "#7c3aed", "#0f766e", "#b45309", "#be185d"]
const categoryColors: Record<string, string> = {
  PREMIUM: "#7c3aed", STANDARD: "#2563eb", ECONOMY: "#0f766e",
}
const states = { HELD: "Held", SOLD: "Sold", UNAVAILABLE: "Unavailable", SELECTED: "Selected", AVAILABLE: "Available" } as const
const stateColors = { HELD: "#b45309", SOLD: "#64748b", UNAVAILABLE: "#94a3b8", SELECTED: "#15803d" }
export type MapSeat = {
  id: string; x: number; y: number; label: string; location: string; number: string;
  color: string; mark: string; selected: boolean; disabled: boolean;
  ticketTypeId?: string
}
export type SeatMapModel = {
  width: number; height: number; radius: number; seats: MapSeat[];
  focus: VenueLayout["focus"]; tables: { x: number; y: number; label: string }[];
  legend: { label: string; color: string; mark: string }[]; name: string
}
export type LayoutPreview = { id: string; name: string; capacityLabel: string; categoryLabel: string; map: SeatMapModel }
type Ticket = { id: string; priceCategory: string | null; name: string; price: string; orderLimit: number; seats: { id: string }[] | null }
type Draft = Record<string, { seatId: string }[]>

function geometry(layout: VenueLayout) {
  const positioned = layout.seats.every((seat) => typeof seat.x === "number" && typeof seat.y === "number")
  const groups = new Map<string, typeof layout.seats>()
  for (const seat of layout.seats) {
    const key = `${seat.section}\0${seat.row}`
    groups.set(key, [...(groups.get(key) ?? []), seat])
  }
  const positions = new Map<string, { x: number; y: number }>()
  let maxColumns = 0
  let row = 0
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i++) {
      const seat = group[i]
      positions.set(seat.seatId, { x: 28 + (i % 18) * 36, y: 35 + (row + Math.floor(i / 18)) * 36 })
    }
    maxColumns = Math.max(maxColumns, Math.min(group.length, 18))
    row += Math.ceil(group.length / 18)
  }
  const width = positioned ? layout.width ?? 800 : Math.max(180, maxColumns * 36 + 20)
  const height = positioned ? layout.height ?? 600 : Math.max(100, row * 36 + 30)
  const points = layout.seats.map((seat) => ({ ...seat, ...(positioned ? { x: seat.x!, y: seat.y! } : positions.get(seat.seatId)!) }))
  let distance = 26
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)
    if (d > 0) distance = Math.min(distance, d)
  }
  const tables = positioned ? Array.from(new Set(points.map((seat) => seat.section))).filter((name) => /^TABLE /i.test(name)).map((name) => {
    const seats = points.filter((seat) => seat.section === name)
    return { x: seats.reduce((sum, seat) => sum + seat.x, 0) / seats.length, y: seats.reduce((sum, seat) => sum + seat.y, 0) / seats.length, label: name.replace(/^TABLE /i, "") }
  }) : []
  return { width, height, radius: Math.max(3, distance * .36), points, tables, focus: positioned && layout.focus ? { ...layout.focus, label: t(layout.focus.label) } : null }
}

export function buildSeatMap(layout: VenueLayout, availability?: SeatAvailability[], tickets: Ticket[] = [], draft: Draft = {}): SeatMapModel {
  const { points, ...base } = geometry(layout)
  const preview = availability === undefined
  const statuses = new Map(availability?.map((seat) => [seat.seatId, seat.status]))
  const selected = new Set(Object.values(draft).flat().map((seat) => seat.seatId))
  const categories = Array.from(new Set(points.map((seat) => seat.priceCategory ?? ""))).sort()
  const colorFor = (category: string) => categoryColors[category] ?? palette[categories.indexOf(category) % palette.length]
  const legend = categories.map((category) => {
    const ticket = tickets.find((item) => item.priceCategory === category)
    return { label: ticket ? `${ticket.name} · ${ticket.price}` : t(category || "Uncategorized"), color: colorFor(category), mark: "" }
  })
  if (!preview) legend.push(...(["SELECTED", "HELD", "SOLD", "UNAVAILABLE"] as const).map((state) => ({ label: t(states[state]), color: stateColors[state], mark: { SELECTED: "✓", HELD: "–", SOLD: "×", UNAVAILABLE: "·" }[state] })))
  const seats = points.map((seat): MapSeat => {
    const category = seat.priceCategory ?? ""
    const matching = tickets.filter((item) => item.priceCategory === category && item.seats?.some((s) => s.id === seat.seatId))
    const ticket = matching.find((item) => item.orderLimit > 0) ?? matching[0]
    const raw = statuses.get(seat.seatId)
    const isSelected = selected.has(seat.seatId)
    const eligible = !!ticket && ticket.orderLimit > 0
    const atLimit = !!ticket && ((draft[ticket.id]?.length ?? 0) >= ticket.orderLimit || selected.size >= 100)
    const status = preview ? "AVAILABLE" : raw === "HELD" || raw === "SOLD" ? raw : raw === "AVAILABLE" && eligible ? isSelected ? "SELECTED" : "AVAILABLE" : "UNAVAILABLE"
    const location = t("{0} · Row {1} · Seat {2}", seat.section, seat.row, seat.seatNumber)
    const label = [location, ticket ? `${ticket.name} · ${ticket.price}` : t(category || "Uncategorized"), preview ? "" : t(states[status]), !preview && atLimit && !isSelected ? t("Order limit reached") : ""].filter(Boolean).join(" · ")
    return { id: seat.seatId, x: seat.x, y: seat.y, number: seat.seatNumber, location, label, selected: isSelected, disabled: preview || (!isSelected && (status !== "AVAILABLE" || atLimit)), color: status === "AVAILABLE" ? colorFor(category) : stateColors[status], mark: status === "SELECTED" ? "✓" : status === "HELD" ? "–" : status === "SOLD" ? "×" : status === "UNAVAILABLE" ? "·" : seat.seatNumber, ticketTypeId: ticket?.id }
  })
  return { ...base, name: t(layout.name), seats, legend }
}

export function buildLayoutPreview(layout: VenueLayout): LayoutPreview {
  return { id: layout.layoutId, name: t(layout.name), capacityLabel: t("{0} seats", layout.seats.length), categoryLabel: `${t("{0} price categories", new Set(layout.seats.map((seat) => seat.priceCategory).filter(Boolean)).size)}`, map: buildSeatMap(layout) }
}

