/** Pass `hidden md:flex` / `md:hidden` to choose the breakpoint; `hidden` wins over `flex` in Tailwind's order. */
export function LiveBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-1 text-[11px] font-bold tracking-wider text-signal ${className}`}>
      <span aria-hidden className="pulse-dot">
        ●
      </span>
      LIVE
    </span>
  )
}
