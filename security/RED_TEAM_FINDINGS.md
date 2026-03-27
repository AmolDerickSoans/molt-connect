# Molt Connect Security Audit - RED TEAM FINDINGS

**Audit Date:** 2026-03-27  
**Auditor:** RED TEAM Security Agent  
**Codebase Version:** 2.0.0  
**Severity Scale:** Critical > High > Medium > Low

---

## Executive Summary

Molt Connect is a P2P agent communication system using three-word addresses and Ed25519 signatures. The codebase has **significant security gaps** between the designed protocol (PROTOCOL.md) and the actual implementation. The current implementation is vulnerable to multiple attack vectors.

**Critical Findings: 3**  
**High Findings: 5**  
**Medium Findings: 6**  
**Low Findings: 4**

---

## CRITICAL VULNERABILITIES

### CRITICAL-01: No Actual Encryption Implementation

**File:** `src/molt-a2a.ts`, `src/core.js`  
**Severity:** Critical  
**CWE:** CWE-311 (Missing Encryption of Sensitive Data)

**Description:**  
The PROTOCOL.md specifies Noise XK handshake with ChaCha20-Poly1305 encryption, but the actual implementation in `molt-a2a.ts` sends **all messages in plaintext** over HTTP.

**Evidence:**
```typescript
// src/molt-a2a.ts line 140-150
export async function sendMoltMessage(
  targetUrl: string,
  message: string,
  fromAddress?: string
): Promise<string> {
  const factory = new ClientFactory();
  const client = await factory.createFromUrl(targetUrl);
  
  // Message sent UNENCRYPTED
  const messageWithSender = fromAddress 
    ? `[from @${fromAddress}] ${message}`
    : message;
  // ...
}
```

**Attack Vector:**
1. MITM attacker on same network can intercept all messages
2. Messages traverse through relays unencrypted
3. No confidentiality for agent communications

**Impact:** Complete compromise of message confidentiality. An attacker can read all inter-agent communications.

**Remediation:** Implement the Noise XK handshake as specified in PROTOCOL.md before any message transmission.

---

### CRITICAL-02: Address Spoofing - No Binding Between Address and Identity

**File:** `src/molt-a2a.ts` lines 24-40, `src/core.js` lines 23-35  
**Severity:** Critical  
**CWE:** CWE-287 (Improper Authentication)

**Description:**  
Three-word addresses are generated from a simple hash of a UUID/timestamp, but there is **no cryptographic binding** between the address and the Ed25519 keypair. An attacker can claim any address.

**Evidence:**
```typescript
// src/molt-a2a.ts lines 24-40
export function toThreeWord(id: string): string {
  const hash = id.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  
  // Collision-prone hash with only ~100 unique words
  const i1 = Math.abs(hash) % WORDS.length;
  const i2 = Math.abs(hash >> 8) % WORDS.length;
  const i3 = Math.abs(hash >> 16) % WORDS.length;
  
  return `${WORDS[i1]}-${WORDS[i2]}-${WORDS[i3]}`;
}
```

**Attack Vector:**
1. Attacker generates random UUIDs until finding collision with target address
2. Due to small word list (~100 words), only ~1,000,000 combinations
3. Birthday attack: collision found in ~1,000 attempts
4. Attacker can impersonate any agent by finding their address collision

**Exploit Code:**
```javascript
// Find collision for target address "river-moon-dance"
function findCollision(target) {
  const [w1, w2, w3] = target.split('-');
  for (let i = 0; i < 10000000; i++) {
    const testId = uuidv4() + i;
    const addr = toThreeWord(testId);
    if (addr === target) {
      console.log(`Found collision! ID: ${testId}`);
      return testId;
    }
  }
}
```

**Impact:** Complete identity spoofing. Attacker can impersonate any agent.

**Remediation:** 
1. Generate address FROM the Ed25519 public key (hash of pubkey)
2. Verify address matches public key on every connection

---

### CRITICAL-03: Private Key Stored in Plaintext

**File:** `src/core.js` lines 46-60  
**Severity:** Critical  
**CWE:** CWE-312 (Cleartext Storage of Sensitive Information)

**Description:**  
Ed25519 private keys are stored in plaintext JSON files with world-readable permissions.

**Evidence:**
```javascript
// src/core.js lines 46-60
const identity = {
  address,
  publicKey: Buffer.from(publicKey).toString('hex'),
  privateKey: Buffer.from(privateKey).toString('hex'), // PLAINTEXT!
  createdAt: new Date().toISOString()
};

writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2));
// No chmod to restrict permissions
```

**Attack Vector:**
1. Any process running as the same user can read the private key
2. Backup systems may copy the unencrypted key
3. Malware/compromised npm packages can exfiltrate keys

**Impact:** Complete identity compromise. Attacker with file access can impersonate the agent.

**Remediation:**
1. Encrypt private key with user passphrase (AES-256-GCM)
2. Set file permissions to 600 (owner read/write only)
3. Consider hardware security module (HSM) or keychain storage

---

## HIGH VULNERABILITIES

### HIGH-01: Signature Verification Not Enforced

**File:** `src/molt-a2a.ts`, `src/network.js`  
**Severity:** High  
**CWE:** CWE-347 (Improper Verification of Cryptographic Signature)

**Description:**  
While the code has `verifySignature()` function in core.js, it is **never called** when receiving messages. Messages are accepted without signature verification.

**Evidence:**
```javascript
// src/network.js lines 126-145 - handleHello
async handleHello(msg, ws) {
  const { from, fromPublicKey, message } = msg.params;
  
  // NO SIGNATURE VERIFICATION!
  // Just checks if blocked
  if (isBlocked(from)) {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      result: { accepted: false, message: 'Blocked' },
      id: msg.id
    }));
    ws.close();
    return;
  }
  // ...
}
```

**Attack Vector:**
1. Attacker sends HELLO with forged `from` address
2. No verification that message was signed by the claimed identity
3. Attacker can impersonate any known peer

**Impact:** Authentication bypass. Attacker can impersonate trusted peers.

**Remediation:**
1. Verify signature on every incoming message
2. Reject messages with invalid or missing signatures
3. Store and verify known peer public keys

---

### HIGH-02: Relay Server Has No Authentication

**File:** `src/relay.ts`  
**Severity:** High  
**CWE:** CWE-306 (Missing Authentication for Critical Function)

**Description:**  
The relay server accepts registrations from anyone without any authentication or verification.

**Evidence:**
```javascript
// src/relay.ts lines 37-52
app.post('/register', (req, res) => {
  const { address, url, publicKey } = req.body;
  
  if (!address || !url) {
    return res.status(400).json({ error: 'address and url required' });
  }
  
  // NO VERIFICATION - just trusts the data
  registry.set(address, {
    address,
    url,
    publicKey,
    lastSeen: new Date().toISOString()
  });
  // ...
});
```

**Attack Vector:**
1. Attacker registers with victim's address but attacker-controlled URL
2. All messages intended for victim now route to attacker
3. Complete hijacking of the address

**Exploit:**
```bash
# Register someone else's address with our URL
curl -X POST http://relay:8080/register \
  -H "Content-Type: application/json" \
  -d '{"address":"river-moon-dance","url":"http://attacker.com:4000","publicKey":"attacker_pubkey"}'
```

**Impact:** Complete address hijacking. Attacker can intercept all messages for any address.

**Remediation:**
1. Require proof of ownership (sign registration with private key)
2. Implement challenge-response for registration
3. Rate limit registrations per IP

---

### HIGH-03: No Replay Attack Protection

**File:** `src/core.js`, `src/molt-a2a.ts`  
**Severity:** High  
**CWE:** CWE-294 (Authentication Bypass by Capture-replay)

**Description:**  
Messages contain no nonce or sequence number. An attacker can replay captured messages.

**Evidence:**
```javascript
// src/core.js lines 95-105
export function createMessage(from, to, content, type = 'message') {
  return {
    jsonrpc: '2.0',
    method: 'message',
    params: {
      from,
      to,
      type,
      content,
      timestamp: new Date().toISOString() // Only timestamp, no nonce
    },
    id: randomBytes(16).toString('hex') // Not tracked for replay
  };
}
```

**Attack Vector:**
1. Capture a valid signed message
2. Re-send the same message later
3. Receiver cannot distinguish from original

**Impact:** Replay of messages, potential for double-spending, repeated actions.

**Remediation:**
1. Implement nonce tracking per peer
2. Reject messages with duplicate nonces
3. Include sequence numbers

---

### HIGH-04: Timing Attack on Address Generation

**File:** `src/molt-a2a.ts` lines 24-35  
**Severity:** High  
**CWE:** CWE-208 (Observable Timing Discrepancy)

**Description:**  
The address generation uses a weak hash function that leaks information about the input through timing.

**Evidence:**
```typescript
// Iterates through each character - timing varies with input length
const hash = id.split('').reduce((acc, char) => {
  return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
}, 0);
```

**Attack Vector:**
1. Measure time to generate addresses
2. Infer patterns in the input UUID
3. Combined with collision attack, reduces search space

**Remediation:** Use constant-time cryptographic hash (SHA-256) instead of reduce.

---

### HIGH-05: DoS via Unbounded Message Processing

**File:** `src/molt-a2a.ts`, `src/relay.ts`  
**Severity:** High  
**CWE:** CWE-400 (Uncontrolled Resource Consumption)

**Description:**  
No limits on message size, connection count, or request rate.

**Evidence:**
```javascript
// src/relay.ts - No limits
app.post('/register', (req, res) => {
  // No size limit on body
  // No rate limiting
  // No connection limit
});

// src/molt-a2a.ts
app.use(express.json()); // No limit specified, default 100kb but no enforcement
```

**Attack Vector:**
1. Send massive messages to exhaust memory
2. Open many connections to exhaust file descriptors
3. Flood relay with registrations

**Impact:** Denial of service, server crash.

**Remediation:**
1. Add `express.json({ limit: '1mb' })`
2. Implement rate limiting
3. Add connection limits

---

## MEDIUM VULNERABILITIES

### MEDIUM-01: No Input Validation on Addresses

**File:** `src/registry.ts`, `src/permissions.ts`  
**Severity:** Medium  
**CWE:** CWE-20 (Improper Input Validation)

**Description:**  
User-provided addresses are not validated before storage or use.

**Evidence:**
```javascript
// src/registry.ts line 37
register(peer: Omit<Peer, 'addedAt'>) {
  // No validation of address format
  // Could be anything: "../../../etc/passwd" or SQL injection
  this.peers.set(peer.address, { ... });
}
```

**Attack Vector:**
1. Inject malicious strings as addresses
2. Potential for path traversal if address used in file operations
3. Log injection via crafted addresses

**Remediation:** Validate address format: `/^[a-z]+-[a-z]+-[a-z]+$/`

---

### MEDIUM-02: No Rate Limiting on Permission Prompts

**File:** `src/permissions.ts`  
**Severity:** Medium  
**CWE:** CWE-770 (Allocation of Resources Without Limits)

**Description:**  
An attacker can flood a user with connection requests, overwhelming them with permission prompts.

**Attack Vector:**
1. Send many HELLO requests from different (spoofed) addresses
2. User is bombarded with permission prompts
3. User may accept malicious connection to stop the spam

**Remediation:** Rate limit HELLO messages per IP, global limit on pending prompts.

---

### MEDIUM-03: Insecure Default Configuration

**File:** `src/network.js`  
**Severity:** Medium  
**CWE:** CWE-1188 (Initialization with Hard-Coded Network Resource Configuration)

**Description:**  
Default relay server URL is hardcoded, and connections are made without TLS verification option.

**Evidence:**
```javascript
// src/network.js line 11
const DEFAULT_RELAY = 'wss://molt-relay.fly.dev'; // Hardcoded, no fallback
```

**Remediation:** Allow user-configurable relays, support multiple relays for resilience.

---

### MEDIUM-04: Information Disclosure in Error Messages

**File:** `src/core.js`, `src/relay.ts`  
**Severity:** Medium  
**CWE:** CWE-209 (Generation of Error Message with Sensitive Information)

**Description:**  
Error messages include internal details useful for attackers.

**Evidence:**
```javascript
// Errors expose internal structure
console.error('Failed to parse message:', err);
// Reveals message format, helps craft attacks
```

**Remediation:** Log detailed errors internally, return generic errors to clients.

---

### MEDIUM-05: No Certificate Pinning for Relay Connections

**File:** `src/network.js`  
**Severity:** Medium  
**CWE:** CWE-295 (Improper Certificate Validation)

**Description:**  
WebSocket connections to relay use default TLS verification without pinning.

**Attack Vector:**
1. MITM with valid CA certificate
2. Intercept relay traffic
3. Register fake addresses, redirect messages

**Remediation:** Implement certificate pinning for known relay servers.

---

### MEDIUM-06: Peer Trust State Not Cryptographically Protected

**File:** `src/registry.ts`  
**Severity:** Medium  
**CWE:** CWE-732 (Incorrect Permission Assignment)

**Description:**  
The `trusted` flag for peers is stored in plaintext JSON and can be modified by any process with file access.

**Evidence:**
```javascript
// Just writes to file, no integrity protection
this.peers.set(peer.address, { ...peer, trusted: true });
writeFileSync(this.peersFile, JSON.stringify(data, null, 2));
```

**Attack Vector:**
1. Modify peers.json to set `trusted: true` for malicious peer
2. Malicious peer is now auto-accepted

**Remediation:** Sign the peer registry with user's private key, verify on load.

---

## LOW VULNERABILITIES

### LOW-01: Small Word List Reduces Entropy

**File:** `src/molt-a2a.ts` lines 12-22  
**Severity:** Low  
**CWE:** CWE-331 (Insufficient Entropy)

**Description:**  
Only ~100 unique words in the word list, giving only ~1 million possible addresses.

**Math:** 100^3 = 1,000,000 combinations, far from the claimed 8.6 billion.

**Remediation:** Use full BIP39 word list (2048 words) for 8.6 billion combinations.

---

### LOW-02: No Audit Logging

**File:** All source files  
**Severity:** Low  
**CWE:** CWE-778 (Insufficient Logging)

**Description:**  
Security-relevant events (connections, permission decisions, errors) are not logged for audit.

**Remediation:** Add structured logging for security events.

---

### LOW-03: Session Keys Never Rotated

**File:** `src/core.js`  
**Severity:** Low  
**CWE:** CWE-326 (Inadequate Encryption Strength)

**Description:**  
No key rotation mechanism. If a session key is compromised, all future messages are at risk.

**Remediation:** Implement periodic re-handshake as specified in PROTOCOL.md.

---

### LOW-04: No Forward Secrecy

**File:** `src/core.js`, `src/molt-a2a.ts`  
**Severity:** Low  
**CWE:** CWE-326 (Inadequate Encryption Strength)

**Description:**  
Current implementation does not use ephemeral keys for forward secrecy. If long-term key is compromised, all past messages can be decrypted.

**Remediation:** Implement Noise XK handshake with ephemeral keys.

---

## Attack Scenarios

### Scenario 1: Complete Identity Theft

1. Attacker reads `~/.molt-connect/identity.json` (no encryption)
2. Uses stolen private key to impersonate victim
3. All peers trust the connection (valid signature)
4. Attacker receives all future messages

### Scenario 2: Address Hijacking via Relay

1. Attacker registers victim's address with attacker URL on relay
2. New agents looking up the address get attacker's URL
3. All messages route to attacker
4. Attacker can impersonate victim indefinitely

### Scenario 3: MITM on Unencrypted Channel

1. Attacker on same network sniffs traffic
2. Captures unencrypted HTTP messages
3. Reads all inter-agent communications
4. Modifies messages in transit (no integrity check)

### Scenario 4: Replay Attack

1. Attacker captures a signed "trust this peer" message
2. Replays it later to gain trusted status
3. No nonce tracking, message accepted
4. Attacker gains persistent access

---

## Protocol vs Implementation Gap

The PROTOCOL.md specification describes robust security measures that are **completely unimplemented**:

| Feature | Spec | Implementation |
|---------|------|----------------|
| Encryption | Noise XK + ChaCha20-Poly1305 | **None** |
| Key Exchange | 3-way handshake | **None** |
| Replay Protection | Nonce tracking | **None** |
| Timestamp Validation | 5 min skew check | **None** |
| Key Rotation | Every 24h | **None** |
| Forward Secrecy | Ephemeral keys | **None** |

This is a **critical finding** - the implementation provides none of the security guarantees claimed in the protocol specification.

---

## Recommendations Summary

### Immediate Actions (Critical)
1. Implement message encryption before any production use
2. Bind addresses to public keys cryptographically
3. Encrypt private keys at rest

### Short-term (High)
1. Enforce signature verification on all messages
2. Add authentication to relay registration
3. Implement replay protection with nonces
4. Add rate limiting

### Medium-term (Medium)
1. Input validation on all user-provided data
2. Audit logging for security events
3. Certificate pinning for relay connections
4. Sign peer registry for integrity

### Long-term (Low)
1. Expand word list for more entropy
2. Implement key rotation
3. Add forward secrecy
4. Security audit by external firm

---

## Conclusion

**Molt Connect is NOT production-ready from a security perspective.** The gap between the security specification and implementation is severe. The codebase should not be used for sensitive communications until:

1. All CRITICAL and HIGH vulnerabilities are remediated
2. The Noise XK handshake is fully implemented
3. External security audit is completed

**Risk Rating: HIGH** - Do not use in production without major security improvements.

---

*End of RED TEAM Findings Report*
