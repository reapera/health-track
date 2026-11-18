import Link from "next/link";
import FoodChat from "./FoodChat";

// Applies to the Server Actions called from this page (the Gemini request)
export const maxDuration = 60;

export const metadata = { title: "Add Food — Health Dashboard" };

export default async function AddFoodPage({ searchParams }: { searchParams: Promise<{ date?: string | string[] }> }) {
  const raw = (await searchParams).date;
  const date = typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  return (
    <main className="h-dvh bg-[#130d08] bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(245,158,11,0.16),transparent)] border-t-4 border-amber-400 text-white flex flex-col">
      <div className="w-full max-w-xl mx-auto flex flex-col flex-1 min-h-0 px-4 pt-6 md:pt-10">
        <div className="flex items-center gap-4 pb-4">
          <Link href="/food" className="text-stone-500 hover:text-white text-sm transition-colors">← Food Log</Link>
          <h1 className="text-2xl font-bold"><span aria-hidden className="mr-2">🔥</span>Add Food</h1>
          <Link href={date ? `/food/add/manual?date=${date}` : "/food/add/manual"} className="ml-auto text-stone-500 hover:text-white text-sm transition-colors">Manual entry</Link>
        </div>
        <FoodChat initialDate={date} />
      </div>
    </main>
  );
}
