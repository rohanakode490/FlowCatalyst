import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

/**
 * Transfers SOL from one account to another.
 * @param toPublicKey The recipient's public key
 * @param amountInSol The amount of SOL to transfer
 * @param rpcUrl The RPC endpoint URL
 * @param privateKeyBase58 The sender's private key (Base58 encoded)
 */
export async function transferSOL(
  toPublicKey: string | PublicKey,
  amountInSol: number,
  rpcUrl: string = "https://api.mainnet-beta.solana.com",
  privateKeyBase58?: string,
) {
  try {
    // Validate inputs
    if (amountInSol <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Use the provided private key, or fallback to the .env key (legacy/system default)
    const activePrivateKey = privateKeyBase58 || process.env.SOLANA_PRIVATE_KEY;

    if (!activePrivateKey) {
      throw new Error("No Solana private key provided or found in environment");
    }

    // Convert the private key from base58 to Uint8Array
    const fromPrivateKey = bs58.decode(activePrivateKey);
    const senderKeypair = Keypair.fromSecretKey(fromPrivateKey);

    // Connect to the Solana network
    const connection = new Connection(rpcUrl, "confirmed");

    // Convert the recipient's public key to a PublicKey object
    const recipientPublicKey =
      typeof toPublicKey === "string"
        ? new PublicKey(toPublicKey)
        : toPublicKey;

    // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
    const lamports = Math.round(amountInSol * 1e9);

    // Create a transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: senderKeypair.publicKey,
      toPubkey: recipientPublicKey,
      lamports,
    });

    // Create a transaction and add the transfer instruction
    const transaction = new Transaction().add(transferInstruction);

    // Send and confirm the transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      senderKeypair,
    ]);
    
    return signature;
  } catch (error) {
    console.error("SOL transfer failed:", error);
    throw error;
  }
}
