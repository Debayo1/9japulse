import BottomNav from "@/components/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh" }}>
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
