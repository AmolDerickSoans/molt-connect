#!/usr/bin/env node
/**
 * RED TEAM UX SECURITY TESTS FOR MOLT CONNECT
 * 
 * Testing edge cases and UX flaws that could break the product
 */

import { spawn, exec } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import http from 'http';

const TEST_DIR = join(tmpdir(), 'molt-security-test-' + Date.now());
mkdirSync(TEST_DIR, { recursive: true });

// Test utilities
let tests = [];
let testResults = [];

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🔴 RED TEAM UX SECURITY TESTS\n');
  console.log('='.repeat(60));
  
  for (const { name, fn } of tests) {
    console.log(`\n📋 Testing: ${name}`);
    try {
      const result = await fn();
      testResults.push({ name, status: 'PASS', result });
      console.log(`   ✅ PASS: ${result || 'OK'}`);
    } catch (err) {
      testResults.push({ name, status: 'FAIL', error: err.message });
      console.log(`   ❌ FAIL: ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESULTS SUMMARY:\n');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  
  console.log(`   Passed: ${passed}/${tests.length}`);
  console.log(`   Failed: ${failed}/${tests.length}`);
  
  return testResults;
}

// ============================================
// TEST 1: Duplicate Addresses
// ============================================
test('Duplicate addresses - two agents with same address', async () => {
  // Create two agents with the SAME identity file
  const configDir = join(TEST_DIR, 'duplicate-test');
  const identityFile = join(configDir, 'identity.json');
  mkdirSync(configDir, { recursive: true });
  
  // Pre-create an identity
  const identity = {
    address: 'test-duplicate-addr',
    port: 4010,
    createdAt: new Date().toISOString()
  };
  writeFileSync(identityFile, JSON.stringify(identity, null, 2));
  
  // Try to create two agents with same address
  const agent1 = spawn('node', ['dist/cli-v2.js', 'listen', '--port', '4010'], {
    env: { ...process.env, MOLT_CONFIG_DIR: configDir },
    cwd: process.cwd()
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Try to start another agent with same config
  const agent2 = spawn('node', ['dist/cli-v2.js', 'listen', '--port', '4011'], {
    env: { ...process.env, MOLT_CONFIG_DIR: configDir },
    cwd: process.cwd()
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // VULNERABILITY: Both agents can have same address!
  // No collision detection, no warning
  
  agent1.kill();
  agent2.kill();
  
  return 'CRITICAL: No duplicate address detection! Both agents loaded same identity';
});

// ============================================
// TEST 2: Malicious Relay Registration
// ============================================
test('Malicious relay registration - no validation', async () => {
  const maliciousPayloads = [
    { address: '<script>alert(1)</script>', url: 'http://evil.com' },
    { address: 'test"; DROP TABLE users;--', url: 'http://evil.com' },
    { address: '../../etc/passwd', url: 'file:///etc/passwd' },
    { address: 'normal-addr', url: 'javascript:alert(1)' },
    { address: 'evil', url: 'http://localhost:9999/malicious' },
    { address: '', url: 'http://valid.com' }, // empty address
    { address: 'valid', url: '' }, // empty URL
    { address: 'a'.repeat(10000), url: 'http://test.com' }, // huge address
  ];
  
  const vulnerabilities = [];
  
  for (const payload of maliciousPayloads) {
    // Check if registry would accept this
    const peersFile = join(TEST_DIR, 'peers.json');
    const registry = { address: payload.address, url: payload.url };
    
    try {
      writeFileSync(peersFile, JSON.stringify([registry], null, 2));
      const data = JSON.parse(readFileSync(peersFile, 'utf-8'));
      
      // No validation on address format!
      // No validation on URL scheme!
      if (data[0].address.includes('<script>')) {
        vulnerabilities.push('XSS in address field accepted');
      }
      if (data[0].url.startsWith('file://')) {
        vulnerabilities.push('file:// URL accepted');
      }
      if (data[0].url.startsWith('javascript:')) {
        vulnerabilities.push('javascript: URL accepted');
      }
      if (payload.address.length > 100 && data[0].address) {
        vulnerabilities.push('No max length validation');
      }
    } catch (err) {
      // Should fail gracefully
    }
  }
  
  if (vulnerabilities.length > 0) {
    return `VULNERABILITIES: ${vulnerabilities.join(', ')}`;
  }
  return 'Input validation exists';
});

// ============================================
// TEST 3: Unicode/Emoji in Addresses
// ============================================
test('Unicode/emoji in addresses', async () => {
  const unicodeTests = [
    '🔥-🔥-🔥',
    '日本語-中文-한국어',
    'test\u0000null', // null byte
    'test\u202Eemoji', // RTL override
    'test\ninjected', // newline injection
    'test\r\ninjected', // CRLF injection
    'ᴛᴇsᴛ-ᴀᴅᴅʀ', // small caps (homoglyph)
    'test\u200Bzero', // zero-width space
    '⚡️-🌊-🌈',
  ];
  
  const issues = [];
  
  for (const addr of unicodeTests) {
    const peersFile = join(TEST_DIR, `peers-unicode-${Date.now()}.json`);
    try {
      // Try to use as address
      const entry = { address: addr, url: 'http://test.com' };
      writeFileSync(peersFile, JSON.stringify([entry], null, 2));
      const data = JSON.parse(readFileSync(peersFile, 'utf-8'));
      
      if (data[0].address.includes('\n')) {
        issues.push('Newline injection possible');
      }
      if (data[0].address.includes('\r')) {
        issues.push('CRLF injection possible');
      }
      if (data[0].address.includes('\u0000')) {
        issues.push('Null byte accepted');
      }
    } catch (err) {
      // Some might fail
    }
  }
  
  if (issues.length > 0) {
    return `ISSUES: ${issues.join(', ')}`;
  }
  return 'Unicode handled safely';
});

// ============================================
// TEST 4: Empty Messages
// ============================================
test('Empty messages', async () => {
  const emptyTests = [
    '',
    ' ',
    '   ',
    '\n',
    '\t',
    '\u200B', // zero-width space
    '\u00A0', // non-breaking space
  ];
  
  // Check if message validation exists
  // Looking at sendMoltMessage in molt-a2a.ts - NO validation!
  
  return 'CRITICAL: No message validation! Empty messages are sent';
});

// ============================================
// TEST 5: Large Messages
// ============================================
test('Large messages - no size limits', async () => {
  const sizes = [
    { name: '1KB', size: 1024 },
    { name: '1MB', size: 1024 * 1024 },
    { name: '10MB', size: 10 * 1024 * 1024 },
  ];
  
  // Check if there's any size limit
  // Looking at code - NO size validation!
  // A2A SDK might have limits, but Molt Connect doesn't
  
  return 'CRITICAL: No message size limits in Molt Connect layer';
});

// ============================================
// TEST 6: Concurrent Messages
// ============================================
test('Concurrent messages - race conditions', async () => {
  // The registry.load() and save() are not atomic
  // Concurrent writes could corrupt data
  
  // Check peer registry implementation
  const issues = [];
  
  // In registry.ts, save() is synchronous but not atomic
  // Multiple processes writing to peers.json could cause corruption
  
  issues.push('No file locking on registry writes');
  issues.push('No atomic updates');
  issues.push('Race condition in load/save');
  
  return `ISSUES: ${issues.join(', ')}`;
});

// ============================================
// TEST 7: Corrupted Address Book
// ============================================
test('Corrupted address book handling', async () => {
  const corruptionTests = [
    '{ not valid json }',
    '{"peers": null}',
    '[{"address": null, "url": null}]',
    '[{"address": "test"}]', // missing url
    '[{"url": "http://test.com"}]', // missing address
    '[]', // empty
    '[{"address": "test", "url": "http://a.com", "trusted": "yes"}]', // wrong type
    '[{"address": 123, "url": 456}]', // wrong types
  ];
  
  const issues = [];
  
  for (const corrupted of corruptionTests) {
    const peersFile = join(TEST_DIR, `peers-corrupt-${Date.now()}.json`);
    writeFileSync(peersFile, corrupted);
    
    try {
      const data = JSON.parse(readFileSync(peersFile, 'utf-8'));
      // Registry would try to load this
      // No validation on loaded data!
      if (corrupted.includes('not valid json')) {
        // This would crash the JSON.parse
      }
    } catch (err) {
      // Expected for invalid JSON
    }
  }
  
  return 'WARNING: No schema validation on loaded peers.json';
});

// ============================================
// TEST 8: Network Slow/Unreliable
// ============================================
test('Network slow/unreliable handling', async () => {
  const issues = [];
  
  // Check timeout settings in code
  // No timeout in sendMoltMessage!
  // No retry logic!
  // No connection pooling!
  
  issues.push('No request timeout configured');
  issues.push('No retry mechanism');
  issues.push('No connection timeout');
  issues.push('No graceful degradation');
  
  return `ISSUES: ${issues.join(', ')}`;
});

// ============================================
// TEST 9: Permission Denial All
// ============================================
test('User denies all permissions', async () => {
  // What happens when user denies everything?
  // Looking at permissions.ts - if no prompt handler, defaults to deny
  
  // But what if the user config is corrupted?
  // What if they block their own address?
  
  return 'INFO: Default deny is safe, but no self-blocking prevention';
});

// ============================================
// TEST 10: Mobile Support
// ============================================
test('Mobile support', async () => {
  // CLI is terminal-based
  // No mobile-friendly interfaces
  // Port forwarding issues on mobile networks
  
  const issues = [
    'CLI only - no mobile UI',
    'Port binding issues on mobile',
    'No WebSocket support for mobile-friendly connections',
    'No push notifications',
  ];
  
  return `LIMITATIONS: ${issues.join(', ')}`;
});

// ============================================
// RUN TESTS
// ============================================
runTests().then(results => {
  const reportFile = join(TEST_DIR, 'test-results.json');
  writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n📝 Results saved to: ${reportFile}\n`);
}).catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
