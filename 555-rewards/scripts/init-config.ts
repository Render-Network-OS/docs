import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, TransactionInstruction } from "@solana/web3.js";
import * as fs from "fs";
import { config as loadEnv } from "dotenv";
import path from "path";

// Devnet USDC mint (standard Circle USDC on devnet)
const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

async function main() {
  console.log("🔧 Initializing Rewards Program Config\n");

  // Load .env file
  const envPath = process.env.FIVE55_ENV_PATH ?? path.resolve(__dirname, "../.env");
  loadEnv({ path: envPath, override: false });

  // Get program ID
  const programIdStr = process.env.REWARDS_PROGRAM_ID || "ficrNNa5WqdR21xPwAagh44Vo4f81z7E1pN8y9Q6vSq";
  const programId = new PublicKey(programIdStr);
  console.log(`📦 Program ID: ${programId.toString()}`);

  // Get RPC URL
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || process.env.RPC_URL || "https://api.devnet.solana.com";
  console.log(`📡 RPC: ${rpcUrl}`);

  // Load authority wallet
  const authorityPath = process.env.ANCHOR_WALLET || process.env.AUTHORITY_KEY_PATH || "/Users/mac/Desktop/Work/555/wallets/555dwh5bTVPaKFetr3uGWjtpX6sUb7B6udKM7Xim692Z.json";
  const authorityJson = process.env.AUTHORITY_WALLET_JSON;

  let authorityKeypair: Keypair;
  if (authorityJson) {
    const keyArray = JSON.parse(authorityJson);
    authorityKeypair = Keypair.fromSecretKey(Buffer.from(keyArray));
    console.log("✅ Loaded authority from AUTHORITY_WALLET_JSON");
  } else {
    if (!fs.existsSync(authorityPath)) {
      throw new Error(`Authority file not found: ${authorityPath}`);
    }
    const keyData = JSON.parse(fs.readFileSync(authorityPath, "utf-8"));
    authorityKeypair = Keypair.fromSecretKey(Buffer.from(keyData));
    console.log(`✅ Loaded authority from: ${authorityPath}`);
  }

  const authorityPubkey = authorityKeypair.publicKey.toString();
  console.log(`👤 Authority: ${authorityPubkey}\n`);

  // Setup connection
  const connection = new Connection(rpcUrl, "confirmed");

  // Get USDC mint (use provided or devnet default)
  const usdcMintStr = process.env.USDC_MINT || DEVNET_USDC_MINT;
  const usdcMint = new PublicKey(usdcMintStr);
  console.log(`💰 USDC Mint: ${usdcMint.toString()}`);

  // Derive config PDA
  const [configPDA, configBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );
  console.log(`⚙️  Config PDA: ${configPDA.toString()}`);
  console.log(`   Bump: ${configBump}\n`);

  // Check if config already exists
  const configAccount = await connection.getAccountInfo(configPDA);
  if (configAccount) {
    console.log("⚠️  Config PDA already initialized!");
    // Decode config data manually (8 byte discriminator + 32 byte authority + 32 byte mint)
    const configData = configAccount.data;
    if (configData.length >= 72) {
      const authorityFromData = new PublicKey(configData.slice(8, 40));
      const mintFromData = new PublicKey(configData.slice(40, 72));
      console.log(`   Authority: ${authorityFromData.toString()}`);
      console.log(`   USDC Mint: ${mintFromData.toString()}`);
      if (mintFromData.toString() !== usdcMint.toString()) {
        console.log(`\n⚠️  WARNING: USDC mint mismatch!`);
        console.log(`   Expected: ${usdcMint.toString()}`);
        console.log(`   Found: ${mintFromData.toString()}`);
      }
    }
    return;
  }

  // Build init_config instruction using discriminator from IDL
  // Discriminator: [23, 235, 115, 232, 168, 96, 1, 231] (8 bytes from IDL)
  console.log("🚀 Initializing config PDA...");
  
  const instructionData = Buffer.from([23, 235, 115, 232, 168, 96, 1, 231]);

  const instruction = new TransactionInstruction({
    programId: programId,
    keys: [
      { pubkey: configPDA, isSigner: false, isWritable: true },
      { pubkey: authorityKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: usdcMint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(
    connection,
    tx,
    [authorityKeypair],
    { commitment: "confirmed" }
  );

  console.log(`✅ Config initialized successfully!`);
  console.log(`📝 Transaction: ${signature}\n`);

  // Verify
  const newConfigAccount = await connection.getAccountInfo(configPDA);
  if (newConfigAccount) {
    const configData = newConfigAccount.data;
    const authorityFromData = new PublicKey(configData.slice(8, 40));
    const mintFromData = new PublicKey(configData.slice(40, 72));
    console.log("📊 Config Data:");
    console.log(`   Authority: ${authorityFromData.toString()}`);
    console.log(`   USDC Mint: ${mintFromData.toString()}`);
  }
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  if (err.logs) {
    console.error("\nLogs:", err.logs);
  }
  console.error(err);
  process.exit(1);
});
