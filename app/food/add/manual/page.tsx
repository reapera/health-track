import { redirect } from "next/navigation";

// Manual entry is now a sheet on the log page
export default function ManualAddFoodPage() {
  redirect("/food/add?manual=1");
}
