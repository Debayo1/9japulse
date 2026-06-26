export function SkeletonCard() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.875rem 1rem",
        marginBottom: "0.5rem",
        borderRadius: "20px",
        border: "1.5px solid var(--border)",
        background: "var(--bg-elevated)",
      }}
      aria-hidden="true"
    >
      {/* Left circular icon bubble */}
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
      
      {/* Middle texts */}
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 12, width: "50%", borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 10, width: "30%", borderRadius: 4 }} />
      </div>
      
      {/* Right amount and status */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div className="skeleton" style={{ height: 12, width: 60, borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 18, width: 48, borderRadius: 10 }} />
      </div>
    </div>
  );
}

export function SkeletonWallet() {
  return (
    <div style={{ marginBottom: "1.5rem" }} aria-hidden="true">
      {/* Compact Card Outline */}
      <div
        className="skeleton"
        style={{
          height: "115px",
          borderRadius: "20px",
          marginBottom: "1rem",
        }}
      />
      {/* Dots Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.375rem",
          marginBottom: "1.25rem",
        }}
      >
        <div className="skeleton" style={{ width: 18, height: 6, borderRadius: 99 }} />
        <div className="skeleton" style={{ width: 6, height: 6, borderRadius: 99 }} />
        <div className="skeleton" style={{ width: 6, height: 6, borderRadius: 99 }} />
      </div>
      {/* Actions Row */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <div className="skeleton" style={{ flex: 1, height: "44px", borderRadius: "14px" }} />
        <div className="skeleton" style={{ flex: 1, height: "44px", borderRadius: "14px" }} />
      </div>
    </div>
  );
}

export function SkeletonServices() {
  return (
    <div style={{ marginBottom: "1.5rem" }} aria-hidden="true">
      <div className="skeleton" style={{ height: 14, width: "30%", borderRadius: 6, marginBottom: "0.75rem" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="skeleton" style={{ width: 58, height: 58, borderRadius: 18, marginBottom: "0.5rem" }} />
            <div className="skeleton" style={{ height: 10, width: "70%", borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true" style={{ marginTop: "0.5rem" }}>
      <div className="skeleton" style={{ height: 14, width: "40%", borderRadius: 6, marginBottom: "0.75rem" }} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText({ width = "60%", height = 14 }: { width?: string; height?: number }) {
  return (
    <div
      className="skeleton"
      style={{ height, width, borderRadius: 6 }}
      aria-hidden="true"
    />
  );
}
