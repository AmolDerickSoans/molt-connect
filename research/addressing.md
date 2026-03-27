# Three-Word Addressing Schemes & Uniqueness Guarantees

**Research for Molt Connect**  
**Date: 2026-03-27**

---

## Table of Contents
1. [What3Words](#1-what3words)
2. [BIP39 Mnemonic Phrases](#2-bip39-mnemonic-phrases)
3. [PGP Word List](#3-pgp-word-list)
4. [Alternative Word Lists](#4-alternative-word-lists)
5. [Uniqueness Guarantees](#5-uniqueness-guarantees)
6. [Collision Probability Math](#6-collision-probability-math)
7. [Alternative Addressing Schemes](#7-alternative-addressing-schemes)
8. [Recommendations for Molt Connect](#8-recommendations-for-molt-connect)

---

## 1. What3Words

### Overview
What3Words is a proprietary geocoding system that divides the world into 3m × 3m squares and assigns each square a unique three-word identifier. The entire Earth's surface is mapped to ~57 trillion 3m squares.

### How It Works
- **Grid Division**: Earth divided into 57 trillion squares (3m × 3m)
- **Word Assignment**: Each square gets a unique 3-word combination
- **Word List**: Uses a curated list of ~40,000 words (varies by language)
- **Total Combinations**: 40,000³ = 64 trillion possible addresses
- **Mapping**: Proprietary algorithm maps geographic coordinates to word combinations

### Algorithm Details
- The algorithm is **proprietary and closed-source**
- Words are selected to minimize confusion (phonetically distinct)
- No similar-sounding words in the same geographic area
- Offensive word combinations are filtered out
- Shorter words used for more populated areas

### Collision Rate
- **Zero collisions by design** - the mapping is deterministic
- Each 3m square on Earth has exactly one unique 3-word address
- The word list is larger than needed (40,000³ = 64 trillion > 57 trillion squares)

### Pros
- Human-readable and memorable
- Works offline once you have the algorithm
- Multilingual support
- No collisions guaranteed

### Cons
- **Proprietary** - requires licensing
- Closed algorithm prevents independent verification
- Centralized control
- 3m resolution may not suit all use cases
- Words have no semantic meaning related to location

### Can We Use a Similar Approach?
- **Patent Issues**: What3Words has patents on their approach
- **Alternative**: Create our own word list and mapping algorithm
- **Consideration**: Must ensure no trademark infringement

**Sources:**
- https://en.wikipedia.org/wiki/What3words
- https://what3words.com

---

## 2. BIP39 Mnemonic Phrases

### Overview
BIP39 (Bitcoin Improvement Proposal 39) defines a standard for generating mnemonic phrases from entropy, used primarily in cryptocurrency wallets. It creates human-readable backups of cryptographic seeds.

### How It Works

#### Generation Process
1. Generate entropy (128-256 bits)
2. Calculate checksum (first ENT/32 bits of SHA256)
3. Append checksum to entropy
4. Split into 11-bit groups (each representing 0-2047)
5. Map each group to a word from the wordlist
6. Result: 12-24 words

#### Word List
- **Size**: Exactly 2048 words
- **Languages**: 9 supported (English, Japanese, Korean, Spanish, Chinese, French, Italian, Czech, Portuguese)
- **Word length**: 3-8 characters (varies by language)
- **Unique prefix**: First 4 letters uniquely identify each word

#### Entropy to Word Count
| Entropy (bits) | Checksum (bits) | Total | Words |
|----------------|-----------------|-------|-------|
| 128 | 4 | 132 | 12 |
| 160 | 5 | 165 | 15 |
| 192 | 6 | 198 | 18 |
| 224 | 7 | 231 | 21 |
| 256 | 8 | 264 | 24 |

### Uniqueness Guarantee
- **Not guaranteed globally** - any 12-24 word combination is valid
- Checksum provides error detection (not security)
- ~128 bits of entropy = 2¹²⁸ possible phrases (for 12 words)

### Pros
- Open standard (MIT license)
- Well-tested and widely adopted
- Multiple language support
- Error detection via checksum
- Words are familiar and easy to write

### Cons
- Not designed for uniqueness registration
- No built-in collision resolution
- Longer phrases (12-24 words vs 3)
- Semantically meaningless combinations

### Implementation Notes
- Use PBKDF2 (2048 iterations, HMAC-SHA512) to derive seed
- Wordlist must be sorted for binary search
- First 4 characters uniquely identify each word

**Sources:**
- https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt

---

## 3. PGP Word List

### Overview
The PGP Word List (also called the "biometric word list") was designed by Patrick Juola and Philip Zimmermann for communicating PGP key fingerprints over voice channels.

### Structure
- **Two lists**: Even and odd position words
- **Size**: 256 words each (512 total unique words)
- **Purpose**: Encode 8 bits per word (256 = 2⁸)
- **Design**: Maximum phonetic distance between words

### How It Works
- Each byte (0-255) maps to two possible words (even/odd position)
- Alternating positions use different lists
- Example: Hex "E5" at position 1 → "tradition", at position 2 → "tunnel"
- 20-byte fingerprint → 20 words

### Word Selection Criteria
- Phonetically distinct
- Easy to recognize over phone
- No similar-sounding pairs
- Example words: "accordion", "adrenal", "adviser"...

### Pros
- Designed for voice communication
- High phonetic distinguishability
- Error detection through alternation
- Short words (easy to say)

### Cons
- Only 256 words per list
- Requires many words for long data (20 words for 160-bit fingerprint)
- Not designed for memorable addresses

### Implementation Notes
```
Even words:  accordion, adverb, aerosol, ...
Odd words:   avocado, advice, aerobics, ...
```

**Sources:**
- https://en.wikipedia.org/wiki/PGP_word_list

---

## 4. Alternative Word Lists

### 4.1 Diceware

**Overview**: Method for creating passphrases using dice and a wordlist.

- **Wordlist size**: 7,776 words (6⁵ = 7776, five dice combinations)
- **Entropy**: 12.9 bits per word
- **Source**: Arnold Reinhold (1995)

**Pros**:
- Uses standard dice
- Simple to implement
- No technology required

**Cons**:
- Some obscure words
- Contains single letters and bigrams
- Contains offensive words

### 4.2 EFF Word Lists (2016)

**Overview**: Electronic Frontier Foundation published improved wordlists.

#### Long List
- **Size**: 7,776 words (same as Diceware)
- **Word length**: 3-9 characters (avg 7.0)
- **Entropy**: 12.9 bits/word, 1.8 bits/character
- **Criteria**:
  - Familiar words from Ghent University vocabulary study
  - No profanity or offensive words
  - No homophones
  - No word is prefix of another

#### Short List 1
- **Size**: 1,296 words (6⁴)
- **Word length**: max 5 characters (avg 4.5)
- **Entropy**: 10.3 bits/word, 2.3 bits/character

#### Short List 2 (Typo-Tolerant)
- **Size**: 1,296 words
- **Features**:
  - Unique 3-character prefixes (autocomplete-friendly)
  - Edit distance ≥ 3 between all words (typo correction)
- **Entropy**: 10.3 bits/word, 3.1 bits/character (with autocomplete)

### 4.3 Mnemonicode

**Overview**: Designed by Oren Tirosh for encoding binary data as speakable words.

- **Wordlist size**: 1,626 words
- **Word length**: 4-7 letters
- **Criteria**:
  - No word is prefix of another
  - 5-letter prefix is unique
  - Multi-syllable preferred
  - No offensive words
  - No soundalikes

### 4.4 Word List Comparison

| List | Size | Avg Length | Entropy/word | Purpose |
|------|------|------------|--------------|---------|
| BIP39 | 2,048 | 5.4 chars | 11 bits | Crypto seeds |
| Diceware | 7,776 | 4.3 chars | 12.9 bits | Passphrases |
| EFF Long | 7,776 | 7.0 chars | 12.9 bits | Passphrases |
| EFF Short | 1,296 | 4.5 chars | 10.3 bits | Typing |
| PGP | 512 total | varies | 8 bits | Voice |
| Mnemonicode | 1,626 | ~5 chars | ~10.7 bits | Voice |
| What3Words | ~40,000 | varies | ~15.3 bits | Location |

### Word List Sources
- **BIP39**: https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt
- **EFF Long**: https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt
- **EFF Short 1**: https://www.eff.org/files/2016/09/08/eff_short_wordlist_1.txt
- **EFF Short 2**: https://www.eff.org/files/2016/09/08/eff_short_wordlist_2_0.txt
- **Diceware**: http://world.std.com/~reinhold/diceware.html
- **PGP**: https://en.wikipedia.org/wiki/PGP_word_list
- **Mnemonicode**: https://github.com/singpolyma/mnemonicode

---

## 5. Uniqueness Guarantees

### 5.1 Local-Only: Regenerate on Collision

**Approach**: Generate random address, check local state, regenerate if collision.

**Pros**:
- Simple implementation
- No network coordination needed
- Works for single-device or single-user scenarios

**Cons**:
- Does NOT work for distributed systems
- Race conditions possible
- Requires persistent local state

**Use Case**: Single device generating addresses, local-first apps.

### 5.2 DHT-Based: Kademlia for Registration

**Overview**: Use a Distributed Hash Table (DHT) like Kademlia for decentralized registration.

**How It Works**:
1. Generate random address
2. Perform DHT lookup for that key
3. If not found, register (store) your node ID at that key
4. If found, regenerate and retry

**Kademlia Properties**:
- **O(log n)** lookup complexity
- Nodes identified by random IDs (typically 160 bits)
- XOR distance metric
- Each node maintains k-buckets (routing tables)
- Values stored at k closest nodes

**Pros**:
- Fully decentralized
- No single point of failure
- Scales well
- Battle-tested (used in BitTorrent, IPFS, Ethereum)

**Cons**:
- Complex implementation
- Requires network connectivity
- Sybil attacks possible (mitigated in some implementations)
- Bootstrap nodes needed

**Implementation Notes**:
- Use 160-bit keys for addresses
- Store (address → public_key) mapping
- k typically = 20 (replication factor)
- α typically = 3 (parallel lookups)

**Sources**:
- https://en.wikipedia.org/wiki/Kademlia
- Original paper: Maymounkov & Mazières, 2002

### 5.3 Central Registry

**Approach**: Single server/database that maintains address uniqueness.

**Pros**:
- Simple to implement
- Strong consistency guarantees
- Easy to audit
- Fast lookups

**Cons**:
- Single point of failure
- Centralized control
- Scaling challenges
- Privacy concerns
- Requires trust in operator

**Use Case**: Corporate/internal systems, MVPs.

### 5.4 Content-Addressed: Use Public Key Fingerprint

**Approach**: Derive address from user's public key using a hash function.

**How It Works**:
1. Generate key pair (public/private)
2. Hash public key: address = Hash(public_key)
3. Map hash to word combination

**Properties**:
- Deterministic - same key always gives same address
- Collision-resistant - finding two keys with same hash is computationally infeasible
- Self-certifying - possession of private key proves ownership

**Fingerprint Formats**:
- SHA-1: 160 bits (deprecated for security)
- SHA-256: 256 bits (recommended)
- Truncated SHA-256: 64-128 bits (for shorter addresses)

**Pros**:
- No registration needed
- Cryptographic guarantee of uniqueness
- Self-authenticating
- No central authority required

**Cons**:
- Cannot choose memorable address
- Changing keys means changing address
- If collision found, serious security implications

**Example (SSH fingerprint)**:
```
SHA256:uNiVztksCsDhcc0u9e8BujQXZUpKZIDTMczCvj3tD2s
```

**Sources**:
- https://en.wikipedia.org/wiki/Public_key_fingerprint

### 5.5 Hybrid Approaches

**Proposed for Molt Connect**:

```
Option A: Fingerprint + Word Mapping
1. Generate Ed25519 key pair
2. Hash public key → 64-bit fingerprint
3. Split fingerprint into 3 × 21-bit parts (2^21 = 2,097,152)
4. Map each part to word from 2048-word list (modular)

Option B: Random + DHT Registration
1. Generate random 3-word address
2. Register on DHT with public key
3. On collision, regenerate
4. Low collision probability makes this practical

Option C: Reserved + Random
1. Reserve special prefixes for premium/verified addresses
2. Generate random addresses for others
3. Use DHT for registration
```

---

## 6. Collision Probability Math

### 6.1 Birthday Problem Basics

The birthday problem: How many people needed before two share a birthday?

- For 365 days: **23 people** for 50% probability
- General formula: n ≈ 1.18√d for 50% probability

### 6.2 Collision Probability Formula

For n items randomly chosen from d possible values:

**Probability of at least one collision:**

P(collision) = 1 - P(no collision)

P(no collision) = (d/d) × ((d-1)/d) × ((d-2)/d) × ... × ((d-n+1)/d)

**Approximation** (for n << d):

P(collision) ≈ 1 - e^(-n²/(2d))

**Number of items for probability p:**

n ≈ √(2d × ln(1/(1-p)))

For 50% probability: n ≈ 1.18√d

### 6.3 Three-Word Address Collision Analysis

**Assuming 2048-word list (like BIP39):**

Total combinations: 2048³ = **8,589,934,592** (≈ 8.6 billion)

| Users (n) | Collision Probability |
|-----------|----------------------|
| 10,000 | 0.0058% |
| 100,000 | 0.58% |
| 500,000 | 14.3% |
| 1,000,000 | 44.2% |
| 1,300,000 | 50% |
| 2,000,000 | 79% |
| 5,000,000 | 99.97% |

**Formula used**: P ≈ 1 - e^(-n²/(2 × 8.59×10⁹))

**Maximum users before 50% collision**: ~130,000 users

### 6.4 With 4096-Word List

Total combinations: 4096³ = **68,719,476,736** (≈ 68.7 billion)

| Users (n) | Collision Probability |
|-----------|----------------------|
| 100,000 | 0.007% |
| 1,000,000 | 0.7% |
| 5,000,000 | 15% |
| 10,000,000 | 52% |
| 15,000,000 | 50% |

**Maximum users before 50% collision**: ~370,000 users

### 6.5 With Larger Word Lists

| Word List Size | Total Combinations | Max Users (50% collision) |
|----------------|-------------------|---------------------------|
| 1024 words | 1.07 billion | 46,000 |
| 2048 words | 8.59 billion | 130,000 |
| 4096 words | 68.7 billion | 370,000 |
| 7776 words | 470 billion | 970,000 |
| 10,000 words | 1 trillion | 1.5 million |

### 6.6 Adding a Fourth Word

| Word List Size | 3 Words | 4 Words |
|----------------|---------|---------|
| 2048 | 8.59B (130K users) | 17.6T (4.1M users) |
| 4096 | 68.7B (370K users) | 281T (12M users) |

### 6.7 Collision Probability Calculator

```python
import math

def collision_prob(n_users, word_list_size, num_words):
    total = word_list_size ** num_words
    if n_users < 2:
        return 0
    # Approximation for n << total
    prob = 1 - math.exp(-(n_users ** 2) / (2 * total))
    return prob

def users_for_probability(prob, word_list_size, num_words):
    total = word_list_size ** num_words
    # n ≈ sqrt(2 * total * ln(1/(1-p)))
    n = math.sqrt(2 * total * math.log(1/(1-prob)))
    return int(n)

# Example: 2048 words, 3-word addresses
print(users_for_probability(0.5, 2048, 3))  # ~130,000
```

---

## 7. Alternative Addressing Schemes

### 7.1 Public Key Fingerprints

**Format**: Hash of public key, encoded for human readability.

**Examples**:
- SSH: SHA256:base64 string
- PGP: Hexadecimal with spaces
- Onion addresses: Base32 of public key

**Pros**:
- Cryptographically unique
- Self-authenticating
- No registration required

**Cons**:
- Not memorable
- Long strings

### 7.2 Short Hashes

**Approach**: Truncate cryptographic hash to memorable length.

| Bits | Combinations | Example |
|------|--------------|---------|
| 32 | 4.3 billion | Hex: `a3f7c901` |
| 48 | 281 trillion | Hex: `a3f7c901d4e2` |
| 64 | 18 quintillion | Base32: `a3f7c901` (8 chars) |

**Collision risk**: Higher than full hash, but acceptable for some use cases.

### 7.3 Categorization-Based Addresses

**Idea**: Use word types for semantic meaning.

Format: `adjective-noun-verb` or `adjective-noun-noun`

Example: `swift-river-flows`

**Word counts needed**:
- Adjectives: 500-1000
- Nouns: 1000-2000
- Verbs: 500-1000

**Combinations**: 1000 × 2000 × 1000 = 2 billion

**Pros**:
- More memorable
- Semantically meaningful
- Less random-sounding

**Cons**:
- Fewer total combinations
- More complex word list management

### 7.4 Syllable-Based Addresses

**Approach**: Construct addresses from syllables.

Example: `ba-na-na`, `to-ma-to`

**Syllable inventory**: ~10,000 English syllables

**Combinations**: 10,000³ = 1 trillion

**Pros**:
- Pronounceable
- Cross-language friendly
- Shorter than words

**Cons**:
- Less meaningful
- Needs syllable database

### 7.5 Number-Based Addresses

**Approach**: Use memorable number combinations.

**Examples**:
- Phone-style: `123-456-7890`
- Credit card style: `1234-5678-9012-3456`
- Short code: `ABC-123`

**Pros**:
- Universal (numbers work in all languages)
- Easy to type

**Cons**:
- Less memorable than words
- Fewer combinations per character

---

## 8. Recommendations for Molt Connect

### 8.1 Recommended Approach: Hybrid

```
Primary Address: Content-addressed from public key
Human-Readable Alias: 3-word address (optional, registered)
```

### 8.2 Implementation Plan

#### Phase 1: Core Addressing
1. **Generate Ed25519 key pair** for each user
2. **Derive 64-bit fingerprint** from public key (truncated SHA-256)
3. **Map fingerprint to 3-word address** using 2048-word BIP39 list

#### Phase 2: Uniqueness Guarantee
1. **Use Kademlia DHT** for distributed registration
2. Store mapping: `address → {public_key, timestamp, signature}`
3. **Collision resolution**: If collision, use full fingerprint (longer)

#### Phase 3: Optional Custom Aliases
1. Allow users to register custom 3-word addresses
2. Use DHT to prevent duplicates
3. Reserve premium names (if applicable)

### 8.3 Word List Recommendation

**Primary**: **BIP39 English word list (2048 words)**

Reasons:
- Battle-tested (used by millions of crypto wallets)
- Well-documented
- First 4 characters unique
- MIT-licensed
- No offensive words
- International variants available

**Alternative for larger space**: Custom 4096-word list derived from EFF list

### 8.4 Collision Strategy

```
Given: 2048³ = 8.6 billion combinations
Expected users: < 100,000 initially
Collision probability at 100K users: 0.58%

Strategy:
1. Generate random 3-word address from fingerprint
2. Register on DHT
3. If collision detected:
   a. Expand to 4-word address, OR
   b. Use full fingerprint as backup identifier
```

### 8.5 Security Considerations

1. **Don't use address as sole identifier** for critical operations
2. Always verify with public key fingerprint for sensitive actions
3. Consider rate limiting address registration
4. Log all registrations for audit trail

### 8.6 Comparison Matrix

| Approach | Uniqueness | Memorability | Decentralization | Complexity |
|----------|------------|--------------|------------------|------------|
| Random + DHT | Good | Good | High | High |
| Fingerprint-mapped | Excellent | Good | High | Medium |
| Fingerprint-only | Excellent | Poor | High | Low |
| Central registry | Excellent | Good | Low | Low |

### 8.7 Final Recommendation

**For Molt Connect, I recommend:**

1. **Primary identifier**: Ed25519 public key fingerprint (64-bit truncated SHA-256)
2. **Human-readable address**: 3-word mapping from fingerprint using BIP39 list
3. **Registration**: Kademlia DHT with (address → public_key) mapping
4. **Collision handling**: Expand to 4 words or use numeric suffix
5. **Optional**: Allow custom aliases with DHT registration

**Address Format**:
```
Primary: swift-river-flows
Fallback: swift-river-flows-4 (if collision)
Internal: 64-bit fingerprint
```

**Benefits**:
- Cryptographic uniqueness guaranteed
- Human-readable addresses
- Fully decentralized
- Scales to millions of users
- Open source, no patent issues

---

## Appendix: Key Formulas

### Birthday Problem
```
P(collision) = 1 - e^(-n²/(2d))

For 50% collision probability:
n ≈ 1.18 × √d
```

### Bits of Entropy
```
entropy = log₂(wordlist_size) × num_words

Example: log₂(2048) × 3 = 11 × 3 = 33 bits
```

### Address Space
```
Total addresses = wordlist_size^num_words

2048³ = 8,589,934,592
4096³ = 68,719,476,736
7776³ = 470,184,984,576
```

---

*End of Research Document*
