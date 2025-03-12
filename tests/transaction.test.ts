import { expect } from 'chai';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

describe('Solana Transaction Tests', () => {
  let connection: Connection;
  // Test wallet keys (Replace with your own test wallet for testing)
  const TEST_WALLET = {
    publicKey: "YOUR_TEST_WALLET_PUBLIC_KEY",
    secretKey: "YOUR_TEST_WALLET_SECRET_KEY"
  };

  // Test recipient wallet (self-transfer for testing)
  const RECIPIENT_WALLET = TEST_WALLET.publicKey;

  before(async () => {
    connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  });

  // Helper function to wait for transaction confirmation
  const waitForConfirmation = async (signature: string) => {
    const confirmation = await connection.confirmTransaction(signature);
    return confirmation;
  };

  it('should build a valid transaction', async () => {
    console.log('\n=== Building Transaction ===');
    const sender = new PublicKey(TEST_WALLET.publicKey);
    const recipient = new PublicKey(RECIPIENT_WALLET);
    const amount = 0.001;

    console.log('Sender:', sender.toString());
    console.log('Recipient:', recipient.toString());
    console.log('Amount:', amount, 'SOL');

    const transaction = new Transaction();
    const instruction = SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: recipient,
      lamports: LAMPORTS_PER_SOL * amount
    });
    
    transaction.add(instruction);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sender;

    console.log('Blockhash:', blockhash);
    console.log('Fee Payer:', transaction.feePayer.toString());

    // Sign transaction
    const signer = Keypair.fromSecretKey(
      Buffer.from(TEST_WALLET.secretKey, 'base64')
    );
    transaction.sign(signer);

    // Serialize to base64
    const serializedTransaction = transaction.serialize().toString('base64');
    console.log('Serialized Transaction Length:', serializedTransaction.length, 'bytes');
    console.log('Transaction Signatures:', transaction.signatures.length);

    expect(serializedTransaction).to.exist;
    expect(transaction.instructions).to.have.lengthOf(1);
  });

  it('should sign and send transaction', async () => {
    console.log('\n=== Signing and Sending Transaction ===');
    const sender = new PublicKey(TEST_WALLET.publicKey);
    const recipient = new PublicKey(RECIPIENT_WALLET);
    const amount = 0.001;

    console.log('Sender:', sender.toString());
    console.log('Recipient:', recipient.toString());
    console.log('Amount:', amount, 'SOL');

    // Get initial balance
    const initialBalance = await connection.getBalance(sender);
    console.log('Initial Balance:', initialBalance / LAMPORTS_PER_SOL, 'SOL');

    // Build transaction
    const transaction = new Transaction();
    const instruction = SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: recipient,
      lamports: LAMPORTS_PER_SOL * amount
    });
    
    transaction.add(instruction);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sender;

    console.log('Blockhash:', blockhash);
    console.log('Fee Payer:', transaction.feePayer.toString());

    // Sign transaction
    const signer = Keypair.fromSecretKey(
      Buffer.from(TEST_WALLET.secretKey, 'base64')
    );
    transaction.sign(signer);

    // Serialize to base64
    const serializedTransaction = transaction.serialize().toString('base64');
    console.log('Serialized Transaction Length:', serializedTransaction.length, 'bytes');

    // Deserialize transaction
    const recoveredTransaction = Transaction.from(
      Buffer.from(serializedTransaction, 'base64')
    );

    // Send transaction
    const signature = await connection.sendRawTransaction(
      recoveredTransaction.serialize()
    );
    console.log('Transaction Signature:', signature);

    // Wait for confirmation
    await waitForConfirmation(signature);
    
    // Get final balance
    const finalBalance = await connection.getBalance(sender);
    console.log('Final Balance:', finalBalance / LAMPORTS_PER_SOL, 'SOL');
    console.log('Balance Change:', (finalBalance - initialBalance) / LAMPORTS_PER_SOL, 'SOL');

    expect(signature).to.exist;
  });
}); 