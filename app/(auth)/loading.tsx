import { SkeletonForm } from "@/components/SkeletonLoader";

export default function AuthLoading() {
  return (
    <div className="auth-page" style={{ justifyContent: "flex-start", paddingTop: "4rem" }}>
      <SkeletonForm />
    </div>
  );
}
