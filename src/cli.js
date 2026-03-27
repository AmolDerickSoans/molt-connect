#!/usr/bin/env node
/**
 * Molt Connect CLI
 * 
 * Usage:
 *   molt-whoami
 *   moltmessage @address "message"
 *   molt-connections
 *   moltbook
 */

import('./index.js').then(async (molt) => {
  const [,, command, ...args] = process.argv;
  
  switch (command) {
    case 'whoami': {
      const id = await molt.whoami();
      console.log(`\n📍 Your address: @${id.address}`);
      console.log(`   Public key: ${id.publicKey.slice(0, 16)}...`);
      console.log(`   Created: ${id.createdAt}\n`);
      break;
    }
    
    case 'message':
    case 'send':
    case 'moltmessage': {
      const [address, ...messageParts] = args;
      const content = messageParts.join(' ');
      
      if (!address || !content) {
        console.error('Usage: moltmessage @address "message"');
        process.exit(1);
      }
      
      await molt.init();
      const result = await molt.sendMessage(address, content);
      
      if (result.success) {
        console.log(`✅ Message sent to @${address}`);
      } else {
        console.error(`❌ ${result.error}`);
      }
      
      process.exit(0);
      break;
    }
    
    case 'connections': {
      await molt.init();
      const conns = molt.listConnections();
      if (conns.length === 0) {
        console.log('\nNo active connections\n');
      } else {
        console.log('\n📡 Active connections:');
        conns.forEach(c => {
          console.log(`   @${c.address} [${c.state}]`);
        });
        console.log();
      }
      break;
    }
    
    case 'contacts':
    case 'book': {
      const contacts = molt.listContacts();
      if (contacts.length === 0) {
        console.log('\nNo contacts saved\n');
      } else {
        console.log('\n📖 Contacts:');
        contacts.forEach(c => {
          console.log(`   @${c.address} - ${c.name || 'unnamed'}`);
        });
        console.log();
      }
      break;
    }
    
    case 'stats': {
      await molt.init();
      const stats = molt.getStats();
      console.log('\n📊 Stats:');
      console.log(`   Address: @${stats.address}`);
      console.log(`   Connections: ${stats.connections}`);
      console.log(`   Contacts: ${stats.contacts}`);
      console.log(`   Listening on port: ${stats.listening}\n`);
      break;
    }
    
    default: {
      console.log(`
Molt Connect - P2P Agent Communication

Commands:
  node src/cli.js whoami              Show your address
  node src/cli.js message @addr "msg"  Send a message
  node src/cli.js connections          List active connections
  node src/cli.js contacts             List contacts
  node src/cli.js stats                Show stats

Example:
  node src/cli.js whoami
  node src/cli.js message @river-moon-dance "Hello!"
`);
    }
  }
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
