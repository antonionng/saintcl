import { redirect } from "next/navigation";

export default function AdminToolsPage() {
  redirect("/settings?tab=security");
}
