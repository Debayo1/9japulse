import { createServiceClient } from './supabaseServer'
import { applyTransaction, getWallet } from './ledger'

const svc = createServiceClient() as any

export async function getOrCreateSubscription(userId: string, channel: string) {
  const { data: existing } = await svc
    .from('bot_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('channel', channel)
    .single()

  if (existing) return existing

  const { data: settings } = await svc
    .from('platform_settings')
    .select('bot_free_messages_per_day')
    .limit(1)
    .single()

  const messagesLimit = settings?.bot_free_messages_per_day ?? 50

  const { data, error } = await svc
    .from('bot_subscriptions')
    .insert({
      user_id: userId,
      channel,
      plan: 'free',
      messages_used: 0,
      messages_limit: messagesLimit,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function checkMessageLimit(userId: string, channel: string) {
  const sub = await getOrCreateSubscription(userId, channel)

  if (sub.plan === 'free') {
    if (sub.messages_used >= sub.messages_limit) {
      return {
        allowed: false,
        reason: 'daily_limit',
        messagesUsed: sub.messages_used,
        messagesLimit: sub.messages_limit,
      }
    }
  }

  if (sub.plan !== 'free' && sub.expires_at && new Date(sub.expires_at) < new Date()) {
    return { allowed: false, reason: 'expired', messagesUsed: sub.messages_used, messagesLimit: null }
  }

  return {
    allowed: true,
    messagesUsed: sub.messages_used,
    messagesLimit: null,
    plan: sub.plan,
  }
}

export async function incrementMessageUsage(userId: string, channel: string) {
  const { data } = await svc
    .from('bot_subscriptions')
    .select('messages_used')
    .eq('user_id', userId)
    .eq('channel', channel)
    .single()

  const newCount = (data?.messages_used ?? 0) + 1

  await svc
    .from('bot_subscriptions')
    .update({ messages_used: newCount })
    .eq('user_id', userId)
    .eq('channel', channel)

  return newCount
}

export async function purchaseSubscription(userId: string, channel: string, plan: string) {
  const { data: settings } = await svc
    .from('platform_settings')
    .select('bot_daily_price, bot_weekly_price, bot_monthly_price')
    .limit(1)
    .single()

  const now = new Date()
  let expiresAt: string
  let price: number

  if (plan === 'daily') {
    price = settings?.bot_daily_price ?? 0
    now.setDate(now.getDate() + 1)
  } else if (plan === 'weekly') {
    price = settings?.bot_weekly_price ?? 0
    now.setDate(now.getDate() + 7)
  } else {
    price = settings?.bot_monthly_price ?? 0
    now.setDate(now.getDate() + 30)
  }

  expiresAt = now.toISOString()

  await svc
    .from('bot_subscriptions')
    .upsert({
      user_id: userId,
      channel,
      plan,
      messages_used: 0,
      messages_limit: null,
      expires_at: expiresAt,
    })

  try {
    const wallet = await getWallet(userId)
    await applyTransaction(wallet.id, {
      service_type: 'bot_subscription',
      amount: price,
      description: `Bot ${plan} subscription`,
      status: 'success',
    })
  } catch (err) {
    console.warn('[9jaPulse] Bot subscription wallet debit failed:', err)
  }

  return { success: true, expiresAt }
}

export async function getConversationHistory(userId: string, channel: string, channelUserId: string, limit = 20) {
  let { data: conversation } = await svc
    .from('chat_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('channel', channel)
    .eq('channel_user_id', channelUserId)
    .single()

  if (!conversation) {
    const { data: created } = await svc
      .from('chat_conversations')
      .insert({
        user_id: userId,
        channel,
        channel_user_id: channelUserId,
      })
      .select('id')
      .single()

    conversation = created
  }

  if (!conversation) return { conversationId: null, messages: [] }

  const { data: messages } = await svc
    .from('chat_messages')
    .select('role, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return {
    conversationId: conversation.id,
    messages: (messages ?? []).reverse(),
  }
}

export async function saveChatMessage(conversationId: string, role: string, content: string) {
  const { error } = await svc
    .from('chat_messages')
    .insert({ conversation_id: conversationId, role, content })

  if (error) throw error
  return { success: true }
}

export async function getBotSettings() {
  const { data } = await svc
    .from('platform_settings')
    .select('*')
    .limit(1)
    .single()

  return data
}
