import Link from "next/link";
import AddFoodForm from "./AddFoodForm";

export const metadata = { title: "Add Food — Health Dashboard" };

export default function AddFoodPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-md mx-auto flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/food" className="text-gray-500 hover:text-white text-sm transition-colors">← Food Log</Link>
          <h1 className="text-2xl font-bold">Add Food</h1>
        </div>
        <AddFoodForm />
      </div>
    </main>
  );
}
