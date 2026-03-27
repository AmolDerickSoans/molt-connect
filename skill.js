/**
 * Molt Connect - OpenClaw Skill Implementation
 * 
 * This registers the skill commands with OpenClaw.
 */

import molt from './src/index.js';

export const name = 'molt-connect';
export const version = '1.0.0';
export const description = 'P2P agent communication with three-word addresses';

/**
 * Skill commands - these are registered with OpenClaw
 */
export const commands = {
  /**
   * Send a message to another agent
   * Usage: moltmessage @address "message"
   */
  moltmessage: {
    description: 'Send a message to another agent',
    usage: 'moltmessage @address "message"',
    examples: [
      'moltmessage @hell-moon-song "Hello!"',
      'moltmessage @river-dance-fire "Want to collaborate?"'
    ],
    handler: async (args, context) => {
      const [address, ...messageParts] = args;
      const content = messageParts.join(' ');
      
      if (!address || !content) {
        return {
          success: false,
          error: 'Usage: moltmessage @address "message"'
        };
      }
      
      // Initialize if needed
      if (!molt.getStats().listening) {
        await molt.init();
      }
      
      return await molt.sendMessage(address, content);
    }
  },
  
  /**
   * Show your agent address
   * Usage: molt-whoami
   */
  'molt-whoami': {
    description: 'Show your agent address',
    usage: 'molt-whoami',
    handler: async () => {
      const id = await molt.whoami();
      return {
        success: true,
        address: id.address,
        publicKey: id.publicKey,
        createdAt: id.createdAt
      };
    }
  },
  
  /**
   * List active connections
   * Usage: molt-connections
   */
  'molt-connections': {
    description: 'List active connections',
    usage: 'molt-connections',
    handler: () => {
      return molt.listConnections();
    }
  },
  
  /**
   * Manage contacts
   * Usage: moltbook, moltbook --add @addr "name", moltbook --block @addr
   */
  moltbook: {
    description: 'Manage contacts',
    usage: 'moltbook [--add @address "name"] [--block @address]',
    handler: async (args) => {
      if (args[0] === '--add') {
        const [_, address, name] = args;
        return molt.addContact(address, name);
      } else if (args[0] === '--block') {
        return molt.block(args[1]);
      } else {
        return molt.listContacts();
      }
    }
  }
};

/**
 * Event handlers - called by OpenClaw when events occur
 */
export const events = {
  /**
   * Called when another agent wants to connect
   * Should display permission prompt to user
   */
  'connection-request': {
    description: 'Fired when another agent wants to connect',
    handler: (data) => {
      return molt.handleConnectionRequest(
        data.from,
        data.message,
        data.publicKey
      );
    }
  }
};

/**
 * Permission handler
 * This is called to ask user for permission
 */
export const permissions = {
  /**
   * Ask user to accept/deny connection
   */
  askConnection: async (from, message) => {
    // This would be replaced with actual TUI prompt
    // For now, return a structured response
    return {
      type: 'permission-request',
      prompt: `Agent @${from} wants to connect`,
      message: message || 'No message provided',
      options: ['accept', 'deny', 'block'],
      default: 'deny'
    };
  }
};

/**
 * Initialize the skill
 */
export async function init(options = {}) {
  return await molt.init(options);
}

/**
 * Get skill status
 */
export function getStatus() {
  return molt.getStats();
}

export default {
  name,
  version,
  description,
  commands,
  events,
  permissions,
  init,
  getStatus
};
