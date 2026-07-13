import BottomNav from "@/components/BottomNav";
import PasscodeLockGuard from "@/components/PasscodeLockGuard";
import ChatWidget from "@/components/ChatWidget";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <PasscodeLockGuard>
      <div style={{ minHeight: "100dvh" }}>
        <main>{children}</main>
        <BottomNav />
        <ChatWidget />
      </div>
    </PasscodeLockGuard>
  );
}
