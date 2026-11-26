import Link from "next/link";

// Placeholder shapes shown by each route's loading.tsx while its Notion data loads.

export function Bone({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden style={style} className={`animate-pulse rounded-lg bg-white/[0.07] ${className}`} />;
}

function Loading({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <main className={className} aria-busy="true">
      <span className="sr-only" role="status">Loading…</span>
      {children}
    </main>
  );
}

// Weight, steps, workout and lab pages share this layout
export function LogPageSkeleton({ title, icon, mainClass = "" }: { title: string; icon?: string; mainClass?: string }) {
  return (
    <Loading className={`min-h-screen bg-gray-950 text-white p-6 md:p-10 ${mainClass}`}>
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">← Dashboard</Link>
          <h1 className="text-2xl font-bold">
            {icon && <span aria-hidden className="mr-2">{icon}</span>}
            {title}
          </h1>
        </div>
        <section className="flex flex-col gap-2">
          <Bone className="h-3 w-32" />
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
            <Bone className="h-7 w-28" />
            <Bone className="h-3 w-48" />
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <Bone className="h-3 w-40" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
              <Bone className="h-4 w-24" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-2/3" />
            </div>
          ))}
        </section>
      </div>
    </Loading>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Health Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Synced from Notion</p>
          </div>
          <Bone className="h-9 w-28 rounded-xl" />
        </div>
        <section className="flex flex-col gap-3">
          <Bone className="h-3 w-36" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
                <Bone className="h-4 w-20" />
                <Bone className="h-8 w-24" />
                <Bone className="h-3 w-16" />
              </div>
            ))}
          </div>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
              <Bone className="h-4 w-32" />
              <Bone className="h-40 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

export function FoodSkeleton() {
  return (
    <Loading className="min-h-screen bg-neutral-950 text-white px-4 pt-6 pb-32 md:px-10 md:pt-10">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <Link href="/" aria-label="Dashboard" className="h-10 w-10 -ml-2 grid place-items-center rounded-full text-neutral-400">←</Link>
          <h1 className="text-xl font-semibold">Food</h1>
        </header>
        <section className="rounded-3xl bg-gradient-to-br from-orange-500/40 via-orange-500/30 to-rose-500/30 p-5 flex flex-col gap-4 animate-pulse">
          <div className="h-4 w-48 rounded bg-white/25" />
          <div className="h-12 w-40 rounded-lg bg-white/30" />
          <div className="h-1.5 w-full rounded-full bg-white/20" />
          <div className="flex gap-6">
            <div className="h-9 w-16 rounded bg-white/20" />
            <div className="h-9 w-12 rounded bg-white/20" />
          </div>
        </section>
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 px-5 py-4 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 flex flex-col gap-2">
                <Bone className="h-4 w-2/3" />
                <Bone className="h-3 w-1/3" />
              </div>
              <Bone className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Bone className="h-3 w-16 ml-1" />
          <div className="rounded-3xl bg-neutral-900 border border-neutral-800 divide-y divide-neutral-800">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="px-5 py-4 flex flex-col gap-2">
                <div className="flex justify-between">
                  <Bone className="h-4 w-24" />
                  <Bone className="h-4 w-20" />
                </div>
                <Bone className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Loading>
  );
}

export function FoodAddSkeleton() {
  return (
    <Loading className="h-dvh bg-neutral-950 text-white flex flex-col">
      <header className="w-full max-w-xl mx-auto px-4 pt-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/food" aria-label="Back to food log" className="h-10 w-10 -ml-2 grid place-items-center rounded-full text-neutral-400">←</Link>
          <h1 className="flex-1 text-xl font-semibold">Log food</h1>
          <Bone className="h-9 w-32 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-9 w-20 rounded-full" />
          <Bone className="h-9 w-24 rounded-full" />
          <Bone className="h-9 w-28 rounded-full" />
        </div>
      </header>
      <div className="flex-1 w-full max-w-xl mx-auto px-4 pt-10 flex flex-col items-center gap-3">
        <p className="text-2xl font-semibold">What did you eat?</p>
        <Bone className="h-3 w-64" />
        <div className="w-full flex flex-wrap gap-2 pt-6">
          {[28, 24, 32, 20, 26].map((w, i) => (
            <Bone key={i} className="h-9 rounded-2xl" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
      </div>
      <div className="w-full max-w-xl mx-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Bone className="h-14 w-full rounded-full" />
      </div>
    </Loading>
  );
}
