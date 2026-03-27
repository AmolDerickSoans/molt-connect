/**
 * Molt Connect - OpenClaw Skill Interface
 * 
 * Commands:
 * - moltmessage @address "message"
 * - molt-whoami
 * - molt-connections
 * - moltbook
 */

import { getOrCreateIdentity, loadPeers, savePeer, blockAddress, isBlocked } from './core.js';
import { NetworkManager, ConnectionState } from './network.js';

let networkManager = null;

/**
 * Initialize the skill
 */
export async function init(options = {}) {
  const identity = await getOrCreateIdentity();
  
  networkManager = new NetworkManager(identity, options);
  await networkManager.start();
  
  // Set up permission handler
  networkManager.onPermissionRequest(async (from, message) => {
    // In a real implementation, this would prompt the user
    // For now, we'll use a callback mechanism
    console.log(`\n📥 Connection request from @${from}`);
    console.log(`   Message: "${message}"`);
    console.log(`   Type 'accept' to accept, 'deny' to deny\n`);
    
    // Return a promise that resolves when user responds
    return new Promise((resolve) => {
      // This would be replaced with actual user input in the skill
      // For the OpenClaw skill, we'd use the permission prompt mechanism
      // For now, default to accepting from known peers
      const peers = loadPeers();
      const known = peers.find(p => p.address === from);
      resolve(!!known); // Accept if known peer
    });
  });
  
  // Set up message handler
  networkManager.onMessage((msg) => {
    console.log(`\n📨 Message from @${msg.params.from}:`);
    console.log(`   ${msg.params.content}\n`);
  });
  
  return {
    identity,
    port: networkManager.port
  };
}

/**
 * Get current identity
 */
export async function whoami() {
  const identity = await getOrCreateIdentity();
  return {
    address: identity.address,
    publicKey: identity.publicKey,
    createdAt: identity.createdAt
  };
}

/**
 * Send a message to another agent
 */
export async function sendMessage(toAddress, content) {
  if (!networkManager) {
    await init();
  }
  
  // Clean address (remove @ if present)
  const address = toAddress.replace(/^@/, '');
  
  // Check if blocked
  if (isBlocked(address)) {
    return { success: false, error: 'Address is blocked' };
  }
  
  const sent = await networkManager.sendMessage(address, content);
  
  if (sent) {
    return { success: true, message: 'Message sent' };
  } else {
    return { success: false, error: 'Could not send message - peer not connected' };
  }
}

/**
 * List active connections
 */
export function listConnections() {
  if (!networkManager) {
    return [];
  }
  
  const connections = [];
  networkManager.connections.forEach((conn, address) => {
    connections.push({
      address,
      state: conn.state
    });
  });
  
  return connections;
}

/**
 * List contacts
 */
export function listContacts() {
  return loadPeers();
}

/**
 * Add a contact
 */
export function addContact(address, name) {
  const cleanAddress = address.replace(/^@/, '');
  savePeer({ address: cleanAddress, name });
  return { success: true, message: `Added ${cleanAddress} as ${name}` };
}

/**
 * Block an address
 */
export function block(address) {
  const cleanAddress = address.replace(/^@/, '');
  blockAddress(cleanAddress);
  return { success: true, message: `Blocked ${cleanAddress}` };
}

/**
 * Handle incoming connection request (for skill)
 */
export function handleConnectionRequest(from, message, publicKey) {
  // This would be called by the skill when a HELLO message arrives
  // The skill would display a permission prompt to the user
  // and call acceptConnection or denyConnection based on response
  return {
    from,
    message,
    publicKey,
    actions: ['accept', 'deny', 'block']
  };
}

/**
 * Accept a connection
 */
export function acceptConnection(address) {
  // This would be called after user accepts
  savePeer({ address });
  return { success: true };
}

/**
 * Get network stats
 */
export function getStats() {
  const identity = whoami();
  const connections = listConnections();
  const contacts = listContacts();
  
  return {
    address: identity.address,
    connections: connections.length,
    contacts: contacts.length,
    listening: networkManager?.port || 0
  };
}

// CLI interface (disabled for module testing)
// To use CLI, run: node src/cli.js

export default {
  init,
  whoami,
  sendMessage,
  listConnections,
  listContacts,
  addContact,
  block,
  handleConnectionRequest,
  acceptConnection,
  getStats
};
