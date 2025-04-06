# GitDontIgnore.ai - Decentralized Developer Marketplace

GitDontIgnore.ai is a decentralized marketplace for developers built on the Celo blockchain, enhanced with AI verification tools for code quality and developer identity verification.

## Overview

This platform connects clients with developers through a smart contract-based project management system, focusing on modular work assignments, milestone-based deliveries, and automated verification processes.

### Key Features

- **Smart Contract Project Management**: Create, bid on, and manage development projects with modular structure
- **Identity Verification**: Secure developer onboarding with GitHub integration via Self Protocol
- **AI-powered Code Testing**: Automated module verification using Anchor Browser AI
- **Wallet Integration**: Celo blockchain integration for transparent payments
- **Neo-brutalist UI**: Modern, distinctive design language throughout the platform

## Architecture

### Smart Contracts (Celo Testnet)

The project uses Solidity smart contracts deployed on the Celo Alfajores testnet:

- **FreelanceProjectContract** (`0x7A0399618B0bde2eeBdcAA4c1C9Da2883D118b3d`): The main contract handling:
  - Project registration and management
  - Module bidding and assignment
  - Work verification and milestone approval
  - Escrow and payment release

Key contract functions:
- `registerProject`: Create new client projects with modules
- `bidForModule`: Allow freelancers to bid on specific modules
- `approveModuleBid`: Client selects developer for module
- `markModuleComplete`: Developer submits completed work
- `approveModule`: Client approves completed module
- `releaseModuleFunds`: Release payment to developer

### Frontend Stack

- **Framework**: Next.js (App Router)
- **Styling**: TailwindCSS with neo-brutalist design principles
- **Blockchain Integration**: ethers.js for Celo interaction
- **Authentication**: Self Protocol for identity verification

### AI Integration

The platform leverages several AI tools:

1. **Self Protocol Integration** (`@selfxyz/qrcode` & `@selfxyz/core`):
   - Secure identity verification connecting GitHub accounts to wallet addresses
   - QR code-based verification flow with Self mobile app
   - Credential verification on-chain

2. **Anchor Browser AI** (Testing & Verification):
   - Automated module testing through browser automation
   - AI agent evaluates whether implemented features meet requirements
   - Test results recorded for quality assurance

## Project Structure

```
/app
  /api                    # Backend API routes
    /verify               # Self Protocol verification endpoints
  /browser                # Browser API integration
  /chat                   # Project creation and communication
  /components             # Reusable UI components
  /contracts              # Smart contract ABIs
  /developers             # Developer profiles and metrics
  /find-project           # Project discovery and bidding
  /getworkdone            # Client project management dashboard
  /self                   # Identity verification flow
```

## Usage Flows

### Client Flow
1. Connect wallet and verify identity
2. Create a new project with modular structure
3. Review bids from developers
4. Accept bids for individual modules
5. Verify completed work through AI testing
6. Approve modules and release funds

### Developer Flow
1. Connect wallet and verify GitHub identity
2. Browse available projects
3. Submit bids for specific modules
4. Complete assigned modules
5. Submit work for verification
6. Receive payment upon approval

## AI SDKs Usage

### Self Protocol
Used for secure identity verification:
```typescript
// Configure Self app when wallet address is available
const selfApp = userAddress ? new SelfAppBuilder({
    appName: "GitIgnore",
    scope: "git-ignore",
    endpoint: `https://7d78-111-235-226-130.ngrok-free.app/api/verify?isClient=false&githubUsername=${githubUsername}`,
    logoBase64: logo,
    userId: userAddress,
    userIdType: "hex",
    devMode: true,
} as Partial<SelfApp>).build() : null;

// QR code rendering component
<SelfQRcodeWrapper
    selfApp={selfApp}
    type='websocket'
    onSuccess={() => handleSuccess(null)}
/>
```

### Anchor Browser AI
Used for automated module verification:
```typescript
// Initiate testing session
const start = async (task: string) => {
  // Create browser session
  const browserCreateSession = await fetch("/browser/createSession", {...});
  const { id, live_view_url } = await browserCreateSession.json();
  
  // Start verification session
  const createSessionResponse = await fetch("/session/create-session", {...});
  
  // Configure and run test modules
  const payload = {
    site_url: "https://example.com",
    modules: [...],
    session_id: sessionId,
    anchor_session_id: browserSessionId,
  };
  
  // Execute tests and get results
  const response = await fetch(`http://localhost:8000/test-modules`, {...});
  const jsonResult = await response.json();
};
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Celo wallet (MetaMask with Celo configuration)
- Self Protocol mobile app (for identity verification)

### Installation
1. Clone the repository
   ```
   git clone https://github.com/your-org/gitdontignore.git
   cd gitdontignore
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment variables
   ```
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Access the application at `http://localhost:3000`

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Celo Foundation for blockchain infrastructure
- Self Protocol for identity verification tools
- Anchor Browser for AI testing capabilities
