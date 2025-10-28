# 555 – Solana 5-number lottery (no program)

## Project Structure

```
555/
├── backend/           # Go backend API server
│   ├── cmd/555d/     # Main application entry point
│   ├── internal/     # Internal Go packages
│   ├── chat/         # Chat integration scripts
│   └── build/        # Docker build files
├── frontend/         # Next.js frontend application
│   ├── src/app/      # Next.js App Router pages
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
└── README.md         # This file
```

## Quick Start

### Backend (Go API Server)

```bash
cd backend
cp .env.example .env
# Edit AUTHORITY_KEY, PUMP_TOKEN_ADDRESS, TOKEN_555_MINT
# Optionally configure REWARDS_WALLET for automatic scheduling
make run
```

### Frontend (Next.js)

```bash
cd frontend
bun install
bun run dev
```

### Full Stack Development

```bash
# Terminal 1 - Backend
cd backend && make run

# Terminal 2 - Frontend
cd frontend && bun run dev
```

## Environment Variables

### Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure the following variables:

#### Required Variables
- **`AUTHORITY_KEY`** *(Required)*: Solana private key for the lottery wallet
  - Generate a new Solana keypair for production
  - Never use mainnet keys in development
  - Example: `AUTHORITY_KEY=your_solana_private_key_here`

#### Solana Configuration
- **`RPC_URL`**: Solana RPC endpoint
  - Default: `https://api.devnet.solana.com`
  - Production: `https://api.mainnet-beta.solana.com`
  - Devnet: `https://api.devnet.solana.com`

#### Server Configuration
- **`BIND_ADDR`**: Server bind address and port
  - Default: `0.0.0.0:9000`
  - Production: `0.0.0.0:9000`

#### Lottery Configuration
- **`ROUND_DURATION_SLOTS`**: Round duration in Solana slots
  - Default: `216000` (≈24 hours)
- **`TICKET_PRICE_LAMPORTS`**: Ticket price in lamports
  - Default: `100000000` (0.1 SOL)

#### Automatic Round Scheduling
- **`REWARDS_WALLET`**: Solana public key for rewards wallet
  - Optional: Leave empty to disable auto-scheduling
- **`ROUND_START_THRESHOLD_SOL`**: Minimum SOL to start round
  - Default: `1.0`
- **`ROUND_DURATION_MINUTES`**: Round duration in minutes
  - Default: `30`
- **`COOLDOWN_DURATION_MINUTES`**: Cooldown between rounds
  - Default: `15`

#### Chat Integration
- **`PUMP_TOKEN_ADDRESS`**: Pump.fun token address for chat monitoring
- **`TOKEN_555_MINT`**: $555 token mint address

### Frontend Environment Variables

Copy `frontend/.env.example` to `frontend/.env` and configure:

#### Next.js Configuration
- **`NEXT_PUBLIC_APP_URL`**: Frontend application URL
  - Default: `http://localhost:3000`

#### API Configuration
- **`NEXT_PUBLIC_API_URL`**: Backend API URL
  - Default: `http://localhost:9000`
  - Proxied through Next.js for security

#### Feature Flags
- **`NEXT_PUBLIC_DEV_MODE`**: Enable development features
  - Default: `true`
- **`NEXT_PUBLIC_ENABLE_CHAT`**: Enable chat integration
  - Default: `true`
- **`NEXT_PUBLIC_ENABLE_AUTO_SCHEDULING`**: Enable auto-scheduling
  - Default: `true`

#### UI Configuration
- **`NEXT_PUBLIC_DEFAULT_THEME`**: Default theme (light/dark)
  - Default: `dark`
- **`NEXT_PUBLIC_ENABLE_ANIMATIONS`**: Enable animations
  - Default: `true`

### Setting Up Environment Variables

#### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

#### Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env with your values (optional, defaults work for development)
```

### Security Notes

#### Backend Security
- **Never commit `.env` files** to version control
- Use different keys for different environments
- Store `AUTHORITY_KEY` securely
- Consider hardware wallets for mainnet operations

#### Frontend Security
- Only expose necessary variables with `NEXT_PUBLIC_` prefix
- Never expose sensitive data (API keys, private keys) to client
- Use server-side environment variables for sensitive operations

### Environment Examples

#### Development Environment
```bash
# Backend .env
AUTHORITY_KEY=your_dev_private_key
RPC_URL=https://api.devnet.solana.com
BIND_ADDR=0.0.0.0:9000
ROUND_DURATION_MINUTES=5  # Shorter rounds for testing
COOLDOWN_DURATION_MINUTES=1

# Frontend .env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_DEV_MODE=true
```

#### Production Environment
```bash
# Backend .env
AUTHORITY_KEY=your_production_private_key
RPC_URL=https://api.mainnet-beta.solana.com
BIND_ADDR=0.0.0.0:9000
ROUND_DURATION_MINUTES=30
COOLDOWN_DURATION_MINUTES=15
REWARDS_WALLET=your_rewards_wallet_address

# Frontend .env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Lottery Types

### Traditional Lottery (SOL-based)
- Users buy tickets with 0.1 SOL transfers
- Merkle tree verification
- Block hash randomness

### Chat-Based Lottery ($555 token-based)
- Users submit numbers in chat (e.g., "1 2 3 4 5")
- $555 token holders only (at least 55555 tokens)
- Real-time chat monitoring
- Automatic eligibility verification

## API Endpoints

### Traditional Lottery
```
POST /round               -> create round
POST /round/{id}/ticket   -> buy ticket (0.1 SOL)
POST /round/{id}/finalize -> finalize round
GET  /round/{id}          -> get round state
```

### Chat-Based Lottery
```
POST /chat/round                    -> create chat round
POST /chat/round/{id}/start         -> start accepting entries
GET  /chat/round/{id}/entries       -> get eligible entries
POST /chat/round/{id}/finalize      -> finalize and draw
GET  /chat/status                   -> chat integration status
```

### Automatic Round Scheduling
```
GET  /auto/status                   -> get automatic scheduling status
POST /auto/start                    -> start automatic scheduling
POST /auto/stop                     -> stop automatic scheduling
```

## Environment Variables

Create `backend/.env` with:

```bash
# Required
AUTHORITY_KEY=your_private_key_base58
RPC_URL=https://api.devnet.solana.com

# Chat-based lottery (optional)
PUMP_TOKEN_ADDRESS=token_address_here    # pump.fun token for chat tracking
TOKEN_555_MINT=token_mint_here          # $555 token mint for eligibility

# Traditional lottery
ROUND_DURATION_SLOTS=216000
TICKET_PRICE_LAMPORTS=100000000
```

## Chat Integration

The system integrates with pump.fun chat rooms to:

1. **Monitor messages** in real-time using WebSocket
2. **Parse lottery entries** (e.g., "1 2 3 4 5", "1,2,3,4,5", "1-2-3-4-5")
3. **Verify $555 token holdings** (≥55555 tokens required)
4. **Filter entries by round** (ignore entries from previous rounds)
5. **Enforce timeouts** (no entries after round ends)

## Automatic Round Scheduling

The system can automatically manage round lifecycles based on wallet balance:

### Features
- **Wallet Balance Monitoring** - Monitors rewards wallet SOL balance every 30 seconds
- **Threshold Triggering** - Starts new round when balance reaches configured threshold (default: 1 SOL)
- **30-Minute Rounds** - Each round runs for exactly 30 minutes
- **15-Minute Cooldown** - Mandatory cooldown period between rounds
- **Continuous Cycling** - Automatically repeats the cycle indefinitely

### Configuration
```bash
# Required for automatic scheduling
REWARDS_WALLET=your_rewards_wallet_address
ROUND_START_THRESHOLD_SOL=1                    # SOL amount to trigger round start
ROUND_DURATION_MINUTES=30                      # Duration of each round
COOLDOWN_DURATION_MINUTES=15                   # Cooldown between rounds
```

### Automatic Flow
1. **Monitor** rewards wallet balance continuously
2. **Trigger** when balance ≥ 1 SOL
3. **Start** 30-minute lottery round
4. **Accept** chat entries with $555 token verification
5. **End** round automatically after 30 minutes
6. **Cooldown** 15-minute waiting period
7. **Repeat** cycle when balance threshold reached again

### Example Chat Messages
```
User: "My lucky numbers are 5 12 23 34 45"
User: "1,2,3,4,5"
User: "Let's try 10-20-30-40-50"
```

## Verification

### Traditional Lottery
1. Fetch memo-tx after finalize
2. Rebuild Merkle-tree from ticket list
3. Check root == memo root
4. Use memo-tx block-hash as seed, recompute numbers
5. Check payout amounts

### Chat-Based Lottery
1. Verify $555 token holdings for each entry
2. Check entry timestamps vs round duration
3. Confirm no duplicate entries per user per round
4. Validate number format and range (1-50)

## Architecture

- **Zero-program**: No custom Solana programs deployed
- **Real-time chat**: WebSocket monitoring with Socket.io
- **Token verification**: On-chain balance checking
- **Merkle trees**: For traditional lottery verification
- **BadgerDB**: Embedded key-value storage
- **REST API**: Full HTTP interface for management
- **Full-stack**: Go backend + Next.js frontend

## Development Workflow

### Backend Development
```bash
cd backend
make build    # Build the binary
make test     # Run tests
make run      # Run development server
```

### Frontend Development
```bash
cd frontend
bun install   # Install dependencies
bun run dev   # Start development server
bun run build # Build for production
```

### Docker Deployment
```bash
cd backend
docker-compose -f build/docker-compose.yml up --build
```

## Usage Examples

### Start Chat-Based Lottery
```bash
# Create a 30-minute round
curl -X POST http://localhost:9000/chat/round \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes": 30}'

# Start accepting entries
curl -X POST http://localhost:9000/chat/round/{round_id}/start

# Check entries (during round)
curl http://localhost:9000/chat/round/{round_id}/entries

# Finalize and draw winners
curl -X POST http://localhost:9000/chat/round/{round_id}/finalize
```

## Tech Stack

- **Backend**: Go 1.23, Gin/Echo-like HTTP server, BadgerDB
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, React 19
- **Blockchain**: Solana Web3.js, pump.fun WebSocket API
- **Package Manager**: Bun (for both backend chat scripts and frontend)
- **Deployment**: Docker, docker-compose

This is the complete **production-ready** full-stack codebase for both traditional and chat-based lotteries — all without deploying any custom Solana programs.


