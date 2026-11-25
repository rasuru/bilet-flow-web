import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { MapSeat, SeatMapModel } from "@/events/seatMapPresentation"
import { t } from "@/i18n/locale"

export function SeatMap({ model, compact = false, disabled = false, onSelect }: { model: SeatMapModel; compact?: boolean; disabled?: boolean; onSelect?: (seat: MapSeat) => void }) {
  // Zoom is view-only state; inventory and selection stay in the view model.
  const [zoom, setZoom] = useState(1)
  const viewport = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1)
  const renderedZoom = useRef(1)
  const anchor = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const suppressClick = useRef(false)

  const changeZoom = useCallback((value: number, offsetX?: number, offsetY?: number) => {
    const element = viewport.current
    if (!element) return
    const next = Math.max(1, Math.min(5, value))
    if (next === zoomRef.current) return
    const x = offsetX ?? element.clientWidth / 2
    const y = offsetY ?? element.clientHeight / 2
    anchor.current = {
      x: (element.scrollLeft + x) / renderedZoom.current,
      y: (element.scrollTop + y) / renderedZoom.current,
      offsetX: x,
      offsetY: y,
    }
    zoomRef.current = next
    setZoom(next)
  }, [])

  useLayoutEffect(() => {
    const element = viewport.current
    renderedZoom.current = zoom
    const point = anchor.current
    if (!element || !point) return
    element.scrollLeft = point.x * zoom - point.offsetX
    element.scrollTop = point.y * zoom - point.offsetY
    anchor.current = null
  }, [zoom])

  useEffect(() => {
    const element = viewport.current
    if (compact || !element) return
    let pinch: { distance: number; zoom: number } | null = null
    const distance = (touches: TouchList) => Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    )
    const start = (event: TouchEvent) => {
      if (event.touches.length === 1) suppressClick.current = false
      if (event.touches.length !== 2) return
      suppressClick.current = true
      pinch = { distance: distance(event.touches), zoom: zoomRef.current }
      if (event.cancelable) event.preventDefault()
    }
    const move = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2 || pinch.distance === 0) return
      if (event.cancelable) event.preventDefault()
      const rect = element.getBoundingClientRect()
      changeZoom(
        pinch.zoom * distance(event.touches) / pinch.distance,
        (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left,
        (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top,
      )
    }
    const end = () => { pinch = null }
    element.addEventListener("touchstart", start, { passive: false })
    element.addEventListener("touchmove", move, { passive: false })
    element.addEventListener("touchend", end)
    element.addEventListener("touchcancel", end)
    return () => {
      element.removeEventListener("touchstart", start)
      element.removeEventListener("touchmove", move)
      element.removeEventListener("touchend", end)
      element.removeEventListener("touchcancel", end)
    }
  }, [compact, changeZoom])

  const [inspected, setInspected] = useState<string>()
  const active = model.seats.find((seat) => seat.id === inspected)
  return (
    <div className="w-full min-w-0 max-w-full space-y-2">
      {!compact && <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{model.name}</span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm" className="min-h-11 min-w-11" aria-label={t("Zoom out")} disabled={zoom <= 1} onClick={() => changeZoom(zoom / 1.5)}>−</Button>
          <Button type="button" variant="ghost" size="sm" className="min-h-11 min-w-14" onClick={() => changeZoom(1)}>{Math.round(zoom * 100)}%</Button>
          <Button type="button" variant="outline" size="sm" className="min-h-11 min-w-11" aria-label={t("Zoom in")} disabled={zoom >= 5} onClick={() => changeZoom(zoom * 1.5)}>+</Button>
        </div>
      </div>}
      <div ref={viewport} className={compact ? "w-full min-w-0 overflow-hidden rounded-lg bg-muted/50" : "w-full min-w-0 max-w-full max-h-[60dvh] overflow-auto rounded-lg border bg-muted/40 [touch-action:pan-x_pan-y]"}>
        <svg viewBox={`0 0 ${model.width} ${model.height}`} aria-hidden={compact || undefined} aria-label={compact ? undefined : model.name} className="block text-foreground" style={{ width: compact ? "100%" : `${zoom * 100}%`, maxWidth: "none", height: "auto" }}>
          {model.focus && <g><rect x={model.focus.x} y={model.focus.y} width={model.focus.width} height={model.focus.height} rx={10} fill="currentColor" opacity={.12}/><text x={model.focus.x + model.focus.width / 2} y={model.focus.y + model.focus.height / 2} dominantBaseline="central" textAnchor="middle" fill="currentColor" fontSize={20}>{model.focus.label}</text></g>}
          {model.tables.map((table) => <g key={table.label}><circle cx={table.x} cy={table.y} r={28} fill="currentColor" opacity={.12}/><text x={table.x} y={table.y} textAnchor="middle" dominantBaseline="central" fontSize={16} fill="currentColor">{table.label}</text></g>)}
          {model.seats.map((seat) => {
            const interactive = !compact && !!onSelect
            const blocked = disabled || seat.disabled
            return <g key={seat.id} transform={`translate(${seat.x} ${seat.y})`} role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined} aria-label={interactive ? seat.label : undefined} aria-pressed={interactive ? seat.selected : undefined} aria-disabled={interactive ? blocked : undefined} className={interactive ? `outline-none focus-visible:[&>circle]:stroke-foreground focus-visible:[&>circle]:stroke-[3px] ${blocked ? "cursor-not-allowed" : "cursor-pointer hover:opacity-75"}` : undefined} onPointerDown={interactive ? (event) => { if (event.pointerType === "mouse") suppressClick.current = false } : undefined} onFocus={interactive ? () => setInspected(seat.id) : undefined} onMouseEnter={interactive ? () => setInspected(seat.id) : undefined} onClick={interactive ? (event) => { if (suppressClick.current && event.detail !== 0) return; setInspected(seat.id); if (!blocked) onSelect(seat) } : undefined} onKeyDown={interactive ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!blocked) onSelect(seat) } } : undefined}>
              {!compact && <title>{seat.label}</title>}
              <circle r={model.radius + (interactive ? 3 : 0)} fill="transparent" />
              <circle r={model.radius} fill={seat.color} stroke={seat.selected ? "currentColor" : "transparent"} strokeWidth={seat.selected ? 2.5 : 1.5} />
              {!compact && <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize={model.radius * 1.15} pointerEvents="none" fontWeight="600">{seat.mark}</text>}
            </g>
          })}
        </svg>
      </div>
      {!compact && (
        <p aria-live="polite" className="min-w-0 wrap-anywhere min-h-10 rounded-md bg-muted/50 px-3 py-2 text-xs">{active?.label ?? t("Inspect a seat for its details and price.")}</p>
      )}
        <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {model.legend.map((item, index) => <span key={index} className="inline-flex min-w-0 max-w-full items-center gap-1.5 wrap-anywhere"><span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: item.color }}>{item.mark}</span>{item.label}</span>)}
        </div>
    </div>
  )
}

