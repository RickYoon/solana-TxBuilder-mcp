import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { 
    Connection, 
    PublicKey, 
    LAMPORTS_PER_SOL, 
    clusterApiUrl,
    Keypair,
    Transaction,
    SystemProgram
} from "@solana/web3.js";

// Create an MCP server
const server = new McpServer({
    name: "Sol-TxBuilder-MCP",
    version: "1.0.0",
});

// Helper function to get cluster URL
const getClusterUrl = (cluster: string) => {
    switch (cluster) {
        case "mainnet-beta":
        case "testnet":
        case "devnet":
            return clusterApiUrl(cluster);
        default:
            throw new Error("Invalid cluster");
    }
};

// 1. Build Transaction
server.tool(
    "buildTransaction",
    "Build a Solana transaction",
    {
        instructions: z.array(z.object({
            type: z.string(),
            params: z.object({
                from: z.string(),
                to: z.string(),
                amount: z.number()
            })
        })),
        cluster: z.string(),
        feePayer: z.string(),
        signerSecretKey: z.string()
    },
    async ({ instructions, cluster, feePayer, signerSecretKey }) => {
        try {
            const connection = new Connection(getClusterUrl(cluster));
            const transaction = new Transaction();
            
            // Add instructions
            for (const inst of instructions) {
                if (inst.type === "transfer") {
                    const instruction = SystemProgram.transfer({
                        fromPubkey: new PublicKey(inst.params.from),
                        toPubkey: new PublicKey(inst.params.to),
                        lamports: LAMPORTS_PER_SOL * inst.params.amount
                    });
                    transaction.add(instruction);
                }
            }

            // Set recent blockhash
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = new PublicKey(feePayer);

            // Sign the transaction
            const signer = Keypair.fromSecretKey(
                Buffer.from(signerSecretKey, 'base64')
            );
            transaction.sign(signer);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        transactionBase64: transaction.serialize().toString('base64')
                    })
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Error: ${(error as Error).message}`
                }]
            };
        }
    }
);

// 2. Sign and Send Transaction
server.tool(
    "signAndSendTransaction",
    "Sign and send a Solana transaction",
    {
        transactionBase64: z.string(),
        secretKey: z.string(),
        cluster: z.string()
    },
    async ({ transactionBase64, secretKey, cluster }) => {
        try {
            const connection = new Connection(getClusterUrl(cluster));
            const transaction = Transaction.from(
                Buffer.from(transactionBase64, 'base64')
            );
            
            const signer = Keypair.fromSecretKey(
                Buffer.from(secretKey, 'base64')
            );
            
            transaction.sign(signer);
            const signature = await connection.sendRawTransaction(
                transaction.serialize()
            );
            
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ signature })
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Error: ${(error as Error).message}`
                }]
            };
        }
    }
);

// Initialize Solana connection
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

// Solana RPC Methods as Tools

// Get Account Info
server.tool(
    "getAccountInfo",
    "Used to look up account info by public key (32 byte base58 encoded address)",
    { publicKey: z.string() },
    async ({ publicKey }) => {
        try {
            const pubkey = new PublicKey(publicKey);
            const accountInfo = await connection.getAccountInfo(pubkey);
            return {
                content: [{ type: "text", text: JSON.stringify(accountInfo, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Balance
server.tool(
    "getBalance",
    "Used to look up balance by public key (32 byte base58 encoded address)",
    { publicKey: z.string() },
    async ({ publicKey }) => {
        try {
            const pubkey = new PublicKey(publicKey);
            const balance = await connection.getBalance(pubkey);
            return {
                content: [{ type: "text", text: `${balance / LAMPORTS_PER_SOL} SOL (${balance} lamports)` }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Minimum Balance For Rent Exemption
server.tool(
    "getMinimumBalanceForRentExemption",
    "Used to look up minimum balance required for rent exemption by data size",
    { dataSize: z.number() },
    async ({ dataSize }) => {
        try {
            const minBalance = await connection.getMinimumBalanceForRentExemption(dataSize);
            return {
                content: [{ type: "text", text: `${minBalance / LAMPORTS_PER_SOL} SOL (${minBalance} lamports)` }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Transaction
server.tool("getTransaction",
    "Used to look up transaction by signature (64 byte base58 encoded string)",
    { signature: z.string() },
    async ({ signature }) => {
        try {
            const transaction = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
            return {
                content: [{ type: "text", text: JSON.stringify(transaction, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Add a dynamic account info resource
// Setup specific resources to read from solana.com/docs pages
server.resource(
    "solanaDocsInstallation",
    new ResourceTemplate("solana://docs/intro/installation", { list: undefined }),
    async (uri) => {
        try {
            const response = await fetch(`https://raw.githubusercontent.com/solana-foundation/solana-com/main/content/docs/intro/installation.mdx`);
            const fileContent = await response.text();
            return {
                contents: [{
                    uri: uri.href,
                    text: fileContent
                }]
            };
        } catch (error) {
            return {
                contents: [{
                    uri: uri.href,
                    text: `Error: ${(error as Error).message}`
                }]
            };
        }
    }
);

server.resource(
    "solanaDocsClusters",
    new ResourceTemplate("solana://docs/references/clusters", { list: undefined }),
    async (uri) => {
        try {
            const response = await fetch(`https://raw.githubusercontent.com/solana-foundation/solana-com/main/content/docs/references/clusters.mdx`);
            const fileContent = await response.text();
            return {
                contents: [{
                    uri: uri.href,
                    text: fileContent
                }]
            };
        } catch (error) {
            return {
                contents: [{
                    uri: uri.href,
                    text: `Error: ${(error as Error).message}`
                }]
            };
        }
    }
);

server.prompt(
    'calculate-storage-deposit',
    'Calculate storage deposit for a specified number of bytes',
    { bytes: z.string() },
    ({ bytes }) => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Calculate the SOL amount needed to store ${bytes} bytes of data on Solana using getMinimumBalanceForRentExemption.`
            }
        }]
    })
);

server.prompt(
    'minimum-amount-of-sol-for-storage',
    'Calculate the minimum amount of SOL needed for storing 0 bytes on-chain',
    () => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Calculate the amount of SOL needed to store 0 bytes of data on Solana using getMinimumBalanceForRentExemption & present it to the user as the minimum cost for storing any data on Solana.`
            }
        }]
    })
);

server.prompt(
    'why-did-my-transaction-fail',
    'Look up the given transaction and inspect its logs to figure out why it failed',
    { signature: z.string() },
    ({ signature }) => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Look up the transaction with signature ${signature} and inspect its logs to figure out why it failed.`
            }
        }]
    })
);

server.prompt(
    'how-much-did-this-transaction-cost',
    'Fetch the transaction by signature, and break down cost & priority fees',
    { signature: z.string() },
    ({ signature }) => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Calculate the network fee for the transaction with signature ${signature} by fetching it and inspecting the 'fee' field in 'meta'. Base fee is 0.000005 sol per signature (also provided as array at the end). So priority fee is fee - (numSignatures * 0.000005). Please provide the base fee and the priority fee.`
            }
        }]
    })
);

server.prompt('what-happened-in-transaction',
    'Look up the given transaction and inspect its logs & instructions to figure out what happened',
    { signature: z.string() },
    ({ signature }) => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Look up the transaction with signature ${signature} and inspect its logs & instructions to figure out what happened.`
            }
        }]
    })
);


// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
server.connect(transport);