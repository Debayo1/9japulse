"use client";

interface TransactionsTabProps {
  txns: any[];
  txnSearch: string;
  setTxnSearch: React.Dispatch<React.SetStateAction<string>>;
  isPending: boolean;
  handleUpdateTxnStatus: (txnId: string, newStatus: string) => void;
}

export default function TransactionsTab({
  txns,
  txnSearch,
  setTxnSearch,
  isPending,
  handleUpdateTxnStatus,
}: TransactionsTabProps) {
  const filteredTxns = txns.filter((t) =>
    (t.id ?? "").toLowerCase().includes(txnSearch.toLowerCase()) ||
    (t.service_type ?? "").toLowerCase().includes(txnSearch.toLowerCase()) ||
    (t.phone ?? "").toLowerCase().includes(txnSearch.toLowerCase()) ||
    (t.reference ?? "").toLowerCase().includes(txnSearch.toLowerCase())
  );

  return (
    <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: 0 }}>Transaction History</h3>
          <input
            type="text"
            placeholder="Search txns..."
            value={txnSearch}
            onChange={(e) => setTxnSearch(e.target.value)}
            className="input"
            style={{ width: "160px", padding: "0.5rem 0.75rem", fontSize: "0.75rem", height: "32px", borderRadius: "10px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredTxns.map((txn) => {
            const isPendingTx = txn.status === "pending";

            return (
              <div key={txn.id} style={{
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "0.875rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                backgroundColor: "var(--bg-elevated)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.875rem" }}>{txn.service_type?.toUpperCase()}</strong>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>{txn.phone}</p>
                  </div>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: txn.status === "success" ? "var(--color-success)" : txn.status === "failed" ? "var(--color-danger)" : "var(--color-warning)",
                  }}>
                    {txn.status?.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <strong>Ref:</strong> {txn.reference || txn.id}
                  <p style={{ margin: "2px 0 0 0" }}><strong>Desc:</strong> {txn.description}</p>
                  <p style={{ margin: "2px 0 0 0" }}><strong>Amount:</strong> ₦{Number(txn.amount).toLocaleString()}</p>
                </div>

                {isPendingTx && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "4px" }}>
                    <button
                      onClick={() => handleUpdateTxnStatus(txn.id, "success")}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: "4px 0", fontSize: "0.75rem", height: "26px", borderRadius: "8px", color: "var(--color-success)" }}
                      disabled={isPending}
                    >
                      Mark Success
                    </button>
                    <button
                      onClick={() => handleUpdateTxnStatus(txn.id, "failed")}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: "4px 0", fontSize: "0.75rem", height: "26px", borderRadius: "8px", color: "var(--color-danger)" }}
                      disabled={isPending}
                    >
                      Mark Failed
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
