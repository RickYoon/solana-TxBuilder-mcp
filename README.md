# Solana Transaction Builder MCP

A Model Context Protocol (MCP) server for building and sending Solana transactions. This tool provides a simple interface for creating, signing, and sending Solana transactions through natural language interactions.

## Features

- Build Solana transactions with simple instructions
- Sign and send transactions
- Query account information
- Support for multiple Solana clusters (mainnet-beta, testnet, devnet)
- Base64 transaction serialization for easy transport

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/solana-TxBuilder-mcp.git

# Install dependencies
pnpm install
```

## Usage

1. Start the MCP server:

```bash
pnpm start
```

2. Available Tools:

- `buildTransaction`: Build a Solana transaction

  - Parameters:
    - instructions: Array of transfer instructions
    - cluster: Solana cluster to use
    - feePayer: Public key of the fee payer
    - signerSecretKey: Base64 encoded secret key for signing

- `signAndSendTransaction`: Sign and send a Solana transaction

  - Parameters:
    - transactionBase64: Base64 encoded transaction
    - secretKey: Base64 encoded secret key
    - cluster: Solana cluster to use

- `getAccountInfo`: Get account information
  - Parameters:
    - publicKey: Base58 encoded public key

## Testing

Run the test suite:

```bash
pnpm test
```

Note: Before running tests, replace the test wallet information in `tests/transaction.test.ts` with your own test wallet.

## Development

The project uses TypeScript and follows the MCP server pattern. Key files:

- `index.ts`: Main MCP server implementation
- `tests/transaction.test.ts`: Test suite for transaction functionality

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure tests pass
6. Submit a pull request

## License

ISC

## Dependencies

- @modelcontextprotocol/sdk
- @solana/web3.js
- zod
