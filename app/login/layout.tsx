import { Suspense } from "react"

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] text-white/50 text-sm">
      Loading…
    </div>
  )
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Suspense fallback={<LoginFallback />}>{children}</Suspense>
}
