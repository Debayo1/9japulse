import BottomNav from "@/components/BottomNav";
import PasscodeLockGuard from "@/components/PasscodeLockGuard";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <PasscodeLockGuard>
      <div style={{ minHeight: "100dvh" }}>
        <main>{children}</main>
        <BottomNav />
      </div>
    </PasscodeLockGuard>
  );
}
