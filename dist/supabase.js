import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auction-specific database functions
export async function createAuction(auctionData) {
  const { data, error } = await supabase
    .from('auctions')
    .insert(auctionData)
    .select()
  
  if (error) throw error
  return data[0]
}

export async function placeBid(bidData) {
  const { data, error } = await supabase
    .from('bids')
    .insert(bidData)
    .select()
  
  if (error) throw error
  return data[0]
}

export async function getActiveAuctions() {
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('status', 'active')
    .order('end_time', { ascending: true })
  
  if (error) throw error
  return data
}

export async function getUserAuctions(userId) {
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('seller_id', userId)
  
  if (error) throw error
  return data
}