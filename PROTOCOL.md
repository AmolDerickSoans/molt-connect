# Molt Connect Wire Protocol Specification

**Version:** 1.0.0  
**Last Updated:** 2026-03-27  
**Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Message Types](#2-message-types)
3. [Message Framing](#3-message-framing)
4. [Handshake Protocol](#4-handshake-protocol)
5. [Encryption](#5-encryption)
6. [Compression](#6-compression)
7. [Context Sync Protocol](#7-context-sync-protocol)
8. [Keepalive Protocol](#8-keepalive-protocol)
9. [Error Codes](#9-error-codes)
10. [Security Considerations](#10-security-considerations)
11. [Appendices](#appendices)

---

## 1. Overview

### 1.1 Purpose

This specification defines the wire protocol for Molt Connect, enabling secure peer-to-peer communication between AI agents. The protocol provides:

- **Mutual authentication** via Ed25519 identity keys
- **Forward secrecy** per session via Noise XK handshake
- **Efficient messaging** with optional compression
- **Context synchronization** for agent state sharing

### 1.2 Protocol Stack

```
┌─────────────────────────────────────────────────┐
│              Application Layer                   │
│  (Messages, Context Sync, Queries, Permissions) │
├─────────────────────────────────────────────────┤
│              Protocol Layer                      │
│  (Message Framing, Compression, Serialization)  │
├─────────────────────────────────────────────────┤
│              Encryption Layer                    │
│  (Noise XK Handshake, ChaCha20-Poly1305)        │
├─────────────────────────────────────────────────┤
│              Transport Layer                     │
│  (WebRTC DataChannel, WebSocket, TCP)           │
├─────────────────────────────────────────────────┤
│              Discovery Layer                     │
│  (Nostr Relays, mDNS, DHT)                      │
└─────────────────────────────────────────────────┘
```

### 1.3 Design Principles

1. **Security First**: All messages encrypted after handshake
2. **Efficiency**: Binary framing, optional compression
3. **Simplicity**: Clear state machine, minimal round-trips
4. **Interoperability**: Standard algorithms (Ed25519, ChaCha20, zstd)
5. **Extensibility**: Version field, reserved ranges for future use

---

## 2. Message Types

### 2.1 Type Registry

Message types are encoded as a single unsigned byte (0-255).

| Type ID | Name | Direction | Description |
|---------|------|-----------|-------------|
| `0x00` | Reserved | - | Invalid/reserved |
| `0x01` | HELLO | Initiator → Responder | Connection request |
| `0x02` | HELLO_ACK | Responder → Initiator | Accept/reject connection |
| `0x03` | KEY_EXCHANGE | Bidirectional | Key exchange (Noise handshake) |
| `0x04` | MESSAGE | Bidirectional | Simple text message |
| `0x05` | CONTEXT_COMPRESSED | Bidirectional | Compressed context (summary + key facts) |
| `0x06` | CONTEXT_FULL | Bidirectional | Full session context |
| `0x07` | QUERY | Bidirectional | Question without context transfer |
| `0x08` | QUERY_RESPONSE | Bidirectional | Response to query |
| `0x09` | BYE | Bidirectional | Graceful disconnect |
| `0x0A` | PING | Bidirectional | Keepalive request |
| `0x0B` | PONG | Bidirectional | Keepalive response |
| `0x0C` | ERROR | Bidirectional | Protocol error notification |
| `0x0D-0x0F` | Reserved | - | Future use |
| `0x10-0x1F` | Reserved | - | Control messages (future) |
| `0x20-0x7F` | Reserved | - | Application messages (future) |
| `0x80-0xFF` | Private | - | Private/experimental use |

### 2.2 Message Type Definitions

#### 2.2.1 HELLO (0x01)

Initial connection request sent by the initiator.

**Payload Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ HELLO Payload (unencrypted)                                    │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ version          │ Protocol version (1 byte)                   │
│ address_len      │ Address length in bytes (1 byte)            │
│ address          │ UTF-8 encoded three-word address (N bytes)  │
│ agent_name_len   │ Agent display name length (1 byte)          │
│ agent_name       │ UTF-8 encoded display name (N bytes)        │
│ intent_len       │ Intent message length (2 bytes, BE)         │
│ intent           │ UTF-8 encoded intent message (N bytes)      │
│ pubkey_len       │ Public key length (1 byte, always 32)       │
│ pubkey           │ Ed25519 public key (32 bytes)               │
│ timestamp        │ Unix timestamp in ms (8 bytes, BE)          │
│ signature        │ Ed25519 signature (64 bytes)                │
└──────────────────┴─────────────────────────────────────────────┘
```

**Signature Calculation:**
```
signature = Ed25519_Sign(private_key, version || address || agent_name || intent || pubkey || timestamp)
```

**Example (hex):**
```
01                      # Message type: HELLO
00000001                # Frame length: 1 byte version + ...
01                      # Protocol version: 1
11                      # Address length: 17 bytes
72697665722d6d6f6f6e2d64616e6365  # "river-moon-dance"
05                      # Agent name length: 5
416c696365            # "Alice"
0016                  # Intent length: 22 bytes
48692c2049276d20416c6963652773206167656e74  # "Hi, I'm Alice's agent"
20                    # Public key length: 32 bytes
<32 bytes Ed25519 public key>
<8 bytes timestamp>
<64 bytes signature>
```

#### 2.2.2 HELLO_ACK (0x02)

Response to HELLO, accepting or rejecting the connection.

**Payload Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ HELLO_ACK Payload (unencrypted)                                │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ accepted         │ 0x01 = accept, 0x00 = reject (1 byte)       │
│ error_code       │ Error code if rejected (2 bytes, BE)        │
│ error_msg_len    │ Error message length (1 byte)               │
│ error_msg        │ UTF-8 error message (N bytes)               │
│ pubkey_len       │ Public key length (1 byte, always 32)       │
│ pubkey           │ Responder's Ed25519 public key (32 bytes)   │
│ timestamp        │ Unix timestamp in ms (8 bytes, BE)          │
│ signature        │ Ed25519 signature (64 bytes)                │
└──────────────────┴─────────────────────────────────────────────┘
```

**Note:** If `accepted = 0x00`, the connection is closed after sending HELLO_ACK.

#### 2.2.3 KEY_EXCHANGE (0x03)

Noise XK handshake messages. Sent in a 3-way handshake.

**Payload Structure (Handshake Messages):**
```
┌────────────────────────────────────────────────────────────────┐
│ KEY_EXCHANGE Payload (partially encrypted during handshake)    │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ step             │ Handshake step 1, 2, or 3 (1 byte)          │
│ ephemeral_key    │ X25519 ephemeral public key (32 bytes)      │
│ static_key       │ X25519 static public key (step 3 only)      │
│                  │ (32 bytes)                                  │
│ payload          │ Encrypted payload (variable, 0 bytes min)   │
│ auth_tag         │ Poly1305 authentication tag (16 bytes)      │
└──────────────────┴─────────────────────────────────────────────┘
```

See [Section 4](#4-handshake-protocol) for detailed handshake sequence.

#### 2.2.4 MESSAGE (0x04)

Simple text message between peers.

**Payload Structure (after encryption):**
```
┌────────────────────────────────────────────────────────────────┐
│ MESSAGE Payload (encrypted with ChaCha20-Poly1305)             │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ nonce            │ 12-byte nonce for decryption (12 bytes)     │
│ ciphertext_len   │ Ciphertext length (4 bytes, BE)             │
│ ciphertext       │ Encrypted message content (N bytes)         │
│ auth_tag         │ Poly1305 authentication tag (16 bytes)      │
└──────────────────┴─────────────────────────────────────────────┘
```

**Plaintext Structure (before encryption):**
```json
{
  "id": "uuid-v4-string",
  "timestamp": 1709827200000,
  "content": "Hello, this is a message",
  "metadata": {
    "reply_to": "optional-message-id",
    "priority": "normal|high|low"
  }
}
```

#### 2.2.5 CONTEXT_COMPRESSED (0x05)

Compressed context containing summary and key facts.

**Payload Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ CONTEXT_COMPRESSED Payload                                     │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ version          │ Context format version (1 byte)             │
│ compression      │ Compression algorithm (1 byte):             │
│                  │   0x00 = none                               │
│                  │   0x01 = zstd                               │
│                  │   0x02 = brotli                             │
│ summary_len      │ Summary length (2 bytes, BE)                │
│ summary          │ UTF-8 encoded summary (N bytes)             │
│ facts_count      │ Number of key facts (1 byte)                │
│ facts[]          │ Array of key facts                          │
│   fact_len       │ Fact length (2 bytes, BE)                   │
│   fact           │ UTF-8 encoded fact (N bytes)                │
│ entities_count   │ Number of entities (1 byte)                 │
│ entities[]       │ Array of entities                           │
│   entity_type    │ Entity type (1 byte):                       │
│                  │   0x01 = person, 0x02 = place,              │
│                  │   0x03 = project, 0x04 = date               │
│   entity_len     │ Entity name length (1 byte)                 │
│   entity         │ UTF-8 encoded entity name (N bytes)         │
│ timestamp        │ Context generation time (8 bytes, BE)       │
│ checksum         │ CRC32 of uncompressed data (4 bytes, BE)    │
└──────────────────┴─────────────────────────────────────────────┘
```

**Example:**
```json
{
  "summary": "Session focused on planning a weekend trip to Goa. Discussed budget, dates, and activities. Decided on March 15-17.",
  "facts": [
    "Budget set at ₹15,000 per person",
    "Dates confirmed: March 15-17, 2026",
    "Hotel preference: beachside with pool"
  ],
  "entities": [
    {"type": "place", "name": "Goa"},
    {"type": "date", "name": "2026-03-15"},
    {"type": "person", "name": "Rahul"}
  ],
  "timestamp": 1709827200000
}
```

#### 2.2.6 CONTEXT_FULL (0x06)

Complete session context for full state transfer.

**Payload Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ CONTEXT_FULL Payload                                           │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ version          │ Context format version (1 byte)             │
│ compression      │ Compression algorithm (1 byte)              │
│ session_id_len   │ Session ID length (1 byte)                  │
│ session_id       │ UUID v4 session identifier (N bytes)        │
│ created_at       │ Session creation time (8 bytes, BE)         │
│ updated_at       │ Last update time (8 bytes, BE)              │
│ memories_count   │ Number of memory entries (4 bytes, BE)      │
│ memories[]       │ Array of memory entries                     │
│   entry_len      │ Entry length (4 bytes, BE)                  │
│   entry          │ JSON-encoded memory entry (N bytes)         │
│ checkpoints_len  │ Checkpoints data length (4 bytes, BE)       │
│ checkpoints      │ JSON-encoded checkpoints (N bytes)          │
│ checksum         │ CRC32 of uncompressed data (4 bytes, BE)    │
└──────────────────┴─────────────────────────────────────────────┘
```

**Memory Entry Format:**
```json
{
  "id": "uuid-v4",
  "timestamp": 1709827200000,
  "type": "decision|fact|preference|event",
  "content": "The actual memory content",
  "importance": 0.8,
  "tags": ["project", "work"]
}
```

#### 2.2.7 QUERY (0x07)

Question sent without transferring full context.

**Payload Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ QUERY Payload (encrypted)                                      │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ query_id_len     │ Query ID length (1 byte)                    │
│ query_id         │ UUID v4 query identifier (N bytes)          │
│ timeout          │ Query timeout in seconds (2 bytes, BE)      │
│ query_len        │ Query text length (2 bytes, BE)             │
│ query            │ UTF-8 encoded query (N bytes)               │
│ params_len       │ Optional parameters length (2 bytes, BE)    │
│ params           │ JSON-encoded parameters (N bytes)           │
└──────────────────┴─────────────────────────────────────────────┘
```

**Example:**
```json
{
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "timeout": 30,
  "query": "What's the current status of the Mumbai project?",
  "params": {
    "include_history": false,
    "detail_level": "summary"
  }
}
```

#### 2.2.8 QUERY_RESPONSE (0x08)

Response to a QUERY message.

**Payload Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ QUERY_RESPONSE Payload (encrypted)                             │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ query_id_len     │ Query ID length (1 byte)                    │
│ query_id         │ Matching query identifier (N bytes)         │
│ status           │ Response status (1 byte):                   │
│                  │   0x00 = success                            │
│                  │   0x01 = timeout                            │
│                  │   0x02 = error                              │
│ response_len     │ Response length (4 bytes, BE)               │
│ response         │ JSON-encoded response (N bytes)             │
└──────────────────┴─────────────────────────────────────────────┘
```

**Example Response:**
```json
{
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "success",
  "response": {
    "answer": "The Mumbai project is at 75% completion. Key milestones achieved: site acquisition, permits approved, foundation work complete.",
    "confidence": 0.92,
    "sources": ["memory:2024-03-15", "memory:2024-03-20"]
  }
}
```

#### 2.2.9 BYE (0x09)

Graceful connection termination.

**Payload Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ BYE Payload                                                    │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ reason           │ Disconnect reason (1 byte):                 │
│                  │   0x00 = normal close                       │
│                  │   0x01 = going offline                      │
│                  │   0x02 = session timeout                    │
│                  │   0x03 = user requested                     │
│ message_len      │ Optional message length (1 byte)            │
│ message          │ UTF-8 encoded goodbye message (N bytes)     │
└──────────────────┴─────────────────────────────────────────────┘
```

#### 2.2.10 PING (0x0A) / PONG (0x0B)

Keepalive messages to maintain connection.

**PING Payload:**
```
┌────────────────────────────────────────────────────────────────┐
│ PING Payload                                                   │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ timestamp        │ Ping timestamp (8 bytes, BE)                │
│ nonce            │ Random nonce for matching (4 bytes)         │
└──────────────────┴─────────────────────────────────────────────┘
```

**PONG Payload:**
```
┌────────────────────────────────────────────────────────────────┐
│ PONG Payload                                                   │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ ping_timestamp   │ Echo of PING timestamp (8 bytes, BE)        │
│ ping_nonce       │ Echo of PING nonce (4 bytes)                │
│ latency_hint     │ Suggested next ping interval ms (4 bytes)   │
└──────────────────┴─────────────────────────────────────────────┘
```

#### 2.2.11 ERROR (0x0C)

Protocol error notification.

**Payload Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ ERROR Payload                                                  │
├──────────────────┬─────────────────────────────────────────────┤
│ Field            │ Description                                 │
├──────────────────┼─────────────────────────────────────────────┤
│ error_code       │ Error code (2 bytes, BE)                    │
│ message_len      │ Error message length (2 bytes, BE)          │
│ message          │ UTF-8 error message (N bytes)               │
│ recoverable      │ 0x01 = recoverable, 0x00 = fatal (1 byte)   │
│ details_len      │ Optional details length (2 bytes, BE)       │
│ details          │ JSON-encoded error details (N bytes)        │
└──────────────────┴─────────────────────────────────────────────┘
```

---

## 3. Message Framing

### 3.1 Binary Frame Format

All messages are transmitted as binary frames over the transport layer.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MOLT CONNECT MESSAGE FRAME                                               │
├─────────────┬─────────────┬─────────────────┬────────────────────────────┤
│ Offset      │ Size        │ Field           │ Description                │
├─────────────┼─────────────┼─────────────────┼────────────────────────────┤
│ 0           │ 1 byte      │ version         │ Protocol version (0x01)    │
│ 1           │ 1 byte      │ type            │ Message type (see §2)      │
│ 2           │ 8 bytes     │ timestamp       │ Unix timestamp ms (BE)     │
│ 10          │ 1 byte      │ flags           │ Frame flags (see §3.2)     │
│ 11          │ 4 bytes     │ payload_len     │ Payload length (BE)        │
│ 15          │ N bytes     │ payload         │ Message payload            │
│ 15+N        │ 2 bytes     │ checksum        │ CRC16 of header+payload    │
│ 17+N        │ 64 bytes    │ signature       │ Ed25519 signature          │
└─────────────┴─────────────┴─────────────────┴────────────────────────────┘

Total frame size: 17 + N + 64 + 2 = 83 + N bytes (minimum)
```

### 3.2 Frame Flags

The flags byte contains bit flags for frame options:

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  7  │  6  │  5  │  4  │  3  │  2  │  1  │  0  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ RSV │ RSV │ RSV │ RSV │ COMP│ ENC │ ACK │ FIN │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Bit 0 (FIN):    Final frame in a multi-part message
Bit 1 (ACK):    Acknowledgment required
Bit 2 (ENC):    Payload is encrypted
Bit 3 (COMP):   Payload is compressed
Bits 4-7 (RSV): Reserved for future use
```

**Flag Combination Examples:**
- `0x00`: Plain, unencrypted message
- `0x04`: Encrypted message
- `0x08`: Compressed payload
- `0x0C`: Encrypted and compressed
- `0x06`: Encrypted, acknowledgment required

### 3.3 Frame Processing

#### 3.3.1 Sending Frame

```
1. Construct header (version, type, timestamp, flags)
2. Serialize payload according to message type
3. Apply compression if flags.COMP = 1
4. Apply encryption if flags.ENC = 1
5. Calculate payload_len
6. Calculate CRC16 checksum over header + payload
7. Sign header + payload + checksum with Ed25519
8. Transmit complete frame
```

#### 3.3.2 Receiving Frame

```
1. Read fixed header (15 bytes)
2. Validate protocol version
3. Read payload (payload_len bytes)
4. Read checksum (2 bytes)
5. Read signature (64 bytes)
6. Verify CRC16 checksum
7. Verify Ed25519 signature
8. Decrypt if flags.ENC = 1
9. Decompress if flags.COMP = 1
10. Parse payload according to message type
11. Process message
```

### 3.4 Multi-Part Messages

For large payloads (context sync, file transfer), messages can be split:

```
Frame 1: type=CONTEXT_FULL, flags=0x00 (more to come)
Frame 2: type=CONTEXT_FULL, flags=0x00
Frame 3: type=CONTEXT_FULL, flags=0x01 (FIN, last frame)

All frames share the same timestamp for correlation.
```

### 3.5 Code Example: Frame Encoding

```javascript
// JavaScript/Node.js
const crypto = require('crypto');
const crc16 = require('crc/crc16');

function encodeFrame(type, payload, flags = 0x04, keyPair) {
  const version = 0x01;
  const timestamp = BigInt(Date.now());
  const payloadLen = Buffer.byteLength(payload);
  
  // Build header
  const header = Buffer.alloc(15);
  header.writeUInt8(version, 0);
  header.writeUInt8(type, 1);
  header.writeBigUInt64BE(timestamp, 2);
  header.writeUInt8(flags, 10);
  header.writeUInt32BE(payloadLen, 11);
  
  // Calculate checksum
  const headerAndPayload = Buffer.concat([header, payload]);
  const checksum = crc16(headerAndPayload);
  const checksumBuf = Buffer.alloc(2);
  checksumBuf.writeUInt16BE(checksum, 0);
  
  // Sign
  const toSign = Buffer.concat([headerAndPayload, checksumBuf]);
  const signature = crypto.sign(null, toSign, {
    key: keyPair.privateKey,
    type: 'Ed25519'
  });
  
  return Buffer.concat([toSign, signature]);
}

function decodeFrame(buffer, publicKey) {
  const version = buffer.readUInt8(0);
  if (version !== 0x01) throw new Error('Unsupported protocol version');
  
  const type = buffer.readUInt8(1);
  const timestamp = buffer.readBigUInt64BE(2);
  const flags = buffer.readUInt8(10);
  const payloadLen = buffer.readUInt32BE(11);
  
  const payload = buffer.subarray(15, 15 + payloadLen);
  const checksum = buffer.readUInt16BE(15 + payloadLen);
  const signature = buffer.subarray(17 + payloadLen, 81 + payloadLen);
  
  // Verify checksum
  const calculatedChecksum = crc16(buffer.subarray(0, 15 + payloadLen));
  if (checksum !== calculatedChecksum) throw new Error('Checksum mismatch');
  
  // Verify signature
  const toVerify = buffer.subarray(0, 17 + payloadLen);
  const valid = crypto.verify(null, toVerify, {
    key: publicKey,
    type: 'Ed25519'
  }, signature);
  
  if (!valid) throw new Error('Invalid signature');
  
  return { type, timestamp, flags, payload };
}
```

---

## 4. Handshake Protocol

### 4.1 Overview

Molt Connect uses the **Noise XK** handshake pattern for mutual authentication with forward secrecy.

```
Noise_XK_25519_ChaChaPoly_SHA256
```

### 4.2 Handshake Sequence

```
Initiator (A)                              Responder (B)
     │                                           │
     │─────────────────────────────────────────► │
     │  1. HELLO (addr_A, pubkey_A, sig_A)       │
     │                                           │
     │ ◄─────────────────────────────────────────│
     │  2. HELLO_ACK (accept, pubkey_B, sig_B)   │
     │                                           │
     │ ─────────────────────────────────────────►│
     │  3. KEY_EXCHANGE (step=1, e_A, es)        │
     │                                           │
     │ ◄─────────────────────────────────────────│
     │  4. KEY_EXCHANGE (step=2, e_B, ee)        │
     │                                           │
     │ ─────────────────────────────────────────►│
     │  5. KEY_EXCHANGE (step=3, s_A, se)        │
     │                                           │
     │ ◄════════════════════════════════════════►│
     │           ENCRYPTED CHANNEL               │
```

### 4.3 Detailed Handshake Steps

#### Step 1: HELLO

**Initiator → Responder**

The initiator sends connection request with their identity.

```python
# Python pseudocode
hello_payload = {
    'version': 0x01,
    'address': 'river-moon-dance',
    'agent_name': 'Alice',
    'intent': 'Hi, I want to collaborate',
    'pubkey': ed25519_public_key_a,  # 32 bytes
    'timestamp': int(time.time() * 1000),
}
signature = ed25519_sign(private_key_a, serialize(hello_payload))
```

**Responder Processing:**
```python
# 1. Verify signature
if not verify_signature(pubkey_a, hello_payload, signature):
    send_hello_ack(rejected, error_code=0x0101)  # Invalid signature
    close_connection()
    return

# 2. Check blocklist
if address in blocklist:
    send_hello_ack(rejected, error_code=0x0201)  # Blocked
    close_connection()
    return

# 3. Check rate limits
if rate_limited(ip_address):
    send_hello_ack(rejected, error_code=0x0301)  # Rate limited
    close_connection()
    return

# 4. Prompt user (if interactive)
decision = prompt_user(address, agent_name, intent)
if decision == 'allow':
    send_hello_ack(accepted, pubkey_b)
else:
    send_hello_ack(rejected, error_code=0x0202)  # User denied
    close_connection()
```

#### Step 2: HELLO_ACK

**Responder → Initiator**

Responder accepts or rejects the connection.

```python
if accepted:
    hello_ack = {
        'accepted': 0x01,
        'pubkey': ed25519_public_key_b,
        'timestamp': int(time.time() * 1000),
    }
else:
    hello_ack = {
        'accepted': 0x00,
        'error_code': error_code,
        'error_msg': error_message,
    }
signature = ed25519_sign(private_key_b, serialize(hello_ack))
```

#### Step 3: KEY_EXCHANGE (Step 1)

**Initiator → Responder**

Initiator starts Noise XK handshake.

```python
# Noise XK Step 1: -> e, es
ephemeral_a = X25519PrivateKey.generate()

# Derive shared secret: DH(e_A, s_B)
dh_es = dh(ephemeral_a, responder_static_public_key)

# Update chaining key
ck = hkdf(ck, dh_es, 2)
k = ck[0:32]  # Encryption key for next step

# Payload is empty for step 1
payload = b''
ciphertext = chacha20_poly1305_encrypt(k, nonce=0, payload, ad=handshake_hash)

key_exchange_1 = {
    'step': 1,
    'ephemeral_key': ephemeral_a.public_key(),
    'payload': ciphertext,  # Empty encrypted payload
    'auth_tag': ciphertext[-16:],
}
```

#### Step 4: KEY_EXCHANGE (Step 2)

**Responder → Initiator**

Responder responds with their ephemeral key.

```python
# Noise XK Step 2: <- e, ee
ephemeral_b = X25519PrivateKey.generate()

# Derive shared secrets
dh_ee = dh(ephemeral_b, initiator_ephemeral_public)  # DH(e_B, e_A)
dh_es = dh(static_key_b, initiator_ephemeral_public)  # DH(s_B, e_A)

# Update chaining key
ck = hkdf(ck, dh_ee, 2)
ck = hkdf(ck, dh_es, 2)
k = ck[0:32]

# Payload can contain optional data (e.g., supported versions)
payload = encode({'version': 0x01})
ciphertext = chacha20_poly1305_encrypt(k, nonce=0, payload, ad=handshake_hash)

key_exchange_2 = {
    'step': 2,
    'ephemeral_key': ephemeral_b.public_key(),
    'payload': ciphertext,
    'auth_tag': ciphertext[-16:],
}
```

#### Step 5: KEY_EXCHANGE (Step 3)

**Initiator → Responder**

Initiator reveals their static key for authentication.

```python
# Noise XK Step 3: -> s, se
# Derive shared secrets
dh_se = dh(static_key_a, responder_ephemeral_public)  # DH(s_A, e_B)

# Update chaining key
ck = hkdf(ck, dh_se, 2)
k1 = ck[0:32]  # Key for encrypting static key
k2 = ck[32:64]  # Key for encrypting payload

# Encrypt static public key
encrypted_static = chacha20_poly1305_encrypt(k1, nonce=0, 
                                              static_public_key_a, 
                                              ad=handshake_hash)

# Encrypt optional payload
payload = encode({'ready': True})
encrypted_payload = chacha20_poly1305_encrypt(k2, nonce=0, payload, ad=handshake_hash)

key_exchange_3 = {
    'step': 3,
    'static_key': encrypted_static,
    'payload': encrypted_payload,
    'auth_tag': encrypted_payload[-16:],
}

# Derive final session keys
ck = hkdf(ck, b'', 2)
session_key_enc = ck[0:32]  # Key for A → B
session_key_dec = ck[32:64]  # Key for B → A
```

### 4.4 Post-Handshake State

After successful handshake, both parties have:

```python
session_state = {
    'session_id': uuid4(),
    'peer_address': 'river-moon-dance',
    'peer_public_key': peer_ed25519_pubkey,
    'encryption_key': session_key_enc,  # For sending
    'decryption_key': session_key_dec,  # For receiving
    'send_nonce': 0,
    'receive_nonce': 0,
    'created_at': time.time(),
    'last_activity': time.time(),
}
```

### 4.5 Handshake State Machine

```
                    ┌─────────────┐
                    │   IDLE      │
                    └──────┬──────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
          ▼                                 ▼
   ┌─────────────┐                   ┌─────────────┐
   │  HELLO_SENT │                   │ HELLO_RECV  │
   └──────┬──────┘                   └──────┬──────┘
          │                                 │
          │ receive HELLO_ACK               │ send HELLO_ACK
          │                                 │
          ▼                                 ▼
   ┌─────────────┐                   ┌─────────────┐
   │  KEY_STEP1  │ ──step1──►        │ KEY_STEP1   │
   └──────┬──────┘                   └──────┬──────┘
          │                                 │
          │ receive step2                   │ send step2
          │                                 │
          ▼                                 ▼
   ┌─────────────┐                   ┌─────────────┐
   │  KEY_STEP2  │ ◄──step2──        │ KEY_STEP2   │
   └──────┬──────┘                   └──────┬──────┘
          │                                 │
          │ send step3                      │ receive step3
          │                                 │
          ▼                                 ▼
   ┌─────────────┐                   ┌─────────────┐
   │  KEY_STEP3  │ ──step3──►        │ KEY_STEP3   │
   └──────┬──────┘                   └──────┬──────┘
          │                                 │
          │                                 │
          └───────────────┬─────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  ESTABLISHED│
                   └─────────────┘
```

### 4.6 Error Handling During Handshake

| Error | Code | Handling |
|-------|------|----------|
| Invalid signature | 0x0101 | Close connection immediately |
| Peer blocked | 0x0201 | Close, ignore future HELLOs |
| User denied | 0x0202 | Close connection gracefully |
| Rate limited | 0x0301 | Close, suggest retry later |
| Invalid public key | 0x0102 | Close connection |
| Handshake timeout | 0x0401 | Close after 30s inactivity |
| Invalid message format | 0x0103 | Close connection |

### 4.7 Key Rotation

For long-lived sessions, keys should be rotated periodically:

**Trigger Conditions:**
- Time-based: Every 24 hours
- Message count: Every 10,000 messages
- Manual: On user request
- After BYE/ERROR: Before reconnection

**Re-handshake Process:**
```
1. Send BYE with reason=0x04 (key rotation)
2. Wait for BYE response
3. Initiate new handshake from ESTABLISHED state
4. Maintain session_id continuity
```

---

## 5. Encryption

### 5.1 Encryption Algorithm

All post-handshake messages use **ChaCha20-Poly1305** AEAD encryption.

```
Algorithm: ChaCha20-Poly1305
Key size: 256 bits (32 bytes)
Nonce size: 96 bits (12 bytes)
Tag size: 128 bits (16 bytes)
```

### 5.2 Key Derivation

Session keys are derived using HKDF-SHA256:

```python
def derive_session_keys(shared_secret: bytes, context: bytes) -> tuple:
    """
    Derive encryption and decryption keys from shared secret.
    
    Args:
        shared_secret: 32-byte DH shared secret
        context: Handshake transcript hash
    
    Returns:
        (encryption_key, decryption_key) - each 32 bytes
    """
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes
    
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=64,
        salt=context,
        info=b"molt-connect-session-v1",
    )
    output = hkdf.derive(shared_secret)
    
    return output[:32], output[32:]
```

### 5.3 Nonce Management

Nonces are derived from a monotonically increasing counter:

```python
class NonceManager:
    """Manages message nonces to prevent reuse."""
    
    def __init__(self, initial_nonce: int = 0):
        self.send_nonce = initial_nonce
        self.receive_nonce = initial_nonce
        self.received_nonces = set()  # For out-of-order handling
    
    def next_send_nonce(self) -> bytes:
        """Get next nonce for sending."""
        nonce = self.send_nonce.to_bytes(12, 'big')
        self.send_nonce += 1
        return nonce
    
    def check_receive_nonce(self, nonce: bytes) -> bool:
        """Validate received nonce (prevent replay)."""
        nonce_int = int.from_bytes(nonce, 'big')
        
        # Allow small window for out-of-order messages
        if nonce_int < self.receive_nonce - 10:
            return False  # Too old, possible replay
        
        if nonce_int in self.received_nonces:
            return False  # Duplicate
        
        self.received_nonces.add(nonce_int)
        self.receive_nonce = max(self.receive_nonce, nonce_int + 1)
        
        # Cleanup old nonces
        if len(self.received_nonces) > 100:
            self.received_nonces = {n for n in self.received_nonces 
                                    if n >= self.receive_nonce - 50}
        
        return True
```

### 5.4 Message Encryption/Decryption

```python
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
import os

class MessageCrypto:
    """Handles message encryption and decryption."""
    
    def __init__(self, encryption_key: bytes, decryption_key: bytes):
        self.send_cipher = ChaCha20Poly1305(encryption_key)
        self.recv_cipher = ChaCha20Poly1305(decryption_key)
        self.nonce_manager = NonceManager()
    
    def encrypt(self, plaintext: bytes, associated_data: bytes = b'') -> bytes:
        """
        Encrypt a message with ChaCha20-Poly1305.
        
        Returns: nonce (12) + ciphertext + tag (16)
        """
        nonce = self.nonce_manager.next_send_nonce()
        ciphertext = self.send_cipher.encrypt(nonce, plaintext, associated_data)
        return nonce + ciphertext
    
    def decrypt(self, encrypted: bytes, associated_data: bytes = b'') -> bytes:
        """
        Decrypt a message.
        
        Args:
            encrypted: nonce (12) + ciphertext + tag (16)
        
        Returns: plaintext bytes
        """
        if len(encrypted) < 28:  # 12 + 16 minimum
            raise ValueError("Encrypted message too short")
        
        nonce = encrypted[:12]
        ciphertext = encrypted[12:]
        
        # Validate nonce
        if not self.nonce_manager.check_receive_nonce(nonce):
            raise ValueError("Invalid or replayed nonce")
        
        return self.recv_cipher.decrypt(nonce, ciphertext, associated_data)
```

### 5.5 Encryption Overhead

| Component | Size |
|-----------|------|
| Nonce | 12 bytes |
| Authentication tag | 16 bytes |
| **Total overhead** | **28 bytes** |

### 5.6 Associated Data

The frame header is used as associated data for authentication:

```python
# Associated data = version + type + timestamp + flags + payload_len
associated_data = frame[0:15]

# This ensures the header cannot be tampered with
encrypted_payload = crypto.encrypt(payload, associated_data)
```

---

## 6. Compression

### 6.1 Compression Algorithm

**Primary: Zstandard (zstd)**

```
Algorithm: zstd
Level: 3 (default) - balance of speed and ratio
Dictionary: None (generic)
Minimum size for compression: 256 bytes
```

**Alternative: Brotli** (for web environments)

```
Algorithm: Brotli
Quality: 4 (default)
Mode: Generic
```

### 6.2 When to Compress

```python
def should_compress(payload: bytes, message_type: int) -> bool:
    """
    Determine if payload should be compressed.
    
    Rules:
    - Payload must be >= 256 bytes
    - CONTEXT_COMPRESSED and CONTEXT_FULL: always compress
    - MESSAGE: compress if >= 512 bytes
    - Control messages: never compress
    """
    MIN_SIZE = 256
    MESSAGE_THRESHOLD = 512
    
    if len(payload) < MIN_SIZE:
        return False
    
    # Context messages: always compress
    if message_type in (0x05, 0x06):  # CONTEXT_COMPRESSED, CONTEXT_FULL
        return True
    
    # Regular messages: threshold-based
    if message_type == 0x04 and len(payload) >= MESSAGE_THRESHOLD:
        return True
    
    return False
```

### 6.3 Compression Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ SENDER                                                       │
├─────────────────────────────────────────────────────────────┤
│ 1. Serialize payload to bytes                                │
│ 2. Check if should_compress()                                │
│ 3. If yes:                                                   │
│    a. Compress with zstd level 3                             │
│    b. Set flags.COMP = 1                                     │
│    c. Store compression header (1 byte algorithm ID)        │
│ 4. Encrypt compressed/plain payload                          │
│ 5. Build and sign frame                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ RECEIVER                                                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Verify signature                                          │
│ 2. Decrypt payload                                           │
│ 3. Check flags.COMP                                          │
│ 4. If COMP = 1:                                              │
│    a. Read compression header (1 byte)                       │
│    b. Decompress with appropriate algorithm                  │
│ 5. Parse payload                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Compression Header

When compression is applied, prepend a 1-byte header:

```
┌─────────┬─────────────────────────────────────┐
│ Bits    │ Description                         │
├─────────┼─────────────────────────────────────┤
│ 0-3     │ Algorithm: 0=zstd, 1=brotli, 2=lz4  │
│ 4-7     │ Reserved                            │
└─────────┴─────────────────────────────────────┘
```

### 6.5 Compression Ratios (Typical)

| Payload Type | Original | Compressed | Ratio |
|--------------|----------|------------|-------|
| JSON context | 10 KB | 2.1 KB | 4.8x |
| Text message | 1 KB | 0.6 KB | 1.7x |
| Binary data | 5 KB | 4.8 KB | 1.04x |

### 6.6 Code Example

```python
import zstandard as zstd

class Compressor:
    """Handles payload compression."""
    
    def __init__(self, level: int = 3):
        self.compressor = zstd.ZstdCompressor(level=level)
        self.decompressor = zstd.ZstdDecompressor()
    
    def compress(self, data: bytes) -> bytes:
        """Compress data with zstd."""
        if len(data) < 256:
            return data
        
        compressed = self.compressor.compress(data)
        
        # Only use compression if it actually saves space
        if len(compressed) < len(data):
            return bytes([0x00]) + compressed  # 0x00 = zstd
        
        return data
    
    def decompress(self, data: bytes) -> bytes:
        """Decompress data."""
        if len(data) < 2:
            return data
        
        algorithm = data[0]
        
        if algorithm == 0x00:  # zstd
            return self.decompressor.decompress(data[1:])
        elif algorithm == 0x01:  # brotli
            import brotli
            return brotli.decompress(data[1:])
        else:
            raise ValueError(f"Unknown compression algorithm: {algorithm}")
```

---

## 7. Context Sync Protocol

### 7.1 Overview

Context sync enables agents to share their state for collaboration. Two modes:

1. **CONTEXT_COMPRESSED** - Summary + key facts (lightweight, ~1-5 KB)
2. **CONTEXT_FULL** - Complete session dump (heavy, ~10-100 KB)

### 7.2 CONTEXT_COMPRESSED Format

```
┌─────────────────────────────────────────────────────────────────┐
│ CONTEXT_COMPRESSED Payload Structure                            │
├───────────────────┬─────────────────────────────────────────────┤
│ Version           │ 1 byte (0x01)                               │
│ Session ID        │ 16 bytes (UUID)                             │
│ Timestamp         │ 8 bytes (BE)                                │
│ Summary Length    │ 2 bytes (BE)                                │
│ Summary           │ N bytes (UTF-8)                             │
│ Facts Count       │ 1 byte                                      │
│ Facts[]           │ Array of key facts                          │
│ Entities Count    │ 1 byte                                      │
│ Entities[]        │ Array of entities                           │
│ Checksum          │ 4 bytes (CRC32)                             │
└───────────────────┴─────────────────────────────────────────────┘
```

**Serialization Example:**

```python
@dataclass
class KeyFact:
    content: str
    confidence: float
    timestamp: int

@dataclass
class Entity:
    type: str  # "person", "place", "project", "date"
    name: str
    relevance: float

@dataclass
class CompressedContext:
    version: int = 1
    session_id: str = ""
    timestamp: int = 0
    summary: str = ""
    facts: List[KeyFact] = field(default_factory=list)
    entities: List[Entity] = field(default_factory=list)
    
    def to_bytes(self) -> bytes:
        """Serialize to binary format."""
        buf = bytearray()
        
        # Version
        buf.append(self.version)
        
        # Session ID (UUID without dashes)
        buf.extend(uuid.UUID(self.session_id).bytes)
        
        # Timestamp
        buf.extend(struct.pack('>Q', self.timestamp))
        
        # Summary
        summary_bytes = self.summary.encode('utf-8')
        buf.extend(struct.pack('>H', len(summary_bytes)))
        buf.extend(summary_bytes)
        
        # Facts
        buf.append(len(self.facts))
        for fact in self.facts:
            fact_bytes = json.dumps({
                'c': fact.content,
                'conf': fact.confidence,
                'ts': fact.timestamp
            }).encode('utf-8')
            buf.extend(struct.pack('>H', len(fact_bytes)))
            buf.extend(fact_bytes)
        
        # Entities
        buf.append(len(self.entities))
        for entity in self.entities:
            entity_bytes = json.dumps({
                't': entity.type,
                'n': entity.name,
                'r': entity.relevance
            }).encode('utf-8')
            buf.append(len(entity_bytes))
            buf.extend(entity_bytes)
        
        # Checksum
        checksum = zlib.crc32(bytes(buf)) & 0xffffffff
        buf.extend(struct.pack('>I', checksum))
        
        return bytes(buf)
    
    @classmethod
    def from_bytes(cls, data: bytes) -> 'CompressedContext':
        """Deserialize from binary format."""
        # Implementation mirrors to_bytes()
        pass
```

### 7.3 CONTEXT_FULL Format

```
┌─────────────────────────────────────────────────────────────────┐
│ CONTEXT_FULL Payload Structure                                  │
├───────────────────┬─────────────────────────────────────────────┤
│ Version           │ 1 byte (0x01)                               │
│ Session ID        │ 16 bytes (UUID)                             │
│ Created At        │ 8 bytes (BE)                                │
│ Updated At        │ 8 bytes (BE)                                │
│ Memory Count      │ 4 bytes (BE)                                │
│ Memories[]        │ Array of memory entries                     │
│ Preferences Count │ 2 bytes (BE)                                │
│ Preferences[]     │ Array of preferences                        │
│ Checkpoints Count │ 2 bytes (BE)                                │
│ Checkpoints[]     │ Array of checkpoints                        │
│ Checksum          │ 4 bytes (CRC32)                             │
└───────────────────┴─────────────────────────────────────────────┘
```

**Memory Entry Format:**

```python
@dataclass
class MemoryEntry:
    id: str  # UUID
    timestamp: int  # Unix ms
    type: str  # "decision", "fact", "preference", "event", "note"
    content: str
    importance: float  # 0.0 - 1.0
    tags: List[str]
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'ts': self.timestamp,
            'type': self.type,
            'content': self.content,
            'imp': self.importance,
            'tags': self.tags
        }
```

### 7.4 Context Versioning

Contexts include a version field for backward compatibility:

```
Version 0x01: Initial format (current)
Version 0x02: Reserved for future (embedding vectors)
Version 0x03: Reserved for future (binary memory format)
```

**Version Negotiation:**

```python
def negotiate_version(supported: List[int], offered: int) -> int:
    """
    Negotiate context version between peers.
    
    Args:
        supported: List of versions we support
        offered: Version offered by peer
    
    Returns:
        Highest mutually supported version
    """
    if offered in supported:
        return offered
    
    # Fall back to highest common version
    common = set(supported) & {offered}
    if common:
        return max(common)
    
    raise ValueError("No compatible context version")
```

### 7.5 Context Sync Workflow

```
Agent A                                    Agent B
   │                                          │
   │─── CONTEXT_COMPRESSED ──────────────────►│
   │                                          │
   │◄── ACK ──────────────────────────────────│
   │                                          │
   │   [If B needs full context]              │
   │                                          │
   │◄── QUERY: "Need full context" ───────────│
   │                                          │
   │─── CONTEXT_FULL ────────────────────────►│
   │                                          │
   │◄── ACK ──────────────────────────────────│
```

### 7.6 Incremental Sync

For ongoing collaboration, use incremental sync:

```python
@dataclass
class IncrementalSync:
    """Incremental context update."""
    base_timestamp: int  # Last sync time
    additions: List[MemoryEntry]  # New memories
    updates: List[MemoryEntry]  # Modified memories
    deletions: List[str]  # Memory IDs to delete
```

---

## 8. Keepalive Protocol

### 8.1 Purpose

PING/PONG messages maintain connection liveness and measure latency.

### 8.2 Ping Interval

```
Default interval: 30 seconds
Maximum missed PONGs: 3
Timeout: 60 seconds (no activity → close)
```

### 8.3 Ping/Pong Flow

```
Agent A                                    Agent B
   │                                          │
   │─── PING (ts=1000, nonce=0x1234) ────────►│
   │                                          │
   │◄── PONG (ts=1000, nonce=0x1234,          │
   │          latency_hint=30000) ────────────│
   │                                          │
   │  latency = now - ts = RTT                │
```

### 8.4 Adaptive Ping

PONG includes `latency_hint` to adjust ping interval:

```python
class AdaptivePinger:
    """Adjusts ping interval based on network conditions."""
    
    MIN_INTERVAL = 15000  # 15 seconds
    MAX_INTERVAL = 120000  # 2 minutes
    DEFAULT_INTERVAL = 30000  # 30 seconds
    
    def __init__(self):
        self.interval = self.DEFAULT_INTERVAL
        self.rtt_samples = []
    
    def update_interval(self, rtt_ms: int, hint_ms: int):
        """Update ping interval based on latency."""
        self.rtt_samples.append(rtt_ms)
        self.rtt_samples = self.rtt_samples[-10:]  # Keep last 10
        
        avg_rtt = sum(self.rtt_samples) / len(self.rtt_samples)
        
        # Set interval to 3x RTT, bounded
        self.interval = max(
            self.MIN_INTERVAL,
            min(self.MAX_INTERVAL, avg_rtt * 3)
        )
        
        # Respect peer's hint if higher
        if hint_ms > self.interval:
            self.interval = min(hint_ms, self.MAX_INTERVAL)
```

---

## 9. Error Codes

### 9.1 Error Code Format

Error codes are 2-byte values with semantic structure:

```
┌─────────────┬─────────────┐
│ Category    │ Specific    │
│ (high byte) │ (low byte)  │
└─────────────┴─────────────┘

Category:
  0x01 = Authentication/Security
  0x02 = Authorization/Permission
  0x03 = Rate Limiting
  0x04 = Protocol/Handshake
  0x05 = Message Format
  0x06 = Compression
  0x07 = Encryption
  0x08 = Context Sync
  0x09 = Network/Transport
  0xFF = Internal/System
```

### 9.2 Error Code Registry

| Code | Name | Description | Recoverable |
|------|------|-------------|-------------|
| **0x0100** | **Security Errors** | | |
| 0x0101 | INVALID_SIGNATURE | Signature verification failed | No |
| 0x0102 | INVALID_PUBLIC_KEY | Malformed or invalid public key | No |
| 0x0103 | INVALID_MESSAGE_FORMAT | Message doesn't match expected format | No |
| 0x0104 | NONCE_REUSED | Nonce reuse detected (possible replay) | No |
| 0x0105 | DECRYPTION_FAILED | Unable to decrypt message | Yes |
| **0x0200** | **Authorization Errors** | | |
| 0x0201 | PEER_BLOCKED | Peer is in blocklist | No |
| 0x0202 | USER_DENIED | User rejected connection | No |
| 0x0203 | INSUFFICIENT_PERMISSION | Operation not permitted | No |
| **0x0300** | **Rate Limiting** | | |
| 0x0301 | RATE_LIMITED | Too many requests | Yes (retry-after) |
| 0x0302 | CONNECTION_LIMIT | Maximum connections reached | Yes |
| **0x0400** | **Protocol Errors** | | |
| 0x0401 | HANDSHAKE_TIMEOUT | Handshake didn't complete in time | Yes |
| 0x0402 | INVALID_HANDSHAKE_STEP | Unexpected handshake message | No |
| 0x0403 | PROTOCOL_VERSION_MISMATCH | Incompatible protocol version | No |
| 0x0404 | UNEXPECTED_MESSAGE | Message not valid in current state | No |
| **0x0500** | **Message Format Errors** | | |
| 0x0501 | INVALID_PAYLOAD | Payload parsing failed | Yes |
| 0x0502 | PAYLOAD_TOO_LARGE | Exceeds maximum message size | No |
| 0x0503 | CHECKSUM_MISMATCH | CRC check failed | Yes |
| **0x0600** | **Compression Errors** | | |
| 0x0601 | COMPRESSION_FAILED | Unable to compress payload | Yes (try uncompressed) |
| 0x0602 | DECOMPRESSION_FAILED | Unable to decompress payload | Yes |
| 0x0603 | UNKNOWN_COMPRESSION | Unsupported compression algorithm | Yes |
| **0x0700** | **Encryption Errors** | | |
| 0x0701 | ENCRYPTION_FAILED | Unable to encrypt | No |
| 0x0702 | KEY_DERIVATION_FAILED | HKDF failed | No |
| **0x0800** | **Context Sync Errors** | | |
| 0x0801 | CONTEXT_VERSION_UNSUPPORTED | Unknown context format version | Yes |
| 0x0802 | CONTEXT_PARSE_FAILED | Unable to parse context | Yes |
| 0x0803 | CONTEXT_TOO_LARGE | Context exceeds size limit | No |
| **0x0900** | **Network Errors** | | |
| 0x0901 | CONNECTION_TIMEOUT | No response from peer | Yes |
| 0x0902 | CONNECTION_RESET | Connection closed unexpectedly | Yes |
| 0x0903 | RELAY_UNAVAILABLE | No relay available | Yes |
| **0xFF00** | **Internal Errors** | | |
| 0xFF01 | INTERNAL_ERROR | Unexpected internal error | Maybe |
| 0xFF02 | OUT_OF_MEMORY | Insufficient memory | No |

### 9.3 Error Response Format

```python
def create_error_response(error_code: int, message: str, 
                          recoverable: bool, details: dict = None) -> bytes:
    """Create an ERROR message payload."""
    buf = bytearray()
    
    # Error code
    buf.extend(struct.pack('>H', error_code))
    
    # Message
    msg_bytes = message.encode('utf-8')
    buf.extend(struct.pack('>H', len(msg_bytes)))
    buf.extend(msg_bytes)
    
    # Recoverable flag
    buf.append(0x01 if recoverable else 0x00)
    
    # Optional details
    if details:
        details_bytes = json.dumps(details).encode('utf-8')
        buf.extend(struct.pack('>H', len(details_bytes)))
        buf.extend(details_bytes)
    else:
        buf.extend(struct.pack('>H', 0))
    
    return bytes(buf)
```

### 9.4 Error Handling Guidelines

```python
def handle_error(error_message: ErrorMessage):
    """Handle received ERROR message."""
    
    if error_message.recoverable:
        # Log and attempt recovery
        log.warning(f"Recoverable error: {error_message.error_code} - {error_message.message}")
        
        # Attempt recovery based on error type
        if error_message.error_code in (0x0105, 0x0501, 0x0503):
            # Decryption/format issues - request retransmit
            request_retransmit(last_message_id)
        
        elif error_message.error_code == 0x0301:
            # Rate limited - wait and retry
            retry_after = error_message.details.get('retry_after', 60)
            schedule_retry(retry_after)
        
        elif error_message.error_code == 0x0602:
            # Decompression failed - request uncompressed
            send_preference('no_compression')
    
    else:
        # Fatal error - close connection
        log.error(f"Fatal error: {error_message.error_code} - {error_message.message}")
        close_connection(reason=error_message.error_code)
```

---

## 10. Security Considerations

### 10.1 Threat Model

| Threat | Mitigation |
|--------|------------|
| Eavesdropping | ChaCha20-Poly1305 encryption |
| Message tampering | Poly1305 MAC + Ed25519 signatures |
| Replay attacks | Nonce counter + timestamp validation |
| MITM during handshake | Public key verification |
| Key compromise | Forward secrecy via Noise XK |
| Denial of service | Rate limiting, proof-of-work (optional) |

### 10.2 Key Security

```python
# Key storage requirements
KEY_STORAGE = {
    'identity_private': {
        'location': '~/.molt-connect/identity.json',
        'encryption': 'AES-256-GCM with user passphrase',
        'access': 'Owner only (chmod 600)',
    },
    'session_keys': {
        'location': 'memory only',
        'persistence': 'Never written to disk',
        'lifetime': 'Session duration',
    },
    'peer_public_keys': {
        'location': '~/.molt-connect/known-peers.json',
        'verification': 'TOFU or out-of-band',
    }
}
```

### 10.3 Replay Prevention

```python
def validate_timestamp(timestamp: int, max_skew_ms: int = 300000) -> bool:
    """
    Validate message timestamp to prevent replay.
    
    Args:
        timestamp: Unix timestamp in milliseconds
        max_skew_ms: Maximum allowed clock skew (default 5 min)
    """
    now = int(time.time() * 1000)
    skew = abs(now - timestamp)
    
    if skew > max_skew_ms:
        raise SecurityError("Timestamp too skewed, possible replay")
    
    return True
```

### 10.4 Forward Secrecy

Noise XK provides forward secrecy:

```
Session key compromise does NOT reveal:
- Past session communications (different ephemeral keys)
- Other peer sessions (different key exchanges)

Session key compromise DOES reveal:
- Current session messages (until re-handshake)
```

### 10.5 Deniability

Messages provide repudiable deniability:

```
Properties:
- No persistent signature on every message
- MAC keys can be published to forge messages
- Identity signature only on handshake

Result:
- Cannot cryptographically prove who sent a message
- Useful for privacy-sensitive communication
```

---

## Appendices

### A. Constants and Limits

```python
# Protocol constants
PROTOCOL_VERSION = 0x01
PROTOCOL_NAME = b"Noise_XK_25519_ChaChaPoly_SHA256"

# Message size limits
MAX_MESSAGE_SIZE = 16 * 1024 * 1024  # 16 MB
MAX_PAYLOAD_SIZE = 15 * 1024 * 1024  # 15 MB
MAX_CONTEXT_SIZE = 100 * 1024 * 1024  # 100 MB

# Timing constants
HANDSHAKE_TIMEOUT_MS = 30000  # 30 seconds
PING_INTERVAL_MS = 30000  # 30 seconds
PONG_TIMEOUT_MS = 10000  # 10 seconds
MAX_MISSED_PONGS = 3
SESSION_TIMEOUT_MS = 3600000  # 1 hour

# Key sizes
ED25519_PUBLIC_KEY_SIZE = 32
ED25519_PRIVATE_KEY_SIZE = 32
ED25519_SIGNATURE_SIZE = 64
X25519_PUBLIC_KEY_SIZE = 32
X25519_PRIVATE_KEY_SIZE = 32
CHACHA20_KEY_SIZE = 32
CHACHA20_NONCE_SIZE = 12
POLY1305_TAG_SIZE = 16

# Compression
MIN_COMPRESSION_SIZE = 256
COMPRESSION_LEVEL = 3  # zstd
```

### B. JSON Schemas

#### Message Payload Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "timestamp": {
      "type": "integer",
      "minimum": 0
    },
    "content": {
      "type": "string"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "reply_to": {
          "type": "string",
          "format": "uuid"
        },
        "priority": {
          "type": "string",
          "enum": ["low", "normal", "high"]
        }
      }
    }
  },
  "required": ["id", "timestamp", "content"]
}
```

#### Context Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "version": {
      "type": "integer",
      "minimum": 1
    },
    "session_id": {
      "type": "string",
      "format": "uuid"
    },
    "summary": {
      "type": "string",
      "maxLength": 5000
    },
    "facts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "content": { "type": "string" },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "timestamp": { "type": "integer" }
        }
      }
    },
    "entities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["person", "place", "project", "date"] },
          "name": { "type": "string" },
          "relevance": { "type": "number" }
        }
      }
    }
  }
}
```

### C. Test Vectors

#### Message Frame Test Vector

```
Input:
  version: 0x01
  type: 0x04 (MESSAGE)
  timestamp: 1709827200000 (0x0000018E0A3C0000)
  flags: 0x04 (encrypted)
  payload: (empty for test)
  
Expected Frame (hex):
  01                        # version
  04                        # type
  00 00 01 8E 0A 3C 00 00   # timestamp
  04                        # flags
  00 00 00 00               # payload_len = 0
  <CRC16>                   # checksum
  <64 bytes signature>      # Ed25519 signature
```

### D. Implementation Checklist

```
[ ] Implement binary frame encoding/decoding
[ ] Implement Ed25519 key generation and storage
[ ] Implement Noise XK handshake
[ ] Implement ChaCha20-Poly1305 encryption
[ ] Implement zstd compression
[ ] Implement message type handlers
[ ] Implement error handling
[ ] Implement keepalive mechanism
[ ] Implement context sync
[ ] Add comprehensive logging
[ ] Add unit tests for all components
[ ] Add integration tests for handshake
[ ] Security audit of key storage
[ ] Performance benchmarking
```

### E. References

1. [Noise Protocol Framework](https://noiseprotocol.org/noise.html)
2. [RFC 8439 - ChaCha20-Poly1305](https://tools.ietf.org/html/rfc8439)
3. [RFC 8032 - EdDSA](https://tools.ietf.org/html/rfc8032)
4. [RFC 7748 - X25519](https://tools.ietf.org/html/rfc7748)
5. [Zstandard Compression](https://facebook.github.io/zstd/)
6. [Signal Protocol](https://signal.org/docs/)
7. [WebRTC Data Channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

**Document End**

*Version 1.0.0 | 2026-03-27*