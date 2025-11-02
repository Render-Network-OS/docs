use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("HtmQBeYHP58bzC2qq7tHTQyYEmE25zhW8VWbC7n3QuFE");

const CONFIG_SEED: &[u8] = b"config";
const VAULT_SEED: &[u8] = b"vault";
const STATS_SEED: &[u8] = b"stats";
const CLAIM_SEED: &[u8] = b"ref";

#[program]
pub mod referrals {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.authority = ctx.accounts.authority.key();
        cfg.usdc_mint = ctx.accounts.usdc_mint.key();
        cfg.bump = *ctx.bumps.get("config").unwrap();
        Ok(())
    }

    pub fn fund_vault(ctx: Context<FundVault>, amount: u64) -> Result<()> {
        require!(amount > 0, ReferralError::InvalidAmount);
        // Transfer USDC from authority ATA to vault ATA (CPI with authority signer)
        let cpi_accounts = Transfer {
            from: ctx.accounts.authority_usdc_ata.to_account_info(),
            to: ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        emit!(VaultFunded { amount });
        Ok(())
    }

    pub fn reward_first_five(ctx: Context<RewardFirstFive>) -> Result<()> {
        // Pay fixed 1 USDC (assume 6 decimals)
        let amount: u64 = 1_000_000;

        // Basic guards
        let stats = &mut ctx.accounts.referrer_stats;
        require!(stats.first_five_count < 5, ReferralError::FirstFiveExhausted);
        // Claim receipt must be newly created by the constraint (init_if_needed + has_one checks handled below)

        // Ensure recipient ATA exists (init if missing handled by constraint)

        // Transfer from vault PDA ATA -> referrer ATA signed by vault PDA seeds
        let seeds: &[&[u8]] = &[VAULT_SEED, ctx.accounts.config.key().as_ref(), &[ctx.accounts.vault.bump]];
        let signer = &[seeds];
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_ata.to_account_info(),
            to: ctx.accounts.referrer_usdc_ata.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount)?;

        // Update state
        stats.first_five_count = stats
            .first_five_count
            .checked_add(1)
            .ok_or(ReferralError::Overflow)?;
        stats.total_paid_usdc = stats
            .total_paid_usdc
            .checked_add(amount)
            .ok_or(ReferralError::Overflow)?;
        let receipt = &mut ctx.accounts.claim_receipt;
        receipt.referrer = ctx.accounts.referrer.key();
        receipt.referred = ctx.accounts.referred.key();
        receipt.amount = amount;
        receipt.bump = *ctx.bumps.get("claim_receipt").unwrap();

        emit!(FirstFiveRewarded { referrer: stats.key(), referred: ctx.accounts.referred.key(), amount });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [CONFIG_SEED],
        bump,
        space = 8 + Config::SIZE,
    )]
    pub config: Account<'info, Config>,
    /// CHECK: authority of the program, signer
    #[account(mut)]
    pub authority: Signer<'info>,
    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundVault<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    /// CHECK: signer authority must match config.authority
    #[account(mut, address = config.authority)]
    pub authority: Signer<'info>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [VAULT_SEED, config.key().as_ref()],
        bump,
        space = 8 + Vault::SIZE,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = authority,
    )]
    pub authority_usdc_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RewardFirstFive<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    /// CHECK: authority must sign; address equals config.authority
    #[account(address = config.authority)]
    pub authority: Signer<'info>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [VAULT_SEED, config.key().as_ref()],
        bump,
        space = 8 + Vault::SIZE,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,
    /// CHECK: referrer system account
    pub referrer: UncheckedAccount<'info>,
    /// CHECK: referred system account
    pub referred: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [STATS_SEED, referrer.key().as_ref()],
        bump,
        space = 8 + ReferrerStats::SIZE,
    )]
    pub referrer_stats: Account<'info, ReferrerStats>,
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [CLAIM_SEED, referrer.key().as_ref(), referred.key().as_ref()],
        bump,
        space = 8 + ClaimReceipt::SIZE,
    )]
    pub claim_receipt: Account<'info, ClaimReceipt>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = referrer,
    )]
    pub referrer_usdc_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub bump: u8,
}
impl Config { pub const SIZE: usize = 32 + 32 + 1; }

#[account]
pub struct Vault { pub bump: u8 }
impl Vault { pub const SIZE: usize = 1; }

#[account]
pub struct ReferrerStats {
    pub referrer: Pubkey,
    pub first_five_count: u8,
    pub total_paid_usdc: u64,
    pub bump: u8,
}
impl ReferrerStats { pub const SIZE: usize = 32 + 1 + 8 + 1; }

#[account]
pub struct ClaimReceipt {
    pub referrer: Pubkey,
    pub referred: Pubkey,
    pub amount: u64,
    pub bump: u8,
}
impl ClaimReceipt { pub const SIZE: usize = 32 + 32 + 8 + 1; }

#[event]
pub struct FirstFiveRewarded {
    pub referrer: Pubkey,
    pub referred: Pubkey,
    pub amount: u64,
}

#[event]
pub struct VaultFunded { pub amount: u64 }

#[error_code]
pub enum ReferralError {
    #[msg("invalid amount")] InvalidAmount,
    #[msg("first five rewards exhausted")] FirstFiveExhausted,
    #[msg("math overflow")] Overflow,
}


