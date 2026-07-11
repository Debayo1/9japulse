-- =============================================================================
-- 9jaPulse Atomic Operations Migration
-- Adds safe RPC functions with FOR UPDATE locking
-- =============================================================================

-- ─── Atomic fund movement with FOR UPDATE lock ────────────────────────────────
create or replace function public.move_funds_safe(
  p_wallet_id uuid,
  p_amount numeric,
  p_to_withdrawable boolean
) returns json
language plpgsql
security definer
as 
declare
  v_balance_total numeric;
  v_balance_withdrawable numeric;
begin
  -- Lock the wallet row
  select balance_total, balance_withdrawable
  into v_balance_total, v_balance_withdrawable
  from public.wallets
  where id = p_wallet_id
  for update;

  if p_to_withdrawable then
    if p_amount > (v_balance_total - v_balance_withdrawable) then
      raise exception 'Insufficient held funds to move';
    end if;
    v_balance_withdrawable := v_balance_withdrawable + p_amount;
  else
    if p_amount > v_balance_withdrawable then
      raise exception 'Insufficient withdrawable funds';
    end if;
    v_balance_withdrawable := v_balance_withdrawable - p_amount;
  end if;

  update public.wallets
  set balance_withdrawable = v_balance_withdrawable
  where id = p_wallet_id;

  return json_build_object(
    'balance_total', v_balance_total,
    'balance_withdrawable', v_balance_withdrawable
  );
end;
;

-- ─── Atomic stock decrement ───────────────────────────────────────────────────
create or replace function public.decrement_stock(p_row_id text)
returns boolean
language plpgsql
security definer
as 
begin
  update public.marketplace_products
  set stock_quantity = stock_quantity - 1
  where id = p_row_id and stock_quantity > 0;

  if not found then
    raise exception 'Product out of stock or not found';
  end if;

  return true;
end;
;
