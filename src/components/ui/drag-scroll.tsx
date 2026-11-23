import { useRef } from "react"

export function DragScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef({ x: 0, scrollLeft: 0 })

  return (
    <div
      ref={ref}
      className="cursor-grab overflow-x-auto select-none hover:scrollbar-thin active:cursor-grabbing [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block"
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return

        const el = e.currentTarget
        drag.current = { x: e.clientX, scrollLeft: el.scrollLeft }
        el.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        const el = e.currentTarget
        if (!el.hasPointerCapture(e.pointerId)) return

        el.scrollLeft = drag.current.scrollLeft - (e.clientX - drag.current.x)
      }}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
      }}
    >
      {children}
    </div>
  )
}
