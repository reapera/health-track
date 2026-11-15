import Link from "next/link";
import AddFoodForm from "./AddFoodForm";

export const metadata = { title: "Add Food Manually — Health Dashboard" };

export default function ManualAddFoodPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-md mx-auto flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/food/add" className="text-gray-500 hover:text-white text-sm transition-colors">← Chat</Link>
          <h1 className="text-2xl font-bold">Add Manually</h1>
        </div>
        <AddFoodForm />
      </div>
    </main>
  );
}
