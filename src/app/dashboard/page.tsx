import type { Metadata } from "next";
import Dashboard from "@/components/dashboard-shell";

export const metadata: Metadata = {
  title: "Solee Energia Solar",
};

export default function Page() {
  return <Dashboard />;
}
