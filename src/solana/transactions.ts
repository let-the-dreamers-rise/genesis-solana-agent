import {
  Connection,
  Transaction,
  TransactionInstruction,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { getLogger } from '../utils/logger.js'

const logger = getLogger()

export interface MemoData {
  type: string
  agentId: string
  role?: string
  mission?: string
  timestamp: number
  genesisId: string
  [key: string]: unknown
}

export class SolanaTransactions {
  private connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
  }

  /**
   * Create memo transaction instruction
   */
  createMemoInstruction(memo: string, signer: PublicKey): TransactionInstruction {
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
    
    return new TransactionInstruction({
      keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, 'utf-8'),
    })
  }

  /**
   * Build memo transaction with agent data
   */
  async buildMemoTransaction(
    memoData: MemoData,
    payer: PublicKey
  ): Promise<Transaction> {
    const memo = JSON.stringify(memoData)
    const memoInstruction = this.createMemoInstruction(memo, payer)

    const transaction = new Transaction()
    transaction.add(memoInstruction)

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = payer

    return transaction
  }

  /**
   * Submit transaction with retry logic
   */
  async submitTransaction(
    transaction: Transaction,
    signers: Keypair[],
    maxRetries: number = 3
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const signature = await sendAndConfirmTransaction(
          this.connection,
          transaction,
          signers,
          {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
          }
        )

        await logger.info('Transaction confirmed', { signature, attempt })
        return signature
      } catch (error) {
        await logger.warn(`Transaction attempt ${attempt} failed`, { error })
        
        if (attempt === maxRetries) {
          await logger.error('Transaction failed after retries', { error })
          throw error
        }

        // Exponential backoff
        await this.sleep(1000 * attempt)
        
        // Get fresh blockhash for retry
        const { blockhash } = await this.connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
      }
    }

    throw new Error('Transaction failed after all retries')
  }

  /**
   * Request airdrop for wallet
   */
  async requestAirdrop(
    publicKey: PublicKey,
    amount: number,
    maxRetries: number = 3
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const signature = await this.connection.requestAirdrop(publicKey, amount)
        await this.connection.confirmTransaction(signature, 'confirmed')
        
        await logger.info('Airdrop confirmed', { publicKey: publicKey.toBase58(), amount })
        return signature
      } catch (error) {
        await logger.warn(`Airdrop attempt ${attempt} failed`, { error })
        
        if (attempt === maxRetries) {
          await logger.error('Airdrop failed after retries', { error })
          throw error
        }

        await this.sleep(2000 * attempt)
      }
    }

    throw new Error('Airdrop failed after all retries')
  }

  /**
   * Get wallet balance
   */
  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey)
      return balance
    } catch (error) {
      await logger.error('Failed to get balance', { error })
      throw error
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(signature: string): Promise<{
    confirmed: boolean
    slot: number
    error?: string
  }> {
    try {
      const status = await this.connection.getSignatureStatus(signature)
      
      return {
        confirmed: status.value?.confirmationStatus === 'confirmed' || 
                   status.value?.confirmationStatus === 'finalized',
        slot: status.value?.slot || 0,
        error: status.value?.err ? JSON.stringify(status.value.err) : undefined,
      }
    } catch (error) {
      await logger.error('Failed to get transaction status', { error })
      throw error
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
