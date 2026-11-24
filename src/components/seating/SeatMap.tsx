import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { MapSeat, SeatMapModel } from "@/events/seatMapPresentation"
import { t } from "@/i18n/locale"

export function SeatMap({ model, compact = false, disabled = false, onSelect }: { model: SeatMapModel; compact?: boolean; disabled?: boolean; onSelect?: (seat: MapSeat) => void }) {
  // Zoom is view-only state; inventory and selection stay in the view model.
  const [zoom, setZoom] = useState(1)
  const [inspected, setInspected] = useState<string>()
  const active = model.seats.find((seat) => seat.id === inspected)
  return (
    <div className="min-w-0 space-y-2">
      {!compact && <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{model.name}</span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm" aria-label={t("Zoom out")} disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - .5))}>−</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</Button>
          <Button type="button" variant="outline" size="sm" aria-label={t("Zoom in")} disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + .5))}>+</Button>
        </div>
      </div>}
      <div className={compact ? "overflow-hidden rounded-lg bg-muted/50" : "max-h-[65vh] overflow-auto rounded-lg border bg-muted/40"}>
        <svg viewBox={`0 0 ${model.width} ${model.height}`} aria-hidden={compact || undefined} aria-label={compact ? undefined : model.name} className="block text-foreground" style={{ width: compact ? "100%" : `${zoom * 100}%`, minWidth: compact ? undefined : 600 * zoom }}>
          {model.focus && <g><rect x={model.focus.x} y={model.focus.y} width={model.focus.width} height={model.focus.height} rx={10} fill="currentColor" opacity={.12}/><text x={model.focus.x + model.focus.width / 2} y={model.focus.y + model.focus.height / 2} dominantBaseline="central" textAnchor="middle" fill="currentColor" fontSize={20}>{model.focus.label}</text></g>}
          {model.tables.map((table) => <g key={table.label}><circle cx={table.x} cy={table.y} r={28} fill="currentColor" opacity={.12}/><text x={table.x} y={table.y} textAnchor="middle" dominantBaseline="central" fontSize={16} fill="currentColor">{table.label}</text></g>)}
          {model.seats.map((seat) => {
            const interactive = !compact && !!onSelect
            const blocked = disabled || seat.disabled
            return <g key={seat.id} transform={`translate(${seat.x} ${seat.y})`} role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined} aria-label={interactive ? seat.label : undefined} aria-pressed={interactive ? seat.selected : undefined} aria-disabled={interactive ? blocked : undefined} className={interactive ? `outline-none focus-visible:[&>circle]:stroke-foreground focus-visible:[&>circle]:stroke-[3px] ${blocked ? "cursor-not-allowed" : "cursor-pointer hover:opacity-75"}` : undefined} onFocus={interactive ? () => setInspected(seat.id) : undefined} onMouseEnter={interactive ? () => setInspected(seat.id) : undefined} onClick={interactive ? () => { setInspected(seat.id); if (!blocked) onSelect(seat) } : undefined} onKeyDown={interactive ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!blocked) onSelect(seat) } } : undefined}>
              {!compact && <title>{seat.label}</title>}
              <circle r={model.radius + (interactive ? 3 : 0)} fill="transparent" />
              <circle r={model.radius} fill={seat.color} stroke={seat.selected ? "currentColor" : "transparent"} strokeWidth={seat.selected ? 2.5 : 1.5} />
              {!compact && <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize={model.radius * 1.15} pointerEvents="none" fontWeight="600">{seat.mark}</text>}
            </g>
          })}
        </svg>
      </div>
      {!compact && (
        <p aria-live="polite" className="min-h-10 rounded-md bg-muted/50 px-3 py-2 text-xs">{active?.label ?? t("Inspect a seat for its details and price.")}</p>
      )}
        <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {model.legend.map((item, index) => <span key={index} className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: item.color }}>{item.mark}</span>{item.label}</span>)}
        </div>
    </div>
  )
}

