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
  username: string | null;
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
  bot_enabled: boolean;
  bot_free_messages_per_day: number;
  bot_daily_price: number;
  bot_weekly_price: number;
  bot_monthly_price: number;
  bot_welcome_message: string;
  seller_enabled: boolean;
  seller_commission_rate: number;
  seller_auto_release_days: number;
  created_at: string;
  updated_at: string;
};

export type SellerRow = {
  id: string;
  user_id: string;
  display_name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  status: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SellerProductRow = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images: string[];
  category: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SellerOrderRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  quantity: number;
  amount: number;
  commission: number;
  seller_payout: number;
  status: string;
  reference: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  confirmed_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SellerWalletRow = {
  id: string;
  seller_id: string;
  balance_available: number;
  balance_held: number;
  total_earned: number;
  created_at: string;
  updated_at: string;
};

export type BotSubscriptionRow = {
  id: string;
  user_id: string;
  channel: string;
  plan: string;
  messages_used: number;
  messages_limit: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatConversationRow = {
  id: string;
  user_id: string;
  channel: string;
  channel_user_id: string;
  platform_metadata: Json | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  tool_calls: Json | null;
  tool_result: Json | null;
  created_at: string;
};

export type GiftCodeRow = {
  id: string;
  code: string;
  amount: number;
  created_by: string;
  redeemed_by: string | null;
  status: "active" | "redeemed" | "expired" | "cancelled";
  message: string | null;
  created_at: string;
  redeemed_at: string | null;
  expires_at: string | null;
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
      sellers: {
        Row: SellerRow;
        Insert: Omit<SellerRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SellerRow, "id" | "created_at" | "updated_at">>;
      };
      seller_products: {
        Row: SellerProductRow;
        Insert: Omit<SellerProductRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SellerProductRow, "id" | "created_at" | "updated_at">>;
      };
      seller_orders: {
        Row: SellerOrderRow;
        Insert: Omit<SellerOrderRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SellerOrderRow, "id" | "created_at" | "updated_at">>;
      };
      seller_wallets: {
        Row: SellerWalletRow;
        Insert: Omit<SellerWalletRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SellerWalletRow, "id" | "created_at" | "updated_at">>;
      };
      bot_subscriptions: {
        Row: BotSubscriptionRow;
        Insert: Omit<BotSubscriptionRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<BotSubscriptionRow, "id" | "created_at" | "updated_at">>;
      };
      chat_conversations: {
        Row: ChatConversationRow;
        Insert: Omit<ChatConversationRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ChatConversationRow, "id" | "created_at" | "updated_at">>;
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: Omit<ChatMessageRow, "id" | "created_at">;
        Update: Partial<Omit<ChatMessageRow, "id" | "created_at">>;
      };
      gift_codes: {
        Row: GiftCodeRow;
        Insert: Omit<GiftCodeRow, "id" | "created_at">;
        Update: Partial<Omit<GiftCodeRow, "id" | "created_at">>;
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
