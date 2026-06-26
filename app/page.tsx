import { redirect } from "next/navigation";

// Root "/" redirects to the home page
export default function RootPage() {
  redirect("/home");
}
