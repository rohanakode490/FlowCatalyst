import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

export async function transferSOL(
  toPublicKey: string | PublicKey,
  amountInSol: number,
  rpcUrl: string = "https://api.mainnet-beta.solana.com",
) {
  try {
    // Validate inputs
    if (amountInSol <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Load the private key from the .env file
    const privateKeyBase58 = process.env.SOLANA_PRIVATE_KEY;
    if (!privateKeyBase58) {
      throw new Error("Private key not found in .env file");
    }

    // Convert the private key from base58 to Uint8Array
    const fromPrivateKey = bs58.decode(privateKeyBase58);
    const senderKeypair = Keypair.fromSecretKey(fromPrivateKey);

    // Connect to the Solana network
    const connection = new Connection(rpcUrl, "confirmed");

    // Convert the recipient's public key to a PublicKey object
    const recipientPublicKey =
      typeof toPublicKey === "string"
        ? new PublicKey(toPublicKey)
        : toPublicKey;

    // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
    const lamports = amountInSol * 1e9;

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

  } catch (error) {
    console.error("SOL transfer failed:", error);
    throw error;
  }
}
