# 555 Ecosystem Documentation

Welcome to the comprehensive documentation for the **555 Ecosystem**. This project is a multi-faceted platform combining high-fidelity gaming, crypto-native economics, and AI-driven engagement.

## 📚 Table of Contents

### 1. [Protocol Layer (555x402)](./555x402/README.md)
The backbone of the ecosystem. Built on Solana using the Anchor framework.
- **Key Concepts**: Audience Inventory, Proof of Engagement, 555x402 Protocol.
- **Programs**: Gamification, Payments, Rewards.
- **Status**: Deployed on Solana Mainnet/Devnet.

### 2. [AI Agent (555-bot)](./555-bot/README.md)
**Alice**, the Proprietor and Sentient OS.
- **Engine**: pippins.
- **Role**: Manages the economy, engages users on Twitter, and possesses games.
- **Intelligence**: RAG-powered knowledge base, autonomous decision making.

### 3. [Frontend & UI (555-mono)](./555-mono/README.md)
The player-facing Arcade experience.
- **Structure**: Turborepo monorepo.
- **Apps**: Next.js web application, 3D Game implementations (Phaser/Three.js).
- **Design**: Custom design system, "High-Voltage" aesthetic.

### 4. [Backend Services (backend)](./backend/README.md)
The bridge between the blockchain, the bot, and the UI.
- **Language**: Go (Golang).
- **Features**: Leaderboards, Quest Management, Reward Distribution.
- **Database**: PostgreSQL / SQLite.

## 🚀 Quick Start

### Prerequisites
- Node.js v23+
- Rust & Cargo (for Solana)
- Go 1.23+
- Solana CLI
- Docker (optional)

### Installation
Each component has its own setup instructions. Please refer to the specific READMEs linked above.

## 🏗 Architecture Overview

```mermaid
graph TD
    User[User/Player] -->|Plays Game| UI[Frontend (555-mono)]
    User -->|Interacts| Twitter[Twitter/X]
    
    UI -->|API Calls| Backend[Go Backend]
    UI -->|Wallet Tx| Solana[Solana Blockchain (555x402)]
    
    Alice[Alice (555-bot)] -->|Posts/Replies| Twitter
    Alice -->|Manages| Backend
    Alice -->|Verifies| Solana
    
    Backend -->|Indexes| Solana
    Backend -->|Serves| UI
```

## 🤝 Contributing
Please read the [CONTRIBUTING.md](./CONTRIBUTING.md) (if available) or refer to the specific component guidelines.
