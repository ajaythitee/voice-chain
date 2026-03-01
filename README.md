# 🗳️ VoiceChain - Public Opinion on Blockchain

<div align="center">

![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Polygon](https://img.shields.io/badge/Polygon-8247E5?style=for-the-badge&logo=polygon&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Polygon Amoy](https://img.shields.io/badge/Network-Polygon%20Amoy-8247E5?style=flat-square)](https://amoy.etherscan.io)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%202.0-4285F4?style=flat-square&logo=google)](https://ai.google.dev)

**Launch public opinion campaigns, gather community votes, and make transparent decisions on the blockchain.**

🔗 **Live Demo:** [voice-chain-inky.vercel.app](https://voice-chain-inky.vercel.app)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🆓 **Gasless Voting** | Users sign votes for FREE - relayer pays all gas fees |
| 🗳️ **Custom Options** | Create any voting choices, not just Yes/No |
| 📅 **Scheduled Start** | Set when voting begins (optional) and ends |
| 🙈 **Hide Results** | Keep results secret until voting ends |
| 🕶️ **Anonymous Voting** | Voters can hide their wallet address |
| 🤖 **AI Suggest Options** | Gemini AI suggests voting options based on your topic |
| 📊 **Voter Analytics** | Creators see voters categorized by their choice |
| 🧠 **AI Analysis** | Get AI-generated summary when voting ends |
| 💬 **Comments** | Leave feedback with your vote |
| 🖼️ **Campaign Images** | Upload cover images stored on IPFS |
| 🔒 **Access Control** | Restrict voting to whitelisted addresses |
| ↩️ **Catch-all Redirect** | Unknown pages redirect to home |

---

## 📦 Contract

| Field | Value |
|-------|-------|
| Address | `0xfA20343FFD58d14753134AD5b5C6e538df1b8632` |
| Network | Polygon Amoy (Chain ID: 80002) |
| Features | Meta-transactions, scheduled voting, hidden results |

---

## 🏗️ Project Structure

```
VoiceChain/
├── contracts/
│   └── TenderVoting.sol      # Smart contract with meta-txs
├── scripts/
│   └── deploy.js             # Deploy to Polygon Amoy
├── src/
│   ├── pages/
│   │   ├── Home.jsx          # Landing page with features
│   │   ├── Create.jsx        # Create campaign (AI options, schedule)
│   │   ├── Browse.jsx        # Browse active campaigns
│   │   ├── Tender.jsx        # Campaign details + voting
│   │   └── Dashboard.jsx     # My campaigns & voting history
│   ├── services/
│   │   ├── ai.js             # Gemini AI integration
│   │   ├── ipfs.js           # Pinata IPFS storage
│   │   └── relayer.js        # Gasless transactions
│   └── App.jsx
└── vercel.json               # Deployment config
```

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/anikeaty08/PolyVote.git
cd PolyVote
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

```env
# Required
PRIVATE_KEY=your_deployer_private_key
VITE_RELAYER_PRIVATE_KEY=your_relayer_private_key

# Optional (for full features)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_PINATA_JWT=your_pinata_jwt
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud
```

### 3. Deploy Contract
```bash
npx hardhat run scripts/deploy.js --network amoy
```

### 4. Run Frontend
```bash
npm run dev
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | Polygon Amoy Testnet |
| **Smart Contract** | Solidity ^0.8.20, OpenZeppelin |
| **Frontend** | React 18 + Vite |
| **Web3** | wagmi + viem |
| **AI** | Google Gemini 2.0 Flash |
| **Storage** | Pinata IPFS |
| **Deployment** | Vercel |

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PRIVATE_KEY` | Contract deployer wallet | ✅ |
| `VITE_RELAYER_PRIVATE_KEY` | Pays gas for users | ✅ |
| `VITE_GEMINI_API_KEY` | AI features (titles, options, analysis) | ⚠️ |
| `VITE_PINATA_JWT` | Image upload to IPFS | ⚠️ |
| `VITE_PINATA_GATEWAY` | IPFS gateway URL | ⚠️ |

---

## 🎯 Key Features Explained

### Gasless Voting
Users sign a message to vote, and the relayer submits the transaction on-chain. Users pay nothing.

### Scheduled Voting
Creators can set a future start time so voting doesn't begin immediately. Useful for announcements.

### Hidden Results
When enabled, results are hidden until voting ends. Even the contract returns zeros. Creators can always see.

### AI Integration
- **Title improvement**: Makes titles more engaging
- **Description enhancement**: Writes better campaign descriptions
- **Option suggestions**: AI suggests 2-4 voting options based on topic
- **Vote analysis**: AI summarizes results when voting ends

---

## 📜 License

MIT License © 2026

---

<div align="center">

**Built with ❤️ on Polygon**

[![GitHub](https://img.shields.io/badge/GitHub-anikeaty08-181717?style=for-the-badge&logo=github)](https://github.com/anikeaty08/PolyVote)

</div>
