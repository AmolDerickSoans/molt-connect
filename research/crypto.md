# Cryptographic Protocols for Secure Messaging
## Research Report for Molt Connect

**Date:** 2026-03-27  
**Focus:** Practical implementation guidance for secure peer-to-peer messaging

---

## 1. Signal Protocol

### Overview

The Signal Protocol is a comprehensive cryptographic protocol designed for asynchronous secure messaging. It consists of several components:

1. **X3DH (Extended Triple Diffie-Hellman)** - Initial key agreement
2. **Double Ratchet** - Ongoing message encryption
3. **Sesame** - Session management for multi-device

**Source:** [Signal Documentation](https://signal.org/docs/)

### How It Works

#### X3DH Key Agreement
X3DH establishes an initial shared secret between two parties who may be offline. It uses:
- **Identity Keys (IK)** - Long-term static key pairs
- **Signed Prekeys (SPK)** - Medium-term keys signed by identity key
- **One-time Prekeys (OPK)** - Single-use keys for forward secrecy

The key derivation computes:
```
DH1 = DH(IK_A, SPK_B)      # Mutual authentication
DH2 = DH(EK_A, IK_B)       # Mutual authentication  
DH3 = DH(EK_A, SPK_B)      # Forward secrecy
DH4 = DH(EK_A, OPK_B)      # Additional forward secrecy (optional)
SK = KDF(DH1 || DH2 || DH3 || DH4)
```

#### Double Ratchet Algorithm
The Double Ratchet provides ongoing encryption with:
- **Symmetric-key ratchet** - Unique key per message
- **DH ratchet** - Key rotation via Diffie-Hellman exchanges

**Key Properties:**
- Forward secrecy: Past messages remain secure if keys are compromised
- Break-in recovery: Future messages become secure after compromise
- Out-of-order message handling

### Security Properties

| Property | Description |
|----------|-------------|
| Forward Secrecy | Yes - via DH ratchet and ephemeral keys |
| Mutual Authentication | Yes - via identity keys and signatures |
| Post-Compromise Security | Yes - ratchet self-heals |
| Deniability | Yes - no publishable cryptographic proof |
| Asynchronous Support | Yes - via prekeys |

### Performance Characteristics

- **Message overhead:** ~100-200 bytes per message (header + auth tag)
- **Computation:** 2-4 DH operations per message exchange
- **State size:** Several kilobytes per session (skipped message keys)
- **Storage:** Prekeys, signed prekeys, session state

### Is It Overkill for Molt Connect?

**For peer-to-peer with long-lived relationships: Likely YES**

Reasons:
1. **Asynchronous-first design** - Signal assumes offline messaging with server-mediated prekeys. Molt Connect may have direct peer connections.
2. **Complex state management** - Double Ratchet requires storing skipped message keys, managing multiple chains.
3. **Designed for threat model** including state-level adversaries with device access.
4. **Heavy library dependencies** - libsignal requires significant infrastructure.

**When Signal Protocol makes sense:**
- Asynchronous messaging where peers are often offline
- Need for post-compromise security
- Multi-device support
- Group messaging

---

## 2. Noise Protocol Framework

### Overview

Noise is a framework for building cryptographic protocols, not a single protocol. It provides:
- **Handshake patterns** - Formal notation for key exchange
- **Processing rules** - Clear state machine
- **Cryptographic primitives** - DH, cipher, hash functions

**Source:** [Noise Protocol Specification](https://noiseprotocol.org/noise.html)

### Key Patterns for Molt Connect

#### XK Pattern (Recommended for Known Peers)
```
XK:
 <- s                    # Bob's static key known to Alice
 ...
 -> e, es                # Alice sends ephemeral, DH with Bob's static
 <- e, ee                # Bob responds with ephemeral, DH with Alice's ephemeral
 -> s, se                # Alice sends her static, DH for authentication
```

**Security properties:**
- Initiator authentication resistant to KCI
- Responder identity hidden from passive attackers
- Strong forward secrecy after completion

#### IK Pattern (Aggressive, Faster)
```
IK:
 <- s                    # Bob's static key known to Alice
 ...
 -> e, es, s, ss         # Alice sends ephemeral + static in first message
 <- e, ee, se            # Bob responds, mutual authentication
```

**Trade-offs:**
- Faster handshake (2 messages vs 3)
- Initiator identity transmitted in first message (less privacy)
- Weaker identity hiding

#### NN Pattern (Unauthenticated, Anonymous)
```
NN:
 -> e                    # Alice sends ephemeral
 <- e, ee                # Bob responds, DH exchange
```

Use when no authentication needed (e.g., ephemeral anonymous chat).

### Implementation Example (Python)

```python
# Using noise-python or similar library
from noise.connection import NoiseConnection

def create_noise_handshake(my_static_key, peer_static_key, initiator=True):
    """
    Create a Noise XK handshake for Molt Connect.
    
    Args:
        my_static_key: Our Ed25519 private key (32 bytes)
        peer_static_key: Peer's Ed25519 public key (32 bytes)
        initiator: True if we initiate the connection
    """
    protocol_name = b"Noise_XK_25519_ChaChaPoly_SHA256"
    
    noise = NoiseConnection.from_name(protocol_name)
    
    if initiator:
        noise.set_as_initiator()
        noise.set_prologue(b"molt-connect-v1")
        noise.set_local_static_private_key(my_static_key)
        noise.set_remote_static_public_key(peer_static_key)
    else:
        noise.set_as_responder()
        noise.set_prologue(b"molt-connect-v1")
        noise.set_local_static_private_key(my_static_key)
    
    noise.start_handshake()
    return noise

# Initiator sends first message
handshake.write_message(b"")  # Empty payload for handshake

# Responder receives and responds
handshake.read_message(message)
response = handshake.write_message(b"")

# After handshake, use encrypt/decrypt
encrypted = noise.encrypt(message)
plaintext = noise.decrypt(encrypted)
```

### Security Properties

| Pattern | Messages | Initiator Auth | Responder Auth | Forward Secrecy | Identity Hiding |
|---------|----------|----------------|----------------|-----------------|-----------------|
| NN | 2 | None | None | Weak | Good |
| NK | 2 | None | Yes | Strong | Good |
| XK | 3 | Yes | Yes | Strong | Good |
| IK | 2 | Yes | Yes | Strong | Moderate |
| XX | 3 | Yes | Yes | Strong | Good |

### Performance

- **Handshake overhead:** 96-144 bytes (2-3 messages with keys)
- **Per-message overhead:** 16 bytes (Poly1305 auth tag)
- **Computation:** 2-4 DH operations during handshake
- **No per-message DH** after handshake (unlike Signal)

---

## 3. Key Exchange Patterns

### For Long-Lived Peer Relationships

#### Option A: Simple X25519 ECDH (Simplest)

```python
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey, X25519PublicKey
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

def simple_key_exchange(my_private_key, peer_public_key):
    """Simple ECDH key exchange for known peers."""
    # Perform X25519 key exchange
    shared_secret = my_private_key.exchange(peer_public_key)
    
    # Derive session key using HKDF
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"molt-connect-session",
    )
    session_key = hkdf.derive(shared_secret)
    return session_key
```

**Pros:**
- Extremely simple
- No additional round trips
- Small key sizes (32 bytes)

**Cons:**
- No forward secrecy for the session
- No authentication unless keys are verified out-of-band
- Key compromise reveals all past messages in session

#### Option B: Signed ECDH (Recommended)

```python
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey, X25519PublicKey
from cryptography.hazmat.primitives import serialization

def generate_identity_keypair():
    """Generate long-term identity key pair."""
    return Ed25519PrivateKey.generate()

def derive_x25519_from_ed25519(ed_private_key):
    """Derive X25519 key from Ed25519 for key exchange."""
    # Extract seed and derive X25519 private key
    # Note: This is simplified; use libsodium for production
    seed = ed_private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption()
    )
    return X25519PrivateKey.from_private_bytes(seed[:32])

def signed_key_exchange(my_identity_key, peer_identity_pubkey, ephemeral_key=None):
    """
    Signed ECDH with ephemeral key for forward secrecy.
    
    1. Generate ephemeral X25519 key
    2. Sign ephemeral public key with identity key
    3. Perform DH with both identity and ephemeral keys
    """
    if ephemeral_key is None:
        ephemeral_key = X25519PrivateKey.generate()
    
    # Sign ephemeral public key
    ephemeral_pub_bytes = ephemeral_key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
    signature = my_identity_key.sign(ephemeral_pub_bytes)
    
    # Perform key exchange
    # DH1 = ECDH(my_ephemeral, peer_ephemeral)
    # DH2 = ECDH(my_identity_x, peer_identity_x)
    # SK = KDF(DH1 || DH2)
    
    return {
        'ephemeral_pub': ephemeral_pub_bytes,
        'signature': signature,
        'identity_pub': my_identity_key.public_key()
    }
```

**Pros:**
- Authentication via signatures
- Forward secrecy with ephemeral keys
- Non-repudiation (can prove who sent what)

**Cons:**
- More complex
- Signature overhead (64 bytes)
- Need to manage ephemeral keys

#### Option C: Triple DH (Signal-style, Simplified)

```python
def triple_dh(ik_a, ek_a, ik_b, ek_b):
    """
    Triple DH for mutual authentication and forward secrecy.
    
    DH1 = DH(IK_A, IK_B)  # Mutual authentication
    DH2 = DH(EK_A, IK_B)  # Authentication + FS
    DH3 = DH(IK_A, EK_B)  # Authentication + FS
    
    SK = KDF(DH1 || DH2 || DH3)
    """
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes
    
    # Perform three DH operations
    dh1 = dh(ik_a, ik_b)  # static-static
    dh2 = dh(ek_a, ik_b)  # ephemeral-static
    dh3 = dh(ik_a, ek_b)  # static-ephemeral
    
    # Combine with HKDF
    combined = dh1 + dh2 + dh3
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"molt-connect-triple-dh",
    )
    return hkdf.derive(combined)
```

---

## 4. Forward Secrecy

### What Is It?

Forward secrecy ensures that if long-term keys are compromised, past session communications remain secure.

### Do We Need It?

**For Molt Connect: YES, but consider the level needed.**

| Threat Model | Forward Secrecy Level | Recommendation |
|--------------|----------------------|----------------|
| Casual messaging with friends | Session-level | Ephemeral keys per session |
| Business/legal communications | Message-level | Double Ratchet or similar |
| High-risk (activists, journalists) | Maximum | Signal Protocol |

### How Signal Achieves It

1. **X3DH:** One-time prekeys ensure initial FS
2. **Double Ratchet:** DH ratchet rotates keys continuously
3. **Key deletion:** Old keys are immediately deleted

### Overhead Analysis

| Approach | Key Exchange Overhead | Per-Message Overhead | State Size |
|----------|----------------------|---------------------|------------|
| No FS | 32 bytes | 16 bytes | 64 bytes |
| Session FS | 64 bytes | 16 bytes | 128 bytes |
| Signal (message-level) | ~100 bytes | ~50 bytes | ~4KB |

### Simple Forward Secrecy Implementation

```python
class SessionRatchet:
    """Simple symmetric ratchet for forward secrecy."""
    
    def __init__(self, root_key):
        self.root_key = root_key
        self.chain_key = root_key
        self.message_number = 0
    
    def next_message_key(self):
        """Derive next message key and advance chain."""
        from cryptography.hazmat.primitives.kdf.hkdf import HKDF
        from cryptography.hazmat.primitives import hashes
        
        # Derive chain key and message key
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=64,
            salt=None,
            info=b"molt-ratchet",
        )
        output = hkdf.derive(self.chain_key + self.message_number.to_bytes(8, 'big'))
        
        self.chain_key = output[:32]
        message_key = output[32:]
        self.message_number += 1
        
        # Delete previous key material
        del output
        return message_key
```

---

## 5. Message Authentication

### Options

#### Ed25519 Signatures

```python
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.exceptions import InvalidSignature

def sign_message(private_key: Ed25519PrivateKey, message: bytes) -> bytes:
    """Sign a message with Ed25519."""
    return private_key.sign(message)

def verify_signature(public_key: Ed25519PublicKey, message: bytes, signature: bytes) -> bool:
    """Verify an Ed25519 signature."""
    try:
        public_key.verify(signature, message)
        return True
    except InvalidSignature:
        return False
```

**Characteristics:**
- **Signature size:** 64 bytes
- **Public key size:** 32 bytes
- **Security level:** 128-bit
- **Speed:** Very fast verification

#### AEAD Encryption (Authenticated Encryption)

```python
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305

def encrypt_message(key: bytes, plaintext: bytes, associated_data: bytes) -> bytes:
    """Encrypt with ChaCha20-Poly1305 AEAD."""
    nonce = os.urandom(12)  # 96-bit nonce
    cipher = ChaCha20Poly1305(key)
    ciphertext = cipher.encrypt(nonce, plaintext, associated_data)
    return nonce + ciphertext

def decrypt_message(key: bytes, encrypted: bytes, associated_data: bytes) -> bytes:
    """Decrypt with ChaCha20-Poly1305 AEAD."""
    nonce = encrypted[:12]
    ciphertext = encrypted[12:]
    cipher = ChaCha20Poly1305(key)
    return cipher.decrypt(nonce, ciphertext, associated_data)
```

**Characteristics:**
- **Overhead:** 28 bytes (12 nonce + 16 tag)
- **Authentication:** Built-in via Poly1305 MAC
- **Confidentiality:** ChaCha20 encryption

### Recommendation: AEAD + Optional Signature

For most messages:
```
encrypted_message = AEAD_Encrypt(session_key, message, associated_data)
```

For important/significant messages:
```
signature = Sign(identity_key, message_hash)
encrypted_message = AEAD_Encrypt(session_key, message + signature, associated_data)
```

### Overhead Comparison

| Method | Authentication | Confidentiality | Overhead |
|--------|----------------|-----------------|----------|
| Ed25519 only | Yes | No | 64 bytes |
| AEAD only | Yes | Yes | 28 bytes |
| AEAD + Ed25519 | Double | Yes | 92 bytes |

---

## 6. Comparison of Approaches

### Feature Comparison

| Feature | Signal Protocol | Noise (XK) | Simple ECDH | Signed ECDH |
|---------|----------------|------------|-------------|-------------|
| **Complexity** | Very High | Medium | Low | Medium |
| **Forward Secrecy** | Per-message | Per-session | None | Per-session |
| **Post-Compromise Security** | Yes | No | No | No |
| **Async Support** | Excellent | Good | Poor | Good |
| **State Management** | Complex | Simple | Minimal | Simple |
| **Message Overhead** | ~50 bytes | 16 bytes | 16 bytes | 16 bytes |
| **Handshake Messages** | 3+ | 2-3 | 1 | 2 |
| **Library Maturity** | High | High | Very High | Very High |
| **Identity Hiding** | Good | Good | None | None |

### Implementation Complexity

| Aspect | Signal | Noise | Simple ECDH |
|--------|--------|-------|-------------|
| Lines of code | ~3000+ | ~500-1000 | ~100-200 |
| Dependencies | libsignal | noise-lib | cryptography/libsodium |
| Testing burden | High | Medium | Low |
| Audit required | Critical | Important | Standard |

### Performance Comparison (Approximate)

| Operation | Signal | Noise XK | Simple ECDH |
|-----------|--------|----------|-------------|
| Handshake | 4-6 DH ops | 3 DH ops | 1-2 DH ops |
| Encrypt message | 1 KDF + 1 AEAD | 1 AEAD | 1 AEAD |
| Decrypt message | 1 KDF + 1 AEAD | 1 AEAD | 1 AEAD |
| Key rotation | Per message | Per session | Manual |

---

## 7. Recommendation for Molt Connect

### Recommended Approach: Noise Protocol (XK pattern)

**Why Noise XK:**

1. **Simpler than Signal** - Clearer implementation, less state
2. **Good security properties** - Mutual auth, forward secrecy, identity hiding
3. **Known peers** - Fits Molt Connect's peer-to-peer model
4. **Mature libraries** - Available in most languages
5. **3-way handshake** - Good balance of security and performance

### Implementation Stack

```
Layer 7: Application Messages
Layer 6: Message Encryption (ChaCha20-Poly1305)
Layer 5: Optional Message Signing (Ed25519)
Layer 4: Noise XK Handshake
Layer 3: Transport (WebSocket / TCP)
Layer 2: Peer Discovery
Layer 1: Network
```

### Key Generation and Storage

```python
# At install/registration
identity_key = Ed25519PrivateKey.generate()  # Long-term identity
storage.save_encrypted("identity.key", identity_key)

# For each peer session
ephemeral_key = X25519PrivateKey.generate()  # Per-session
```

### Message Format

```
+----------------+----------------+------------------+----------------+
| Message Type   | Message Number | Encrypted Data   | Auth Tag       |
| (1 byte)       | (8 bytes)      | (variable)       | (16 bytes)     |
+----------------+----------------+------------------+----------------+

For signed messages:
+----------------+----------------+----------------+------------------+----------------+
| Message Type   | Message Number | Signature      | Encrypted Data   | Auth Tag       |
| (1 byte)       | (8 bytes)      | (64 bytes)     | (variable)       | (16 bytes)     |
+----------------+----------------+----------------+------------------+----------------+
```

### Session Lifecycle

1. **Discovery** - Peer A discovers Peer B's public key
2. **Handshake** - Noise XK 3-way handshake
3. **Messaging** - Encrypted message exchange
4. **Key Rotation** - New session after X messages or time
5. **Session End** - Delete all session keys

### When to Consider Alternatives

| Scenario | Alternative | Reason |
|----------|-------------|--------|
| Offline messaging common | Signal Protocol | Asynchronous support |
| Minimal security needs | Simple ECDH | Simplicity |
| Maximum deniability | Signal Protocol | Better deniability |
| Post-quantum required | Noise + Kyber | Hybrid security |

### Libraries to Use

| Language | Library | Notes |
|----------|---------|-------|
| Python | `noise-connection` or `cryptography` | cryptography is more maintained |
| JavaScript | `noise-protocol` | Web and Node.js |
| Rust | `snow` | Most popular Rust Noise impl |
| Go | `libnoise` | Native Go implementation |
| Swift | `SignalProtocolSwift` or `NoiseSwift` | iOS development |

---

## 8. Implementation Checklist

- [ ] Generate and securely store Ed25519 identity key
- [ ] Implement Noise XK handshake
- [ ] Implement ChaCha20-Poly1305 message encryption
- [ ] Add optional Ed25519 message signing
- [ ] Implement key rotation policy
- [ ] Secure key storage (encrypted at rest)
- [ ] Implement peer key verification UI
- [ ] Add replay protection (message numbers)
- [ ] Handle out-of-order messages
- [ ] Test with known test vectors

---

## References

1. [Signal Protocol Documentation](https://signal.org/docs/)
2. [Noise Protocol Framework](https://noiseprotocol.org/noise.html)
3. [Double Ratchet Specification](https://signal.org/docs/specifications/doubleratchet/)
4. [X3DH Specification](https://signal.org/docs/specifications/x3dh/)
5. [libsodium Documentation](https://doc.libsodium.org/)
6. [Ed25519 (cryptography.io)](https://cryptography.io/en/latest/hazmat/primitives/asymmetric/ed25519/)
7. [RFC 7748 - Elliptic Curves for Security](https://tools.ietf.org/html/rfc7748)
8. [RFC 8439 - ChaCha20-Poly1305](https://tools.ietf.org/html/rfc8439)

---

*End of Report*
