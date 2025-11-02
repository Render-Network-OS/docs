use anchor_lang::prelude::*;
use anchor_lang::solana_program::{keccak, system_program};

// Program ID for rewards_record (devnet)
declare_id!("7Y2qvXkXyfNnpMkkLkZ9kfRvVewt4WgpRKXG8VcKByKF");

const CONFIG_SEED: &[u8] = b"config";
const AIRDROP_SEED: &[u8] = b"airdrop";
const VAULT_SEED: &[u8] = b"vault";
const CLAIM_SEED: &[u8] = b"claim";

#[program]
pub mod rewards_record {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.authority = ctx.accounts.authority.key();
        Ok(())
    }

    // Backwards-compatible entrypoint (delegates to commit_epoch)
    pub fn record_airdrop(
        ctx: Context<RecordAirdrop>,
        epoch_id: u64,
        usd_cents: u64,
        sol_lamports: u64,
        total_points: u64,
        recipients: u32,
        root: [u8; 32],
    ) -> Result<()> {
        commit_epoch(
            Context::new(
                ctx.program,
                CommitEpoch {
                    config: ctx.accounts.config,
                    airdrop_epoch: ctx.accounts.airdrop_epoch,
                    authority: ctx.accounts.authority,
                    system_program: ctx.accounts.system_program,
                },
                ctx.bumps.clone(),
            ),
            epoch_id,
            usd_cents,
            sol_lamports,
            total_points,
            recipients,
            root,
        )
    }

    pub fn commit_epoch(
        ctx: Context<CommitEpoch>,
        epoch_id: u64,
        usd_cents: u64,
        sol_lamports: u64,
        total_points: u64,
        recipients: u32,
        root: [u8; 32],
    ) -> Result<()> {
        // Authority gate
        require_keys_eq!(ctx.accounts.config.authority, ctx.accounts.authority.key());

        let epoch = &mut ctx.accounts.airdrop_epoch;
        epoch.epoch_id = epoch_id;
        epoch.usd_cents = usd_cents;
        epoch.sol_lamports = sol_lamports;
        epoch.total_points = total_points;
        epoch.recipients = recipients;
        epoch.root = root;
        epoch.ts = Clock::get()?.unix_timestamp;
        epoch.total_funded = 0;
        epoch.total_claimed = 0;

        emit!(EpochCommitted {
            epoch_id,
            usd_cents,
            sol_lamports,
            total_points,
            recipients,
            root,
        });
        Ok(())
    }

    pub fn fund_vault(ctx: Context<FundVault>, epoch_id: u64, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require_keys_eq!(ctx.accounts.config.authority, ctx.accounts.authority.key());

        // Transfer lamports from authority (system account) to program-owned vault via CPI
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            amount,
        )?;

        let epoch = &mut ctx.accounts.airdrop_epoch;
        epoch.total_funded = epoch
            .total_funded
            .checked_add(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        emit!(VaultFunded { epoch_id, amount });
        Ok(())
    }

    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        epoch_id: u64,
        points: u64,
        lamports: u64,
        proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        require!(lamports > 0, ErrorCode::InvalidAmount);
        let epoch = &mut ctx.accounts.airdrop_epoch;
        // verify merkle proof
        let leaf = leaf_hash(&ctx.accounts.recipient.key(), points, lamports);
        require!(verify_merkle_proof(&leaf, &epoch.root, &proof), ErrorCode::MerkleVerificationFailed);

        // move lamports from vault to recipient
        let vault_info = ctx.accounts.vault.to_account_info();
        {
            let vault_lamports = vault_info.try_borrow_lamports()?;
            require!(**vault_lamports >= lamports, ErrorCode::InsufficientVault);
        }
        {
            let mut from_lamports = vault_info.try_borrow_mut_lamports()?;
            *from_lamports -= lamports;
        }
        let recipient_info = ctx.accounts.recipient.to_account_info();
        {
            let mut to_lamports = recipient_info.try_borrow_mut_lamports()?;
            *to_lamports += lamports;
        }

        epoch.total_claimed = epoch
            .total_claimed
            .checked_add(lamports)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        require!(epoch.total_claimed <= epoch.total_funded, ErrorCode::InsufficientVault);

        emit!(RewardClaimed { epoch_id, recipient: ctx.accounts.recipient.key(), lamports });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Config::SIZE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64, usd_cents: u64, sol_lamports: u64, total_points: u64, recipients: u32, root: [u8; 32])]
pub struct RecordAirdrop<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = authority,
        space = 8 + AirdropEpoch::SIZE,
        seeds = [AIRDROP_SEED, &epoch_id.to_le_bytes()],
        bump
    )]
    pub airdrop_epoch: Account<'info, AirdropEpoch>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64, usd_cents: u64, sol_lamports: u64, total_points: u64, recipients: u32, root: [u8; 32])]
pub struct CommitEpoch<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = authority,
        space = 8 + AirdropEpoch::SIZE,
        seeds = [AIRDROP_SEED, &epoch_id.to_le_bytes()],
        bump
    )]
    pub airdrop_epoch: Account<'info, AirdropEpoch>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64, amount: u64)]
pub struct FundVault<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [AIRDROP_SEED, &epoch_id.to_le_bytes()],
        bump
    )]
    pub airdrop_epoch: Account<'info, AirdropEpoch>,
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + Vault::SIZE,
        seeds = [VAULT_SEED, &epoch_id.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64, points: u64, lamports: u64)]
pub struct ClaimReward<'info> {
    #[account(
        mut,
        seeds = [AIRDROP_SEED, &epoch_id.to_le_bytes()],
        bump
    )]
    pub airdrop_epoch: Account<'info, AirdropEpoch>,
    #[account(
        mut,
        seeds = [VAULT_SEED, &epoch_id.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub recipient: SystemAccount<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + ClaimReceipt::SIZE,
        seeds = [CLAIM_SEED, airdrop_epoch.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub claim_receipt: Account<'info, ClaimReceipt>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Config {
    pub authority: Pubkey,
}

impl Config {
    pub const SIZE: usize = 32;
}

#[account]
pub struct AirdropEpoch {
    pub epoch_id: u64,
    pub usd_cents: u64,
    pub sol_lamports: u64,
    pub total_points: u64,
    pub recipients: u32,
    pub root: [u8; 32],
    pub ts: i64,
    pub total_funded: u64,
    pub total_claimed: u64,
}

impl AirdropEpoch {
    pub const SIZE: usize = 8 + // epoch_id
        8 + // usd_cents
        8 + // sol_lamports
        8 + // total_points
        4 + // recipients
        32 + // root
        8 + // ts
        8 + // total_funded
        8; // total_claimed
}

#[event]
pub struct EpochCommitted {
    pub epoch_id: u64,
    pub usd_cents: u64,
    pub sol_lamports: u64,
    pub total_points: u64,
    pub recipients: u32,
    pub root: [u8; 32],
}

#[event]
pub struct VaultFunded {
    pub epoch_id: u64,
    pub amount: u64,
}

#[event]
pub struct RewardClaimed {
    pub epoch_id: u64,
    pub recipient: Pubkey,
    pub lamports: u64,
}

#[account]
pub struct Vault {
    pub bump: u8,
}

impl Vault { pub const SIZE: usize = 1; }

#[account]
pub struct ClaimReceipt {
    pub recipient: Pubkey,
    pub bump: u8,
    pub claimed_at: i64,
}

impl ClaimReceipt { pub const SIZE: usize = 32 + 1 + 8; }

fn leaf_hash(recipient: &Pubkey, points: u64, lamports: u64) -> [u8; 32] {
    let mut p = [0u8; 8];
    p.copy_from_slice(&points.to_le_bytes());
    let mut a = [0u8; 8];
    a.copy_from_slice(&lamports.to_le_bytes());
    keccak::hashv(&[recipient.as_ref(), &p, &a]).to_bytes()
}

fn verify_merkle_proof(leaf: &[u8; 32], root: &[u8; 32], proof: &[[u8; 32]]) -> bool {
    if proof.is_empty() { return leaf == root; }
    let mut hash = *leaf;
    for sibling in proof {
        let (left, right) = if hash <= *sibling { (hash, *sibling) } else { (*sibling, hash) };
        hash = keccak::hashv(&[&left, &right]).to_bytes();
    }
    &hash == root
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")] InvalidAmount,
    #[msg("Vault balance insufficient")] InsufficientVault,
    #[msg("Merkle proof verification failed")] MerkleVerificationFailed,
    #[msg("Math overflow")] ArithmeticOverflow,
}


