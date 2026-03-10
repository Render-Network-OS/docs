// Test fixture types and loaders for TypeScript projects

import walletsData from './wallets.json';
import questsData from './quests.json';
import paymentsData from './payments.json';
import gamesData from './games.json';
import battlesData from './battles.json';
import authChallengeSolanaData from './auth-conformance/challenge-solana.json';
import authChallengeEvmData from './auth-conformance/challenge-evm.json';
import authChallengeTronData from './auth-conformance/challenge-tron.json';
import authVerifySuccessData from './auth-conformance/verify-success.json';
import authSessionSuccessData from './auth-conformance/session-success.json';
import authLogoutSuccessData from './auth-conformance/logout-success.json';
import authClaimsV1Data from './auth-conformance/claims-v1.json';
import authErrorsData from './auth-conformance/errors.json';

// ==================
// Type Definitions
// ==================

export interface Wallet {
  address: string;
  label?: string;
  chain?: string;
  reason?: string;
}

export interface WalletFixtures {
  solana: {
    valid: Wallet[];
    invalid: Wallet[];
  };
  evm: {
    valid: Wallet[];
    invalid: Wallet[];
  };
}

export interface Quest {
  id: number;
  title: string;
  type: 'game_play' | 'social_post' | 'clip_upload' | 'livestream' | 'composite';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  reward_points: number;
  reward_usdc: number;
  reward_type: 'points' | 'usdc' | 'both';
  rules: Record<string, unknown>;
  caps: {
    max_completions: number;
    max_per_user: number;
  };
  active: boolean;
  starts_at?: string;
  ends_at?: string | null;
}

export interface QuestFixtures {
  daily: Quest[];
  weekly: Quest[];
  burn_event: Quest[];
}

export interface Payment {
  id: string;
  wallet: string;
  amount_usdc: number;
  chain_type: 'solana' | 'base' | 'polygon';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tx_hash: string | null;
  reason: string;
  quest_id: number | null;
  battle_id?: string;
  error?: string;
  hyperlink_job_id?: string;
  created_at: string;
  completed_at: string | null;
}

export interface PaymentFixtures {
  completed: Payment[];
  pending: Payment[];
  failed: Payment[];
}

export interface Game {
  id: string;
  name: string;
  score_type: 'HIGHER_BETTER' | 'LOWER_BETTER';
  min_score: number;
  max_score: number;
  description: string;
}

export interface SampleScore {
  raw: number;
  normalized: number;
  rank: number;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  game: string;
  score: number;
  raw_score: number;
}

export interface GameFixtures {
  games: Game[];
  sample_scores: Record<string, SampleScore[]>;
  leaderboard: LeaderboardEntry[];
}

export interface Battle {
  id: string;
  game_id: string;
  creator_wallet: string;
  opponent_wallet: string;
  wager_amount: number;
  currency_mint: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  score_type: 'HIGHER_BETTER' | 'LOWER_BETTER';
  creator_score: number | null;
  opponent_score: number | null;
  winner: string | null;
  payout_tx?: string;
  created_at: string;
  expires_at?: string;
  completed_at?: string;
}

export interface BattleFixtures {
  pending: Battle[];
  in_progress: Battle[];
  completed: Battle[];
}

export interface AuthChallengeFixture {
  success: boolean;
  challengeId: string;
  nonce: string;
  walletAddress: string;
  chainType: string;
  message: string;
  expiresAt: string;
  ttl?: number;
}

export interface AuthSessionFixture {
  authenticated: boolean;
  iss: string;
  aud: string;
  sub: string;
  jti: string;
  iat: number;
  exp: number;
  actorId: string;
  actorType: string;
  authMethod: string;
  policyId: string;
  sessionKind: string;
  subjectUserId: string;
  walletAddress: string;
  chainType: string;
}

export interface AuthConformanceFixtures {
  challenge: {
    solana: AuthChallengeFixture;
    evm: AuthChallengeFixture;
    tron: AuthChallengeFixture;
  };
  verifySuccess: {
    authenticated: boolean;
    token: string;
    session: AuthSessionFixture;
  };
  sessionSuccess: {
    authenticated: boolean;
    session: AuthSessionFixture;
  };
  logoutSuccess: {
    status: number;
    authenticated: boolean;
    cookieCleared: boolean;
  };
  claimsV1: {
    required: string[];
    optional: string[];
  };
  errors: Record<string, { status: number; code: string; error: string }>;
}

// ==================
// Fixture Loaders
// ==================

export const wallets: WalletFixtures = walletsData as WalletFixtures;
export const quests: QuestFixtures = questsData as QuestFixtures;
export const payments: PaymentFixtures = paymentsData as PaymentFixtures;
export const games: GameFixtures = gamesData as GameFixtures;
export const battles: BattleFixtures = battlesData as BattleFixtures;
export const authConformance: AuthConformanceFixtures = {
  challenge: {
    solana: authChallengeSolanaData as AuthChallengeFixture,
    evm: authChallengeEvmData as AuthChallengeFixture,
    tron: authChallengeTronData as AuthChallengeFixture,
  },
  verifySuccess: authVerifySuccessData as AuthConformanceFixtures['verifySuccess'],
  sessionSuccess: authSessionSuccessData as AuthConformanceFixtures['sessionSuccess'],
  logoutSuccess: authLogoutSuccessData as AuthConformanceFixtures['logoutSuccess'],
  claimsV1: authClaimsV1Data as AuthConformanceFixtures['claimsV1'],
  errors: authErrorsData as AuthConformanceFixtures['errors'],
};

// ==================
// Helper Functions
// ==================

export function getValidSolanaWallet(index = 0): Wallet {
  return wallets.solana.valid[index % wallets.solana.valid.length];
}

export function getValidEVMWallet(index = 0): Wallet {
  return wallets.evm.valid[index % wallets.evm.valid.length];
}

export function getRandomWallet(): Wallet {
  const allValid = [...wallets.solana.valid, ...wallets.evm.valid];
  return allValid[Math.floor(Math.random() * allValid.length)];
}

export function getDailyQuest(index = 0): Quest {
  return quests.daily[index % quests.daily.length];
}

export function getWeeklyQuest(index = 0): Quest {
  return quests.weekly[index % quests.weekly.length];
}

export function getCompletedPayment(index = 0): Payment {
  return payments.completed[index % payments.completed.length];
}

export function getPendingPayment(index = 0): Payment {
  return payments.pending[index % payments.pending.length];
}

export function getGame(gameId: string): Game | undefined {
  return games.games.find((g) => g.id === gameId);
}

export function getGamesByScoreType(scoreType: 'HIGHER_BETTER' | 'LOWER_BETTER'): Game[] {
  return games.games.filter((g) => g.score_type === scoreType);
}

export function getPendingBattle(index = 0): Battle {
  return battles.pending[index % battles.pending.length];
}

export function getCompletedBattle(index = 0): Battle {
  return battles.completed[index % battles.completed.length];
}

// ==================
// Test Data Generators
// ==================

export function generatePayment(overrides: Partial<Payment> = {}): Payment {
  const base = getCompletedPayment();
  return {
    ...base,
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function generateQuest(overrides: Partial<Quest> = {}): Quest {
  const base = getDailyQuest();
  return {
    ...base,
    id: Math.floor(Math.random() * 10000),
    ...overrides,
  };
}

export function generateBattle(overrides: Partial<Battle> = {}): Battle {
  const base = getPendingBattle();
  return {
    ...base,
    id: `battle_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ==================
// Validation Helpers
// ==================

export function isValidPaymentStatus(
  status: string
): status is Payment['status'] {
  return ['pending', 'processing', 'completed', 'failed'].includes(status);
}

export function isValidChainType(
  chain: string
): chain is Payment['chain_type'] {
  return ['solana', 'base', 'polygon'].includes(chain);
}

export function isValidBattleStatus(
  status: string
): status is Battle['status'] {
  return ['pending', 'in_progress', 'completed', 'cancelled', 'expired'].includes(
    status
  );
}

export function isValidScoreType(
  type: string
): type is Game['score_type'] {
  return ['HIGHER_BETTER', 'LOWER_BETTER'].includes(type);
}
