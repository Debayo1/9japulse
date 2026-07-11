# 9jaPulse Bug Fixes Document

> Comprehensive list of all bugs, issues, and bad practices found across the codebase,
> organized by severity. Each fix is documented with the file path, root cause, and
> the approach taken to resolve it.

---

## 🔴 Critical

### 1. Race condition in ledger — no SELECT FOR UPDATE
- **File**: src/lib/ledger.ts — moveFunds()
- **Root cause**: moveFunds reads the wallet balance, computes the new balance in JS, then writes it back.
- **Fix**: Added SELECT ... FOR UPDATE via the atomic pply_transaction_safe RPC.
- **Status**: ✅ Fixed

### 2. PIN stored in user_metadata
- **File**: src/lib/auth.ts — signUp()
- **Root cause**: PIN passed to signUp({ options: { data: { transaction_pin: pin } } }), exposed client-side.
- **Fix**: Removed 	ransaction_pin from signUp metadata. Schema trigger already handles it.
- **Status**: ✅ Fixed

### 3. RLS not guaranteed on schema
- **File**: supabase/schema.sql
- **Root cause**: enable row level security only in policies.sql.
- **Fix**: Added RLS enable statements directly in schema.sql.
- **Status**: ✅ Fixed

### 4. Webhook has no signature verification
- **File**: pp/api/webhooks/ncwallet/route.ts
- **Root cause**: No HMAC verification — anyone can POST fake payment notifications.
- **Fix**: Added HMAC-SHA256 signature verification.
- **Status**: ✅ Fixed

---

## 🟠 TypeScript & Type Safety

### 5. Heavy ny casts throughout
- **Files**: src/lib/ledger.ts, src/lib/marketplace.ts
- **Fix**: Added typed wrapper functions for RPC calls.
- **Status**: ✅ Fixed

### 6. Missing env var validation
- **File**: src/lib/supabaseServer.ts
- **Fix**: Added validation helpers with clear error messages.
- **Status**: ✅ Fixed

### 7. SQL injection vector
- **File**: src/lib/dbAdmin.ts
- **Fix**: Replaced template literal queries with parameterized queries.
- **Status**: ✅ Fixed

---

## 🟡 React Pitfalls

### 8. Stale closures in useEffect
- **Files**: AirtimeForm.tsx, DataForm.tsx
- **Fix**: Fixed dependency arrays, used refs where appropriate.
- **Status**: ✅ Fixed

### 9. Icon.tsx uses require() at runtime
- **File**: src/components/Icon.tsx
- **Fix**: Replaced with static imports from lucide-react.
- **Status**: ✅ Fixed

---

## 🔵 Logic Flaws

### 10. Missing idempotency enforcement
- **Files**: pp/api/purchases/airtime/route.ts, pp/api/purchases/data/route.ts
- **Fix**: Added early idempotency check before processing.
- **Status**: ✅ Fixed

### 11. Marketplace stock decrement race condition
- **File**: src/lib/marketplace.ts
- **Fix**: Changed to atomic UPDATE ... SET stock_quantity = stock_quantity - 1 WHERE stock_quantity > 0.
- **Status**: ✅ Fixed

---

## ⚠️ Security

### 12. No CSP headers
- **File**: 
ext.config.ts
- **Fix**: Added CSP headers via headers().
- **Status**: ✅ Fixed

### 13. Inline script has no nonce
- **File**: pp/layout.tsx
- **Fix**: Added nonce for CSP compatibility.
- **Status**: ✅ Fixed

---

## 🟣 Maintainability

### 14. AdminConsole.tsx is ~1000 lines
- **File**: src/components/AdminConsole.tsx
- **Fix**: Split into separate tab components.
- **Status**: ✅ Fixed
