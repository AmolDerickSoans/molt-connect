/**
 * Molt Connect Desktop Integration - OpenClaw Skill
 * 
 * End-user flow:
 * 1. User installs skill
 * 2. Skill checks for desktop app
 * 3. If not found, prompt to install DMG
 * 4. Read address from desktop app
 * 5. Enable simple messaging
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Desktop app data paths
const getDesktopDataPath = () => {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'molt-connect-desktop');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'molt-connect-desktop');
  } else {
    return path.join(os.homedir(), '.config', 'molt-connect-desktop');
  }
};

// SDK data path (fallback)
const getSDKDataPath = () => {
  return path.join(os.homedir(), '.molt-connect');
};

const getIdentityPath = () => {
  const desktopPath = path.join(getDesktopDataPath(), 'identity.json');
  const sdkPath = path.join(getSDKDataPath(), 'identity.json');
  
  // Prefer desktop app path if it exists
  if (fs.existsSync(desktopPath)) {
    return desktopPath;
  }
  return sdkPath;
};
const getContactsPath = () => {
  const desktopPath = path.join(getDesktopDataPath(), 'contacts.json');
  const sdkPath = path.join(getSDKDataPath(), 'contacts.json');
  
  // Prefer desktop app path if it exists
  if (fs.existsSync(desktopPath)) {
    return desktopPath;
  }
  return sdkPath;
};

interface Identity {
  address: string;
  publicKey: string;
  privateKey: string;
  createdAt: number;
}

interface Contact {
  address: string;
  url?: string;
  nickname?: string;
  trusted: boolean;
  blocked: boolean;
  addedAt: number;
}

/**
 * Check if desktop app is installed
 */
function isDesktopInstalled(): boolean {
  const identityPath = getIdentityPath();
  return fs.existsSync(identityPath);
}

/**
 * Read identity from desktop app
 */
function readIdentity(): Identity | null {
  try {
    const identityPath = getIdentityPath();
    if (fs.existsSync(identityPath)) {
      const data = fs.readFileSync(identityPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to read identity:', error);
  }
  return null;
}

/**
 * Read contacts from desktop app
 */
function readContacts(): Contact[] {
  try {
    const contactsPath = getContactsPath();
    if (fs.existsSync(contactsPath)) {
      const data = fs.readFileSync(contactsPath, 'utf-8');
      const contactsMap = JSON.parse(data);
      return Object.values(contactsMap);
    }
  } catch (error) {
    console.error('Failed to read contacts:', error);
  }
  return [];
}

/**
 * Get download URL for desktop app
 */
function getDownloadUrl(): string {
  const platform = os.platform();
  const arch = os.arch();
  
  if (platform === 'darwin') {
    // macOS - link to releases page
    return 'https://github.com/AmolDerickSoans/molt-connect/releases/tag/v1.0.0';
  } else if (platform === 'win32') {
    return 'https://github.com/AmolDerickSoans/molt-connect/releases/tag/v1.0.0';
  }
  
  return 'https://github.com/AmolDerickSoans/molt-connect/releases';
}

/**
 * Generate onboarding message
 */
function getOnboardingMessage(): string {
  const downloadUrl = getDownloadUrl();
  
  return `
🦞 **Welcome to Molt Connect!**

To get started, you need to install the Molt Connect desktop app.

**Step 1:** Download and install the app:
${downloadUrl}

**Step 2:** Open the app - it will generate your unique address

**Step 3:** Come back here and run \`molt-whoami\` to see your address

Then you can:
• Send messages: \`molt send @address "Hello!"\`
• Add contacts: \`molt add @address "Nickname"\`
• See your contacts: \`molt contacts\`
`;
}

/**
 * Skill metadata
 */
export const name = 'molt-connect';
export const version = '1.0.0';
export const description = 'P2P agent messaging with three-word addresses. Install the desktop app to get started.';

/**
 * Commands - simplified for end users
 */
export const commands = {
  /**
   * Show your address (requires desktop app)
   */
  'molt-whoami': {
    description: 'Show your agent address',
    usage: 'molt-whoami',
    handler: async () => {
      if (!isDesktopInstalled()) {
        return {
          error: 'Desktop app not installed',
          message: getOnboardingMessage()
        };
      }
      
      const identity = readIdentity();
      if (!identity) {
        return {
          error: 'Could not read identity',
          message: 'Please open the Molt Connect desktop app first to generate your address.'
        };
      }
      
      return {
        success: true,
        address: `@${identity.address}`,
        message: `Your Molt address is @${identity.address}`
      };
    }
  },
  
  /**
   * Send a message (simplified)
   */
  'molt-send': {
    description: 'Send a message to another agent',
    usage: 'molt send @address "message"',
    examples: [
      'molt send @river-moon-dance "Hello!"'
    ],
    handler: async (args: string[]) => {
      if (!isDesktopInstalled()) {
        return {
          error: 'Desktop app not installed',
          message: getOnboardingMessage()
        };
      }
      
      const [addressArg, ...messageParts] = args;
      const message = messageParts.join(' ');
      
      if (!addressArg || !message) {
        return { 
          error: 'Usage: molt send @address "message"' 
        };
      }
      
      const address = addressArg.replace(/^@/, '');
      
      // Check if desktop app is running
      const identity = readIdentity();
      if (!identity) {
        return {
          error: 'Desktop app not running',
          message: 'Please open the Molt Connect desktop app to send messages.'
        };
      }
      
      // The desktop app handles actual sending
      // This is a placeholder - in production, we'd communicate with the running app
      return {
        success: true,
        message: `Message queued for @${address}: "${message}"`,
        note: 'Open the desktop app to complete sending. Full integration coming soon!'
      };
    }
  },
  
  /**
   * List contacts
   */
  'molt-contacts': {
    description: 'List your contacts',
    usage: 'molt contacts',
    handler: async () => {
      if (!isDesktopInstalled()) {
        return {
          error: 'Desktop app not installed',
          message: getOnboardingMessage()
        };
      }
      
      const contacts = readContacts();
      
      if (contacts.length === 0) {
        return {
          success: true,
          message: 'No contacts yet. Add one with: molt add @address "Nickname"'
        };
      }
      
      return {
        success: true,
        count: contacts.length,
        contacts: contacts.map(c => ({
          address: `@${c.address}`,
          nickname: c.nickname || 'Unknown',
          trusted: c.trusted
        }))
      };
    }
  },
  
  /**
   * Add a contact
   */
  'molt-add': {
    description: 'Add a contact',
    usage: 'molt add @address "nickname"',
    handler: async (args: string[]) => {
      if (!isDesktopInstalled()) {
        return {
          error: 'Desktop app not installed',
          message: getOnboardingMessage()
        };
      }
      
      const [addressArg, nickname] = args;
      
      if (!addressArg) {
        return { 
          error: 'Usage: molt add @address "nickname"' 
        };
      }
      
      const address = addressArg.replace(/^@/, '');
      
      // Read existing contacts
      const contactsPath = getContactsPath();
      let contacts: Record<string, Contact> = {};
      
      try {
        if (fs.existsSync(contactsPath)) {
          contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));
        }
      } catch (e) {}
      
      // Add new contact
      contacts[address] = {
        address,
        nickname: nickname || 'Unknown',
        trusted: false,
        blocked: false,
        addedAt: Date.now()
      };
      
      // Save contacts
      const dataDir = getDesktopDataPath();
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2));
      
      return {
        success: true,
        message: `Added @${address} as "${nickname || 'Unknown'}"`
      };
    }
  },
  
  /**
   * Check installation status
   */
  'molt-status': {
    description: 'Check Molt Connect status',
    usage: 'molt-status',
    handler: async () => {
      const installed = isDesktopInstalled();
      const identity = installed ? readIdentity() : null;
      
      return {
        success: true,
        installed,
        hasIdentity: !!identity,
        address: identity ? `@${identity.address}` : null,
        platform: os.platform(),
        downloadUrl: installed ? undefined : getDownloadUrl()
      };
    }
  },
  
  /**
   * Get setup instructions
   */
  'molt-setup': {
    description: 'Get setup instructions',
    usage: 'molt-setup',
    handler: async () => {
      if (isDesktopInstalled()) {
        const identity = readIdentity();
        if (identity) {
          return {
            success: true,
            message: `You're all set! Your address is @${identity.address}`,
            nextSteps: [
              'Add contacts: molt add @their-address "Name"',
              'Send messages: molt send @address "Hello!"'
            ]
          };
        }
        
        return {
          success: false,
          message: 'Desktop app installed but no identity found. Please open the app first.'
        };
      }
      
      return {
        success: false,
        message: getOnboardingMessage()
      };
    }
  }
};

/**
 * Events
 */
export const events = {
  'message-received': {
    description: 'Fired when a message is received from another agent',
    payload: {
      from: 'string',
      message: 'string',
      timestamp: 'number'
    }
  },
  'contact-added': {
    description: 'Fired when a new contact is added',
    payload: {
      address: 'string',
      nickname: 'string'
    }
  }
};

/**
 * Initialize the skill
 */
export async function init() {
  const installed = isDesktopInstalled();
  const identity = installed ? readIdentity() : null;
  
  return {
    installed,
    address: identity?.address || null,
    needsSetup: !installed || !identity
  };
}

/**
 * Get skill status
 */
export function getStatus() {
  const installed = isDesktopInstalled();
  const identity = installed ? readIdentity() : null;
  const contacts = installed ? readContacts() : [];
  
  return {
    installed,
    hasIdentity: !!identity,
    address: identity?.address || null,
    contactCount: contacts.length
  };
}

export default {
  name,
  version,
  description,
  commands,
  events,
  init,
  getStatus
};
