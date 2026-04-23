import { redirect } from "next/navigation";

export default function ChannelsPage() {
  redirect("/apps?category=channel");
}
