import { Keypair, PublicKey } from '@solana/web3.js'
import { WalletInfo } from '../types/wallet.js'
import { MemorySystem } from '../memory/memory-system.js'
import { SolanaTransactions } from '../solana/transactions.js'
import { encrypt, decrypt, getEncryptionKey } from './encryption.js'
import { getLogger } from '../utils/logger.js'

const logger = getLogger()

export class AgentWallet {
  private memory: MemorySystem
  private solana: SolanaTransactions
  private encryptionKey: string
  private airdropAmount: number
  private lowBalanceThreshold: number

  constructor(
    memory: MemorySystem,
    solana: SolanaTransactions,
    airdropAmount: number = 1000000000, // 1 SOL
    lowBalanceThreshold: number = 100000000 // 0.1 SOL
  ) {
    this.memory = memory
    this.solana = solana
    this.encryptionKey = getEncryptionKey()
    this.airdropAmount = airdropAmount
    this.lowBalanceThreshold = lowBalanceThreshold
  }

  /**
   * Create wallet for agent
   */
  async createWallet(agentId: string, isGenesis: boolean = false): Promise<WalletInfo> {
    try {
      // Generate keypair
      const keypair = Keypair.generate()
      const publicKey = keypair.publicKey.toBase58()

      // Encrypt private key
      const privateKeyArray = Array.from(keypair.secretKey)
      const privateKeyJson = JSON.stringify(privateKeyArray)
      const encryptedPrivateKey = encrypt(privateKeyJson, this.encryptionKey)

      // Request airdrop (best effort — don't fail if faucet is rate-limited)
      let balance = 0
      let airdropCount = 0
      const airdropAmount = isGenesis ? this.airdropAmount * 2 : this.airdropAmount
      try {
        await this.solana.requestAirdrop(keypair.publicKey, airdropAmount)
        balance = await this.solana.getBalance(keypair.publicKey)
        airdropCount = 1
      } catch (airdropError) {
        await logger.warn(`Airdrop failed for ${agentId}, creating wallet with zero balance`, { airdropError })
        // Wallet is still usable — transactions will fail gracefully
      }

      // Create wallet info
      const walletInfo: WalletInfo = {
        agentId,
        publicKey,
        privateKey: encryptedPrivateKey,
        balance,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        transactionCount: 0,
        airdropCount,
      }

      // Save to memory
      await this.memory.saveWallet(walletInfo)

      await logger.info(`Created wallet for agent ${agentId}`, { publicKey, balance })

      return walletInfo
    } catch (error) {
      await logger.error(`Failed to create wallet for agent ${agentId}`, { error })
      throw error
    }
  }

  /**
   * Get wallet for agent
   */
  async getWallet(agentId: string): Promise<WalletInfo | null> {
    return this.memory.getWallet(agentId)
  }

  /**
   * Get all wallets
   */
  async getAllWallets(): Promise<WalletInfo[]> {
    return this.memory.getAllWallets()
  }

  /**
   * Get keypair from wallet
   */
  getKeypair(walletInfo: WalletInfo): Keypair {
    try {
      // Decrypt private key
      const privateKeyJson = decrypt(walletInfo.privateKey, this.encryptionKey)
      const privateKeyArray = JSON.parse(privateKeyJson)
      const privateKeyUint8 = new Uint8Array(privateKeyArray)

      // Create keypair
      return Keypair.fromSecretKey(privateKeyUint8)
    } catch (error) {
      logger.error(`Failed to decrypt keypair for agent ${walletInfo.agentId}`, { error })
      throw error
    }
  }

  /**
   * Get balance for agent
   */
  async getBalance(agentId: string): Promise<number> {
    const wallet = await this.getWallet(agentId)
    if (!wallet) {
      throw new Error(`Wallet not found for agent ${agentId}`)
    }

    const publicKey = new PublicKey(wallet.publicKey)
    const balance = await this.solana.getBalance(publicKey)

    // Update wallet balance
    wallet.balance = balance
    await this.memory.saveWallet(wallet)

    return balance
  }

  /**
   * Check if balance is low and request airdrop if needed
   */
  async checkAndRefillBalance(agentId: string): Promise<void> {
    const balance = await this.getBalance(agentId)

    if (balance < this.lowBalanceThreshold) {
      await logger.warn(`Low balance for agent ${agentId}, requesting airdrop`)

      const wallet = await this.getWallet(agentId)
      if (!wallet) return

      try {
        const publicKey = new PublicKey(wallet.publicKey)
        await this.solana.requestAirdrop(publicKey, this.airdropAmount)

        // Update airdrop count
        wallet.airdropCount += 1
        await this.memory.saveWallet(wallet)

        await logger.info(`Airdrop successful for agent ${agentId}`)
      } catch (error) {
        await logger.error(`Airdrop failed for agent ${agentId}`, { error })
      }
    }
  }

  /**
   * Update wallet last used timestamp
   */
  async updateLastUsed(agentId: string): Promise<void> {
    const wallet = await this.getWallet(agentId)
    if (wallet) {
      wallet.lastUsed = Date.now()
      wallet.transactionCount += 1
      await this.memory.saveWallet(wallet)
    }
  }
}
