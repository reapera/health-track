import Link from "next/link";
import FoodChat from "./FoodChat";

export const metadata = { title: "Add Food — Health Dashboard" };

export default function AddFoodPage() {
  return (
    <main className="h-dvh bg-gray-950 text-white flex flex-col">
      <div className="w-full max-w-xl mx-auto flex flex-col flex-1 min-h-0 px-4 pt-6 md:pt-10">
        <div className="flex items-center gap-4 pb-4">
          <Link href="/food" className="text-gray-500 hover:text-white text-sm transition-colors">← Food Log</Link>
          <h1 className="text-2xl font-bold">Add Food</h1>
          <Link href="/food/add/manual" className="ml-auto text-gray-500 hover:text-white text-sm transition-colors">Manual entry</Link>
        </div>
        <FoodChat />
      </div>
    </main>
  );
}
