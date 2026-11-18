import Link from "next/link";
import AddFoodForm from "./AddFoodForm";

export const metadata = { title: "Add Food Manually — Health Dashboard" };

export default async function ManualAddFoodPage({ searchParams }: { searchParams: Promise<{ date?: string | string[] }> }) {
  const raw = (await searchParams).date;
  const date = typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  return (
    <main className="min-h-screen bg-[#130d08] bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(245,158,11,0.16),transparent)] border-t-4 border-amber-400 text-white p-6 md:p-10">
      <div className="max-w-md mx-auto flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href={date ? `/food/add?date=${date}` : "/food/add"} className="text-stone-500 hover:text-white text-sm transition-colors">← Chat</Link>
          <h1 className="text-2xl font-bold"><span aria-hidden className="mr-2">🔥</span>Add Manually</h1>
        </div>
        <AddFoodForm initialDate={date} />
      </div>
    </main>
  );
}
