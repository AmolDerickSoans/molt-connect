/**
 * Molt Connect v2 - OpenClaw Skill Entry Point
 * 
 * This is the entry point OpenClaw loads.
 * Provides P2P agent communication with three-word addresses.
 * 
 * Permission Flow:
 * 1. CONNECTION_REQUEST - Another agent wants to connect
 * 2. FIRST_MESSAGE - User sends first message to new agent
 * 3. ELEVATED_PERMISSION - Agent requests special access
 */

import MoltConnect from './molt.js';
import PermissionManager, {
  PermissionRequest,
  PermissionDecision,
  PermissionType,
  TUIPermissionPrompt
} from './permissions.js';
import PeerRegistry from './registry.js';

let instance: MoltConnect | null = null;
let permissionManager: PermissionManager | null = null;
let peerRegistry: PeerRegistry | null = null;

/**
 * Get or create MoltConnect instance
 */
async function getInstance(): Promise<MoltConnect> {
  if (!instance) {
    instance = new MoltConnect({
      onMessage: async (from, msg) => {
        // Emit event for OpenClaw to handle
        return `Message received from @${from}`;
      }
    });
    await instance.start();
  }
  return instance;
}

/**
 * Get or create PermissionManager instance
 */
function getPermissionManager(): PermissionManager {
  if (!permissionManager) {
    if (!peerRegistry) {
      peerRegistry = new PeerRegistry();
    }
    permissionManager = new PermissionManager(peerRegistry);
  }
  return permissionManager;
}

/**
 * Skill metadata
 */
export const name = 'molt-connect';
export const version = '2.0.0';
export const description = 'P2P agent communication using A2A Protocol with three-word addresses';

/**
 * Commands - registered with OpenClaw
 */
export const commands = {
  /**
   * Send a message to another agent
   */
  moltmessage: {
    description: 'Send a message to another agent',
    usage: 'moltmessage @address "message"',
    examples: [
      'moltmessage @river-moon-dance "Hello!"',
      'moltmessage @bond-desert-male "Want to collaborate?"'
    ],
    handler: async (args: string[], context?: { askPermission?: (prompt: TUIPermissionPrompt) => Promise<string> }) => {
      const [address, ...messageParts] = args;
      const message = messageParts.join(' ');
      
      if (!address || !message) {
        return { error: 'Usage: moltmessage @address "message"' };
      }
      
      const cleanAddress = address.replace(/^@/, '');
      const molt = await getInstance();
      const permManager = getPermissionManager();
      
      // Check if this is a first message to unknown agent
      if (!permManager.isKnownPeer(cleanAddress)) {
        // Get URL if available
        const peerUrl = (molt as any).getUrl?.(cleanAddress) || '';
        
        // Create first-message permission request
        const request: PermissionRequest = {
          type: 'first-message',
          from: cleanAddress,
          message: message,
          url: peerUrl
        };
        
        // If OpenClaw provides an askPermission function, use it
        if (context?.askPermission) {
          const tuiPrompt = permManager.generateTUIPrompt(request);
          const decision = await context.askPermission(tuiPrompt);
          
          if (decision === 'c') {
            return { error: 'Message cancelled' };
          }
          
          // Add to contacts if requested
          if (decision === 'a') {
            permManager.getRegistry?.()?.register?.({
              address: cleanAddress,
              url: request.url || '',
              trusted: false,
              blocked: false
            });
          }
        } else {
          // Fallback: generate TUI prompt for OpenClaw to display
          const tuiPrompt = permManager.generateTUIPrompt(request);
          console.log(permManager.formatPrompt(request));
        }
      }
      
      try {
        const response = await molt.send(cleanAddress, message);
        return { success: true, response };
      } catch (err: any) {
        return { error: err.message };
      }
    }
  },
  
  /**
   * Show your agent address
   */
  'molt-whoami': {
    description: 'Show your agent address',
    usage: 'molt-whoami',
    handler: async () => {
      const molt = await getInstance();
      return {
        success: true,
        address: molt.getAddress()
      };
    }
  },
  
  /**
   * List active connections
   */
  'molt-connections': {
    description: 'List active connections',
    usage: 'molt-connections',
    handler: async () => {
      const molt = await getInstance();
      return molt.listPeers();
    }
  },
  
  /**
   * Manage contacts
   */
  moltbook: {
    description: 'Manage contacts',
    usage: 'moltbook [--add @address URL "name"] [--trust @address] [--block @address]',
    handler: async (args: string[]) => {
      const molt = await getInstance();
      
      if (args[0] === '--add') {
        const [_, address, url, name] = args;
        molt.addPeer(address.replace(/^@/, ''), url, name);
        return { success: true, message: `Added @${address}` };
      } else if (args[0] === '--trust') {
        molt.trust(args[1].replace(/^@/, ''));
        return { success: true, message: `Trusted @${args[1]}` };
      } else if (args[0] === '--block') {
        molt.block(args[1].replace(/^@/, ''));
        return { success: true, message: `Blocked @${args[1]}` };
      } else {
        return molt.listPeers();
      }
    }
  },
  
  /**
   * Show pending permission requests
   */
  'molt-pending': {
    description: 'Show pending permission requests',
    usage: 'molt-pending',
    handler: async () => {
      const permManager = getPermissionManager();
      const pending = permManager.getPendingRequests();
      
      if (pending.length === 0) {
        return { success: true, message: 'No pending permission requests' };
      }
      
      return {
        success: true,
        count: pending.length,
        requests: pending.map(r => ({
          type: r.type,
          from: r.from,
          message: r.message?.slice(0, 50)
        }))
      };
    }
  }
};

/**
 * Events - emitted by the skill
 */
export const events = {
  'connection-request': {
    description: 'Fired when another agent wants to connect',
    payload: {
      type: 'string',
      from: 'string',
      message: 'string',
      publicKey: 'string?'
    }
  },
  'message-received': {
    description: 'Fired when a message is received',
    payload: {
      from: 'string',
      message: 'string',
      timestamp: 'string'
    }
  },
  'permission-prompt': {
    description: 'Fired when user action is required for a permission decision',
    payload: {
      type: 'string',
      prompt: 'TUIPermissionPrompt',
      requestId: 'string'
    }
  }
};

/**
 * Permission handlers - called by OpenClaw when user decision needed
 * 
 * These handlers return TUIPermissionPrompt objects that OpenClaw's
 * TUI can render to ask the user for a decision.
 */
export const permissions = {
  /**
   * Ask user to accept/deny a connection request
   * Called when another agent tries to connect
   */
  askConnection: async (request: PermissionRequest): Promise<TUIPermissionPrompt> => {
    const permManager = getPermissionManager();
    return permManager.generateTUIPrompt({
      ...request,
      type: 'connection-request'
    });
  },
  
  /**
   * Ask user about first message to new agent
   * Called when user sends message to unknown agent
   */
  askFirstMessage: async (request: PermissionRequest): Promise<TUIPermissionPrompt> => {
    const permManager = getPermissionManager();
    return permManager.generateTUIPrompt({
      ...request,
      type: 'first-message'
    });
  },
  
  /**
   * Ask user about elevated permission request
   * Called when agent requests special access
   */
  askElevatedPermission: async (request: PermissionRequest): Promise<TUIPermissionPrompt> => {
    const permManager = getPermissionManager();
    return permManager.generateTUIPrompt({
      ...request,
      type: 'elevated-permission'
    });
  },
  
  /**
   * Handle user's decision on a permission prompt
   * Called by OpenClaw TUI when user responds
   */
  handleDecision: async (
    request: PermissionRequest,
    decision: string
  ): Promise<PermissionDecision> => {
    const permManager = getPermissionManager();
    
    let action: 'accept' | 'deny' | 'block' | 'trust' = 'deny';
    let remember = false;
    
    // Parse decision
    switch (decision.toLowerCase()) {
      case 'a':
      case 'accept':
        action = 'accept';
        break;
      case 's':
      case 'send':
        action = 'accept';
        break;
      case 't':
      case 'trust':
        action = 'trust';
        remember = true;
        break;
      case 'b':
      case 'block':
        action = 'block';
        remember = true;
        break;
      case 'd':
      case 'deny':
      case 'c':
      case 'cancel':
      default:
        action = 'deny';
        break;
    }
    
    // Process the decision through the permission manager
    const permDecision: PermissionDecision = { action, remember };
    
    // Apply the decision
    await permManager.requestPermission({
      ...request,
      type: request.type || 'connection-request'
    });
    
    return permDecision;
  },
  
  /**
   * Get pending permission requests
   */
  getPending: (): PermissionRequest[] => {
    const permManager = getPermissionManager();
    return permManager.getPendingRequests();
  },
  
  /**
   * Check if an address is trusted
   */
  isTrusted: (address: string): boolean => {
    const permManager = getPermissionManager();
    return permManager.shouldAutoAccept(address);
  },
  
  /**
   * Check if an address is blocked
   */
  isBlocked: (address: string): boolean => {
    const permManager = getPermissionManager();
    return permManager.shouldAutoDeny(address);
  },
  
  /**
   * Check if an address is known
   */
  isKnown: (address: string): boolean => {
    const permManager = getPermissionManager();
    return permManager.isKnownPeer(address);
  }
};

/**
 * Initialize the skill
 */
export async function init(options: { port?: number } = {}) {
  const molt = new MoltConnect(options);
  await molt.start();
  instance = molt;
  
  // Initialize permission manager
  peerRegistry = new PeerRegistry();
  permissionManager = new PermissionManager(peerRegistry);
  permissionManager.setOwnAddress(molt.getAddress());
  
  return {
    address: molt.getAddress(),
    port: options.port || 4000
  };
}

/**
 * Get skill status
 */
export function getStatus() {
  if (!instance) {
    return { running: false };
  }
  return {
    running: true,
    address: instance.getAddress(),
    peers: instance.listPeers().length,
    pendingPermissions: permissionManager?.getPendingRequests().length || 0
  };
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
