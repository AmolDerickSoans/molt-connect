/**
 * Molt Connect v2 - CLI
 * 
 * Uses A2A Protocol properly
 */

import MoltConnect from './molt.js';
import { homedir } from 'os';

async function main() {
  const [,, command, ...args] = process.argv;
  
  // Parse --port flag
  let port = 4000;
  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    port = parseInt(args[portIndex + 1], 10);
    args.splice(portIndex, 2);
  }
  
  // Use MOLT_CONFIG_DIR env var if set
  const configDir = process.env.MOLT_CONFIG_DIR || undefined;
  
  const molt = new MoltConnect({
    configDir,
    port,
    onMessage: async (from, msg) => {
      console.log(`\n📨 Message from @${from}: ${msg}\n`);
      return 'Message received';
    }
  });
  
  switch (command) {
    case 'whoami': {
      // Just show address, don't start server
      const { address, port: savedPort, publicKey } = await molt.loadIdentity();
      console.log(`\n📍 Your address: @${address}`);
      console.log(`   Port: ${savedPort}`);
      console.log(`   Public Key: ${publicKey.substring(0, 16)}...\n`);
      break;
    }
    
    case 'listen':
    case 'start': {
      // Start the agent server
      const { address, port: usedPort } = await molt.start();
      console.log(`\n🎧 Agent @${address} listening on port ${usedPort}`);
      console.log('Press Ctrl+C to stop\n');
      // Keep running
      break;
    }
    
    case 'send':
    case 'message': {
      const [addr, ...msgParts] = args;
      const message = msgParts.join(' ');
      
      if (!addr || !message) {
        console.error('Usage: molt send @address "message"');
        process.exit(1);
      }
      
      // Load identity but don't start server (client-only mode)
      await molt.loadIdentity();
      
      try {
        const response = await molt.send(addr, message);
        console.log(`✅ Sent to @${addr}`);
        console.log(`   Response: ${response}`);
      } catch (err: any) {
        console.error(`❌ ${err.message}`);
      }
      break;
    }
    
    case 'add': {
      const [addr, url, name] = args;
      await molt.loadIdentity(); // Ensure config dir exists
      molt.addPeer(addr, url, name);
      const cleanAddr = addr.startsWith('@') ? addr : `@${addr}`;
      console.log(`✅ Added ${cleanAddr} -> ${url}`);
      break;
    }
    
    case 'list':
    case 'contacts': {
      await molt.loadIdentity(); // Ensure registry is loaded
      const peers = molt.listPeers();
      if (peers.length === 0) {
        console.log('\nNo contacts yet. Add one: molt add @address http://url "Name"\n');
      } else {
        console.log('\n📖 Contacts:');
        peers.forEach(p => {
          const status = p.trusted ? '✓' : p.blocked ? '✗' : ' ';
          console.log(`  ${status} @${p.address} - ${p.name || p.url}`);
        });
        console.log();
      }
      break;
    }
    
    case 'trust': {
      await molt.loadIdentity();
      molt.trust(args[0]);
      console.log(`✅ Trusted @${args[0]}`);
      break;
    }
    
    case 'block': {
      await molt.loadIdentity();
      molt.block(args[0]);
      console.log(`✅ Blocked @${args[0]}`);
      break;
    }
    
    default: {
      console.log(`
Molt Connect v2 - P2P Agent Messaging (A2A Protocol)

Commands:
  molt whoami [--port N]         Show your address
  molt listen [--port N]         Start agent server
  molt send @addr "msg"          Send a message
  molt add @addr URL "name"      Add a contact
  molt list                      List contacts
  molt trust @addr               Auto-accept from address
  molt block @addr               Block address

Examples:
  # Start agent A on port 4001
  MOLT_CONFIG_DIR=/tmp/agent-a molt listen --port 4001 &
  
  # Start agent B on port 4002
  MOLT_CONFIG_DIR=/tmp/agent-b molt listen --port 4002 &
  
  # Add agent B to A's contacts and send message
  MOLT_CONFIG_DIR=/tmp/agent-a molt add @addr http://localhost:4002 "Bob"
  MOLT_CONFIG_DIR=/tmp/agent-a molt send @addr "Hello!"
`);
    }
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
