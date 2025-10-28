import * as anchor from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { strict as assert } from "assert";

describe("lottery airdrop setup", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  it("airdrops SOL to the default provider wallet", async () => {
    const payer = provider.wallet.publicKey;
    const before = await connection.getBalance(payer);
    const signature = await connection.requestAirdrop(payer, LAMPORTS_PER_SOL);
    const latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      { signature, ...latest },
      "confirmed",
    );
    const after = await connection.getBalance(payer);
    assert.ok(after >= before + LAMPORTS_PER_SOL, "provider wallet did not receive the expected airdrop");
  });

  it("airdrops SOL to a dedicated payout authority", async () => {
    const payoutAuthority = Keypair.generate();
    const signature = await connection.requestAirdrop(
      payoutAuthority.publicKey,
      LAMPORTS_PER_SOL,
    );
    const latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      { signature, ...latest },
      "confirmed",
    );
    const balance = await connection.getBalance(payoutAuthority.publicKey);
    assert.ok(balance >= LAMPORTS_PER_SOL, "payout authority airdrop failed");
  });
});

