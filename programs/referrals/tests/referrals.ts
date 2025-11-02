import * as anchor from "@coral-xyz/anchor";
import { Program, BN, web3 } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount } from "@solana/spl-token";

describe("referrals", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const payer = provider.wallet as anchor.Wallet;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const idl = require("../target/idl/referrals.json");
  const program = new Program(idl as any, idl.metadata.address, provider);

  const USDC_DECIMALS = 6;
  let usdcMint: web3.PublicKey;

  const airdrop = async (kp: web3.PublicKey, lamports = 2e9) => {
    const sig = await connection.requestAirdrop(kp, lamports);
    await connection.confirmTransaction(sig, "confirmed");
  };

  it("init_config, fund_vault, reward_first_five", async () => {
    // Create a USDC mint and mint to authority
    await airdrop(payer.publicKey);
    usdcMint = await createMint(connection, payer.payer, payer.publicKey, null, USDC_DECIMALS);
    const authorityUsdcAta = await getOrCreateAssociatedTokenAccount(connection, payer.payer, usdcMint, payer.publicKey);
    await mintTo(connection, payer.payer, usdcMint, authorityUsdcAta.address, payer.publicKey, 1_000_000_000n); // 1000 USDC

    // PDAs
    const [config] = web3.PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
    const [vault] = web3.PublicKey.findProgramAddressSync([Buffer.from("vault"), config.toBuffer()], program.programId);
    const vaultAta = getAssociatedTokenAddressSync(usdcMint, vault, true);

    // init_config
    await program.methods.initConfig().accounts({
      config,
      authority: payer.publicKey,
      usdcMint,
      systemProgram: web3.SystemProgram.programId,
    }).rpc();

    // fund_vault 10 USDC
    await program.methods.fundVault(new BN(10_000_000)).accounts({
      config,
      authority: payer.publicKey,
      usdcMint,
      vault,
      vaultAta,
      authorityUsdcAta: authorityUsdcAta.address,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
      systemProgram: web3.SystemProgram.programId,
    }).rpc();

    // reward_first_five for a referrer & referred
    const referrer = web3.Keypair.generate();
    const referred = web3.Keypair.generate();
    await airdrop(referrer.publicKey);
    await airdrop(referred.publicKey);
    const referrerAta = getAssociatedTokenAddressSync(usdcMint, referrer.publicKey);
    const [stats] = web3.PublicKey.findProgramAddressSync([Buffer.from("stats"), referrer.publicKey.toBuffer()], program.programId);
    const [receipt] = web3.PublicKey.findProgramAddressSync([Buffer.from("ref"), referrer.publicKey.toBuffer(), referred.publicKey.toBuffer()], program.programId);

    await program.methods.rewardFirstFive().accounts({
      config,
      authority: payer.publicKey,
      usdcMint,
      vault,
      vaultAta,
      referrer: referrer.publicKey,
      referred: referred.publicKey,
      referrerStats: stats,
      claimReceipt: receipt,
      referrerUsdcAta: referrerAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
      systemProgram: web3.SystemProgram.programId,
    }).rpc();

    // Verify referrer received 1 USDC
    const acct = await getAccount(connection, referrerAta);
    expect(Number(acct.amount)).toBe(1_000_000);

    // Idempotency for same pair (should fail)
    await expect(async () => {
      await program.methods.rewardFirstFive().accounts({
        config,
        authority: payer.publicKey,
        usdcMint,
        vault,
        vaultAta,
        referrer: referrer.publicKey,
        referred: referred.publicKey,
        referrerStats: stats,
        claimReceipt: receipt,
        referrerUsdcAta: referrerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
        systemProgram: web3.SystemProgram.programId,
      }).rpc();
    }).rejects.toThrow();
  }, 120_000);
});


