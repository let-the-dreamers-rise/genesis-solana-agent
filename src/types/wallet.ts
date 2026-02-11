import { TransactionInstruction } from '@solana/web3.js'

// Wallet information
export interface WalletInfo {
  agentId: string
  publicKey: string
  privateKey: string // Encrypted
  balance: number
  createdAt: number
  lastUsed: number
  transactionCount: number
  airdropCount: number
}

// Transaction interface
export interface Transaction {
  instructions: TransactionInstruction[]
  recentBlockhash: string
  feePayer: string
}

// Transaction status
export interface TransactionStatus {
  signature: string
  confirmed: boolean
  slot: number
  error?: string
}
