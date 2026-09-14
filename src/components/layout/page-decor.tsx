export function PageDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <span className="page-decor page-decor--tl" />
      <span className="page-decor page-decor--tr" />
      <span className="page-decor page-decor--bl" />
      <span className="page-decor page-decor--br" />
    </div>
  )
}
