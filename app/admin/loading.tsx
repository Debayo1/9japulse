import { SkeletonCard } from "@/components/SkeletonLoader";

export default function AdminLoading() {
  return (
    <div className="page">
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="skeleton" style={{ height: 32, width: "50%", borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: "30%", borderRadius: 6 }} />
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
