export default function Loading() {
  return (
    <main className="page-loading" role="status" aria-live="polite" aria-busy="true">
      <span className="route-spinner" aria-hidden="true" />
      <span>Loading your workspace…</span>
    </main>
  )
}
