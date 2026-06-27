// ---------------------------------------------------------------------------
// Supabase TypeScript type definitions
// Run `npx supabase gen types typescript` after linking your project to
// regenerate this file with accurate types from your actual schema.
// ---------------------------------------------------------------------------

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  pin: string | null;
  role: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WalletRow = {
  id: string;
  user_id: string;
  balance_total: number;
  balance_withdrawable: number;
  created_at: string;
  updated_at: string;
};

export type TransactionRow = {
  id: string;
  wallet_id: string;
  service_type: string;
  description: string | null;
  amount: number;
  direction: "debit" | "credit";
  status: "pending" | "success" | "failed";
  reference: string | null;
  meta: Json | null;
  created_at: string;
};

export type ProviderKeyRow = {
  id: string;
  provider: string;
  key_name: string;
  key_value: string;
  is_active: boolean;
  created_at: string;
};

export type VirtualAccountRow = {
  id: string;
  user_id: string;
  provider: string;
  provider_reference: string | null;
  account_number: string;
  account_name: string;
  bank_code: string | null;
  bank_name: string | null;
  account_type: string | null;
  status: string;
  webhook_url: string | null;
  meta: Json | null;
  created_at: string;
  updated_at: string;
};

export type PlatformSettingRow = {
  id: number;
  app_name: string;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  extra_color: string | null;
  transfer_fee: number;
  bank_transfer_fee: number;
  deposit_fee: number;
  referral_percentage: number;
  cashback_percentage: number | null;
  ncwallet_api_url: string | null;
  ncwallet_authorization: string | null;
  app_maintenance: boolean | null;
  theme: string | null;
  banner_enabled: boolean | null;
  banner_text: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProfileRow, "id" | "created_at" | "updated_at">>;
      };
      wallets: {
        Row: WalletRow;
        Insert: Omit<WalletRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<WalletRow, "id" | "created_at" | "updated_at">>;
      };
      transactions: {
        Row: TransactionRow;
        Insert: Omit<TransactionRow, "id" | "created_at">;
        Update: Partial<Omit<TransactionRow, "id" | "created_at">>;
      };
      provider_keys: {
        Row: ProviderKeyRow;
        Insert: Omit<ProviderKeyRow, "id" | "created_at">;
        Update: Partial<Omit<ProviderKeyRow, "id" | "created_at">>;
      };
      virtual_accounts: {
        Row: VirtualAccountRow;
        Insert: Omit<VirtualAccountRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<VirtualAccountRow, "id" | "created_at" | "updated_at">>;
      };
      platform_settings: {
        Row: PlatformSettingRow;
        Insert: Omit<PlatformSettingRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PlatformSettingRow, "id" | "created_at" | "updated_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      transaction_direction: "debit" | "credit";
      transaction_status: "pending" | "success" | "failed";
    };
  };
}
