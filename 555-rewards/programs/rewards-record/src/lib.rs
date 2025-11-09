use anchor_lang::prelude::*;
use solana_keccak_hasher;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// Program ID for rewards_record (devnet/testnet)
declare_id!("ficrNNa5WqdR21xPwAagh44Vo4f81z7E1pN8y9Q6vSq");

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
        cfg.usdc_mint = ctx.accounts.usdc_mint.key();
        Ok(())
    }

    // Backwards-compatible entrypoint (delegates to commit_epoch)
    pub fn record_airdrop(
        ctx: Context<RecordAirdrop>,
        epoch_id: u64,
        usd_cents: u64,
        usdc_amount: u64, // USDC base units (6 decimals) instead of sol_lamports
        total_points: u64,
        recipients: u32,
        root: [u8; 32],
    ) -> Result<()> {
        // Authority gate
        require_keys_eq!(ctx.accounts.config.authority, ctx.accounts.authority.key());

        let epoch = &mut ctx.accounts.airdrop_epoch;
        epoch.epoch_id = epoch_id;
        epoch.usd_cents = usd_cents;
        epoch.usdc_amount = usdc_amount; // USDC base units
        epoch.total_points = total_points;
        epoch.recipients = recipients;
        epoch.root = root;
        epoch.ts = Clock::get()?.unix_timestamp;
        epoch.total_funded = 0;
        epoch.total_claimed = 0;

        emit!(EpochCommitted {
            epoch_id,
            usd_cents,
            usdc_amount,
            total_points,
            recipients,
            root,
        });
        Ok(())
    }

    pub fn commit_epoch(
        ctx: Context<CommitEpoch>,
        epoch_id: u64,
        usd_cents: u64,
        usdc_amount: u64, // USDC base units (6 decimals) instead of sol_lamports
        total_points: u64,
        recipients: u32,
        root: [u8; 32],
    ) -> Result<()> {
        // Authority gate
        require_keys_eq!(ctx.accounts.config.authority, ctx.accounts.authority.key());

        let epoch = &mut ctx.accounts.airdrop_epoch;
        epoch.epoch_id = epoch_id;
        epoch.usd_cents = usd_cents;
        epoch.usdc_amount = usdc_amount; // USDC base units
        epoch.total_points = total_points;
        epoch.recipients = recipients;
        epoch.root = root;
        epoch.ts = Clock::get()?.unix_timestamp;
        epoch.total_funded = 0;
        epoch.total_claimed = 0;

        emit!(EpochCommitted {
            epoch_id,
            usd_cents,
            usdc_amount,
            total_points,
            recipients,
            root,
        });
        Ok(())
    }

    pub fn fund_vault(ctx: Context<FundVault>, epoch_id: u64, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require_keys_eq!(ctx.accounts.config.authority, ctx.accounts.authority.key());

        // Transfer USDC from authority ATA to vault ATA via CPI
        let cpi_accounts = Transfer {
            from: ctx.accounts.authority_usdc_ata.to_account_info(),
            to: ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;

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
        usdc_amount: u64, // USDC base units (6 decimals) instead of lamports
        proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        require!(usdc_amount > 0, ErrorCode::InvalidAmount);
        let epoch = &mut ctx.accounts.airdrop_epoch;
        // verify merkle proof
        let leaf = leaf_hash(&ctx.accounts.recipient.key(), points, usdc_amount);
        require!(
            verify_merkle_proof(&leaf, &epoch.root, &proof),
            ErrorCode::MerkleVerificationFailed
        );

        // Transfer USDC from vault ATA to recipient ATA via CPI
        let seeds: &[&[u8]] = &[
            VAULT_SEED,
            &epoch_id.to_le_bytes(),
            &[ctx.accounts.vault.bump],
        ];
        let signer = &[seeds];
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_ata.to_account_info(),
            to: ctx.accounts.recipient_usdc_ata.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, usdc_amount)?;

        epoch.total_claimed = epoch
            .total_claimed
            .checked_add(usdc_amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        require!(
            epoch.total_claimed <= epoch.total_funded,
            ErrorCode::InsufficientVault
        );

        emit!(RewardClaimed {
            epoch_id,
            recipient: ctx.accounts.recipient.key(),
            usdc_amount,
        });
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
    /// CHECK: USDC mint account (verified via associated_token constraints)
    pub usdc_mint: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64, usd_cents: u64, usdc_amount: u64, total_points: u64, recipients: u32, root: [u8; 32])]
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
#[instruction(epoch_id: u64, usd_cents: u64, usdc_amount: u64, total_points: u64, recipients: u32, root: [u8; 32])]
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
        mut,
        seeds = [VAULT_SEED, &epoch_id.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: USDC mint account (verified via associated_token constraints)
    pub usdc_mint: UncheckedAccount<'info>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = authority)]
    pub authority_usdc_ata: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = vault)]
    pub vault_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64, points: u64, usdc_amount: u64)]
pub struct ClaimReward<'info> {
    #[account(
        mut,
        seeds = [AIRDROP_SEED, &epoch_id.to_le_bytes()],
        bump
    )]
    pub airdrop_epoch: Account<'info, AirdropEpoch>,
    #[account(
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    /// CHECK: USDC mint account (verified via associated_token constraints)
    pub usdc_mint: UncheckedAccount<'info>,
    #[account(
        seeds = [VAULT_SEED, &epoch_id.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    /// CHECK: recipient system account
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
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
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = vault)]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = recipient)]
    pub recipient_usdc_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
}

impl Config {
    pub const SIZE: usize = 32 + 32; // authority + usdc_mint
}

#[account]
pub struct AirdropEpoch {
    pub epoch_id: u64,
    pub usd_cents: u64,
    pub usdc_amount: u64, // USDC base units (6 decimals) instead of sol_lamports
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
        8 + // usdc_amount
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
    pub usdc_amount: u64,
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
    pub usdc_amount: u64,
}

#[account]
pub struct Vault {
    pub bump: u8,
}

impl Vault {
    pub const SIZE: usize = 1;
}

#[account]
pub struct ClaimReceipt {
    pub recipient: Pubkey,
    pub bump: u8,
    pub claimed_at: i64,
}

impl ClaimReceipt {
    pub const SIZE: usize = 32 + 1 + 8;
}

fn leaf_hash(recipient: &Pubkey, points: u64, usdc_amount: u64) -> [u8; 32] {
    let mut p = [0u8; 8];
    p.copy_from_slice(&points.to_le_bytes());
    let mut a = [0u8; 8];
    a.copy_from_slice(&usdc_amount.to_le_bytes());
    solana_keccak_hasher::hashv(&[recipient.as_ref(), &p, &a]).to_bytes()
}

fn verify_merkle_proof(leaf: &[u8; 32], root: &[u8; 32], proof: &[[u8; 32]]) -> bool {
    if proof.is_empty() {
        return leaf == root;
    }
    let mut hash = *leaf;
    for sibling in proof {
        let (left, right) = if hash <= *sibling {
            (hash, *sibling)
        } else {
            (*sibling, hash)
        };
        hash = solana_keccak_hasher::hashv(&[&left, &right]).to_bytes();
    }
    &hash == root
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Vault balance insufficient")]
    InsufficientVault,
    #[msg("Merkle proof verification failed")]
    MerkleVerificationFailed,
    #[msg("Math overflow")]
    ArithmeticOverflow,
}

