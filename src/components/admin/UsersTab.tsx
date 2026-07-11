"use client";

interface UsersTabProps {
  users: any[];
  isPending: boolean;
  userSearch: string;
  setUserSearch: React.Dispatch<React.SetStateAction<string>>;
  editingUserId: string | null;
  setEditingUserId: React.Dispatch<React.SetStateAction<string | null>>;
  editingUserBalance: string;
  setEditingUserBalance: React.Dispatch<React.SetStateAction<string>>;
  promotedEmail: string;
  setPromotedEmail: React.Dispatch<React.SetStateAction<string>>;
  managingVaUserId: string | null;
  setManagingVaUserId: React.Dispatch<React.SetStateAction<string | null>>;
  vaAccountNumber: string;
  setVaAccountNumber: React.Dispatch<React.SetStateAction<string>>;
  vaBankName: string;
  setVaBankName: React.Dispatch<React.SetStateAction<string>>;
  vaBankCode: string;
  setVaBankCode: React.Dispatch<React.SetStateAction<string>>;
  vaLookupNumber: string;
  setVaLookupNumber: React.Dispatch<React.SetStateAction<string>>;
  vaCreateNew: boolean;
  setVaCreateNew: React.Dispatch<React.SetStateAction<boolean>>;
  handleUpdateBalance: (userId: string, currentBalance: number) => void;
  saveUserBalance: (userId: string) => void;
  handleSaveVirtualAccount: (userId: string) => void;
  handlePromoteUser: (e: React.FormEvent) => void;
}

export default function UsersTab({
  users,
  isPending,
  userSearch,
  setUserSearch,
  editingUserId,
  setEditingUserId,
  editingUserBalance,
  setEditingUserBalance,
  promotedEmail,
  setPromotedEmail,
  managingVaUserId,
  setManagingVaUserId,
  vaAccountNumber,
  setVaAccountNumber,
  vaBankName,
  setVaBankName,
  vaBankCode,
  setVaBankCode,
  vaLookupNumber,
  setVaLookupNumber,
  vaCreateNew,
  setVaCreateNew,
  handleUpdateBalance,
  saveUserBalance,
  handleSaveVirtualAccount,
  handlePromoteUser,
}: UsersTabProps) {
  const filteredUsers = users.filter((u) =>
    (u.email ?? "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.full_name ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, marginBottom: "0.75rem" }}>Promote User to Admin</h3>
        <form onSubmit={handlePromoteUser} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="email"
            placeholder="Enter user email address"
            value={promotedEmail}
            onChange={(e) => setPromotedEmail(e.target.value)}
            required
            className="input"
            style={{ flex: 1, padding: "0.625rem 0.875rem", fontSize: "0.8125rem", height: "40px" }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "0 1rem", fontSize: "0.8125rem", height: "40px" }} disabled={isPending}>
            Promote
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, margin: 0 }}>Users List</h3>
          <input
            type="text"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="input"
            style={{ width: "160px", padding: "0.5rem 0.75rem", fontSize: "0.75rem", height: "32px", borderRadius: "10px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredUsers.map((user) => {
            const balance = Number(user.wallets?.[0]?.balance_withdrawable || 0);
            const isEditing = editingUserId === user.id;

            return (
              <div key={user.id} style={{
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "0.875rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                backgroundColor: "var(--bg-elevated)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{user.full_name || "No Name"}</strong>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>{user.email}</p>
                  </div>
                  <span style={{
                    fontSize: "0.6875rem",
                    fontWeight: 800,
                    backgroundColor: user.role === "admin" ? "var(--color-primary-light)" : "var(--border)",
                    color: user.role === "admin" ? "var(--color-primary)" : "var(--text-secondary)",
                    padding: "2px 8px",
                    borderRadius: "8px",
                  }}>
                    {user.role?.toUpperCase() || "USER"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Withdrawable:</span>
                    <strong style={{ fontSize: "0.875rem", color: "var(--color-success)", marginLeft: "4px" }}>
                      ₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => handleUpdateBalance(user.id, balance)}
                      className="btn btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "0.75rem", height: "26px", borderRadius: "8px" }}
                    >
                      Edit Balance
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "4px" }}>
                      <input
                        type="number"
                        value={editingUserBalance}
                        onChange={(e) => setEditingUserBalance(e.target.value)}
                        className="input"
                        style={{ width: "90px", padding: "2px 6px", fontSize: "0.75rem", height: "26px", borderRadius: "8px" }}
                      />
                      <button
                        onClick={() => saveUserBalance(user.id)}
                        className="btn btn-primary"
                        style={{ padding: "0 8px", fontSize: "0.75rem", height: "26px", borderRadius: "8px" }}
                        disabled={isPending}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="btn btn-secondary"
                        style={{ padding: "0 8px", fontSize: "0.75rem", height: "26px", borderRadius: "8px" }}
                      >
                        X
                      </button>
                    </div>
                  )}
                </div>

                <div style={{
                  borderTop: "1px dashed var(--border)",
                  paddingTop: "0.625rem",
                  marginTop: "0.5rem",
                  fontSize: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      {user.virtual_accounts?.[0] ? (
                        <span style={{ color: "var(--text-secondary)" }}>
                          <strong>{user.virtual_accounts[0].bank_name}</strong> • {user.virtual_accounts[0].account_number} ({user.virtual_accounts[0].provider})
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No Virtual Account</span>
                      )}
                    </div>
                    {managingVaUserId !== user.id ? (
                      <button
                        onClick={() => {
                          setManagingVaUserId(user.id);
                          setVaAccountNumber(user.virtual_accounts?.[0]?.account_number || "");
                          setVaBankName(user.virtual_accounts?.[0]?.bank_name || "Palmpay");
                          setVaBankCode(user.virtual_accounts?.[0]?.bank_code || "palmpay");
                          setVaLookupNumber("");
                          setVaCreateNew(false);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: "2px 8px", fontSize: "0.7rem", height: "22px", borderRadius: "6px" }}
                      >
                        Manage VA
                      </button>
                    ) : (
                      <button
                        onClick={() => setManagingVaUserId(null)}
                        className="btn btn-secondary"
                        style={{ padding: "2px 8px", fontSize: "0.7rem", height: "22px", borderRadius: "6px" }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {managingVaUserId === user.id && (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      backgroundColor: "var(--bg-base)",
                      padding: "0.625rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      marginTop: "0.25rem",
                    }}>
                      <div>
                        <label style={{ fontWeight: 700, fontSize: "0.6875rem", display: "block", marginBottom: "2px" }}>Lookup Existing Number (NCWallet)</label>
                        <input
                          type="text"
                          placeholder="e.g. 8064225722"
                          value={vaLookupNumber}
                          onChange={(e) => {
                            setVaLookupNumber(e.target.value);
                            setVaCreateNew(false);
                          }}
                          className="input"
                          style={{ padding: "4px 8px", fontSize: "0.72rem", height: "26px", borderRadius: "6px" }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          type="checkbox"
                          id={`create-new-toggle-${user.id}`}
                          checked={vaCreateNew}
                          onChange={(e) => {
                            setVaCreateNew(e.target.checked);
                            if (e.target.checked) setVaLookupNumber("");
                          }}
                          style={{ width: "14px", height: "14px", cursor: "pointer" }}
                        />
                        <label htmlFor={`create-new-toggle-${user.id}`} style={{ fontWeight: 700, fontSize: "0.6875rem", cursor: "pointer" }}>
                          Request BRAND NEW from NCWallet
                        </label>
                      </div>

                      {!vaLookupNumber && !vaCreateNew && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px dashed var(--border)", paddingTop: "4px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Or Update Manually:</span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                            <input
                              type="text"
                              placeholder="Bank Name"
                              value={vaBankName}
                              onChange={(e) => setVaBankName(e.target.value)}
                              className="input"
                              style={{ padding: "4px 8px", fontSize: "0.72rem", height: "26px", borderRadius: "6px" }}
                            />
                            <input
                              type="text"
                              placeholder="Bank Code"
                              value={vaBankCode}
                              onChange={(e) => setVaBankCode(e.target.value)}
                              className="input"
                              style={{ padding: "4px 8px", fontSize: "0.72rem", height: "26px", borderRadius: "6px" }}
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Account Number"
                            value={vaAccountNumber}
                            onChange={(e) => setVaAccountNumber(e.target.value)}
                            className="input"
                            style={{ padding: "4px 8px", fontSize: "0.72rem", height: "26px", borderRadius: "6px" }}
                          />
                        </div>
                      )}

                      <button
                        onClick={() => handleSaveVirtualAccount(user.id)}
                        className="btn btn-primary"
                        style={{ width: "100%", height: "26px", fontSize: "0.72rem", borderRadius: "6px" }}
                        disabled={isPending}
                      >
                        {isPending ? "Syncing..." : "Apply Virtual Account"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
