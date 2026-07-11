import Link from "next/link";
import { WarningCircle, ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-heading">
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "linear-gradient(135deg, var(--color-danger), var(--color-accent))",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem", color: "white", boxShadow: "var(--shadow-glow)"
        }}>
          <WarningCircle size={32} weight="fill" />
        </div>
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
      </div>
      <Link
        href="/home"
        className="btn btn-primary btn-full"
        style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", textDecoration: "none" }}
      >
        <ArrowLeft size={16} weight="bold" />
        Go Home
      </Link>
    </div>
  );
}
