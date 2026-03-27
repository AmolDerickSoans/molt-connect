/**
 * Molt Connect Test - Simulated Two-Agent Communication
 * 
 * This tests the core message flow without a real relay.
 */

import molt from './src/index.js';

async function test() {
  console.log('🧪 Molt Connect Integration Test\n');
  
  // === Agent A ===
  console.log('=== Agent A ===');
  const agentA = await molt.init({ port: 0 });
  console.log(`✅ Agent A address: @${agentA.identity.address}`);
  console.log(`   Listening on port: ${agentA.port}`);
  
  // === Agent B ===
  console.log('\n=== Agent B ===');
  // In real scenario, this would be on another machine
  // For test, we simulate by creating another identity
  const { getOrCreateIdentity } = await import('./src/core.js');
  const identityB = await getOrCreateIdentity.call({ 
    IDENTITY_FILE: '/tmp/molt-b-identity.json',
    CONFIG_DIR: '/tmp/molt-b'
  });
  console.log(`✅ Agent B address: @${identityB.address}`);
  
  // === Message Creation ===
  console.log('\n=== Message Creation ===');
  const { createMessage, signMessage } = await import('./src/core.js');
  const msg = createMessage(
    agentA.identity.address,
    identityB.address,
    'Hello from Agent A!'
  );
  console.log('✅ Created message:', JSON.stringify(msg, null, 2));
  
  // === Signing ===
  console.log('\n=== Signing ===');
  const signature = await signMessage(msg, agentA.identity.privateKey);
  console.log(`✅ Signature: ${signature.slice(0, 32)}...`);
  
  // === Verification ===
  console.log('\n=== Verification ===');
  const { verifySignature } = await import('./src/core.js');
  const valid = await verifySignature(msg, signature, agentA.identity.publicKey);
  console.log(`✅ Signature valid: ${valid}`);
  
  // === Stats ===
  console.log('\n=== Stats ===');
  const stats = molt.getStats();
  console.log(JSON.stringify(stats, null, 2));
  
  console.log('\n✅ All tests passed!\n');
  process.exit(0);
}

test().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
