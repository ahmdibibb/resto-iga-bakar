#!/usr/bin/env node
/**
 * Diagnostic Script for Midtrans Connectivity
 * 
 * This script tests network connectivity to Midtrans Sandbox
 * without making actual transactions or using real credentials.
 * 
 * Tests performed:
 * 1. DNS lookup (IPv4 and IPv6)
 * 2. TLS handshake (IPv4 and IPv6)
 * 3. HTTP GET to root domain
 * 4. HTTP POST to Snap endpoint (without auth)
 * 
 * Usage:
 *   node scripts/diagnose-midtrans.mjs
 */

import dns from 'node:dns'
import { promisify } from 'node:util'
import tls from 'node:tls'

const lookup = promisify(dns.lookup)
const resolve4 = promisify(dns.resolve4)
const resolve6 = promisify(dns.resolve6)

const SNAP_HOSTNAME = 'app.sandbox.midtrans.com'
const SNAP_PORT = 443
const TIMEOUT_MS = 10000

function formatDuration(ms) {
  return `${ms}ms`
}

function formatTimestamp() {
  return new Date().toISOString()
}

// ── Test 1: DNS Lookup ──────────────────────────────────────────────────

async function testDNSLookup() {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('TEST 1: DNS Lookup')
  console.log('═══════════════════════════════════════════════════════')

  try {
    console.log(`[${formatTimestamp()}] Looking up ${SNAP_HOSTNAME}...`)
    const startTime = Date.now()
    const result = await lookup(SNAP_HOSTNAME, { all: true })
    const duration = Date.now() - startTime

    console.log(`✅ DNS lookup succeeded in ${formatDuration(duration)}`)
    result.forEach((addr, index) => {
      console.log(`   ${index + 1}. ${addr.address} (${addr.family === 4 ? 'IPv4' : 'IPv6'})`)
    })
    return { success: true, addresses: result }
  } catch (error) {
    console.error(`❌ DNS lookup failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// ── Test 2: DNS Resolve IPv4 ────────────────────────────────────────────

async function testResolve4() {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('TEST 2: DNS Resolve IPv4')
  console.log('═══════════════════════════════════════════════════════')

  try {
    console.log(`[${formatTimestamp()}] Resolving IPv4 for ${SNAP_HOSTNAME}...`)
    const startTime = Date.now()
    const addresses = await resolve4(SNAP_HOSTNAME)
    const duration = Date.now() - startTime

    console.log(`✅ IPv4 resolution succeeded in ${formatDuration(duration)}`)
    addresses.forEach((addr, index) => {
      console.log(`   ${index + 1}. ${addr}`)
    })
    return { success: true, addresses }
  } catch (error) {
    console.error(`❌ IPv4 resolution failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// ── Test 3: DNS Resolve IPv6 ────────────────────────────────────────────

async function testResolve6() {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('TEST 3: DNS Resolve IPv6')
  console.log('═══════════════════════════════════════════════════════')

  try {
    console.log(`[${formatTimestamp()}] Resolving IPv6 for ${SNAP_HOSTNAME}...`)
    const startTime = Date.now()
    const addresses = await resolve6(SNAP_HOSTNAME)
    const duration = Date.now() - startTime

    console.log(`✅ IPv6 resolution succeeded in ${formatDuration(duration)}`)
    addresses.forEach((addr, index) => {
      console.log(`   ${index + 1}. ${addr}`)
    })
    return { success: true, addresses }
  } catch (error) {
    console.error(`⚠️  IPv6 resolution failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// ── Test 4: TLS Handshake IPv4 ──────────────────────────────────────────

async function testTLSHandshake(hostname, port, family) {
  console.log(`\n═══════════════════════════════════════════════════════`)
  console.log(`TEST: TLS Handshake (${family === 4 ? 'IPv4' : 'IPv6'})`)
  console.log(`═══════════════════════════════════════════════════════`)

  return new Promise((resolve) => {
    const startTime = Date.now()
    console.log(`[${formatTimestamp()}] Connecting to ${hostname}:${port} (${family === 4 ? 'IPv4' : 'IPv6'})...`)

    const socket = tls.connect(
      {
        host: hostname,
        port: port,
        family: family,
        timeout: TIMEOUT_MS,
      },
      () => {
        const duration = Date.now() - startTime
        const remoteAddress = socket.remoteAddress
        const cipher = socket.getCipher()

        console.log(`✅ TLS handshake succeeded in ${formatDuration(duration)}`)
        console.log(`   Remote address: ${remoteAddress}`)
        console.log(`   Cipher: ${cipher.name}`)
        console.log(`   Protocol: ${cipher.version}`)

        socket.destroy()
        resolve({ success: true, duration, remoteAddress, cipher: cipher.name })
      }
    )

    socket.on('error', (error) => {
      const duration = Date.now() - startTime
      console.error(`❌ TLS handshake failed after ${formatDuration(duration)}: ${error.message}`)
      console.error(`   Error code: ${error.code}`)
      socket.destroy()
      resolve({ success: false, duration, error: error.message, code: error.code })
    })

    socket.on('timeout', () => {
      const duration = Date.now() - startTime
      console.error(`❌ TLS handshake timed out after ${formatDuration(duration)}`)
      socket.destroy()
      resolve({ success: false, duration, error: 'TIMEOUT' })
    })
  })
}

// ── Test 5: HTTP GET to Root ────────────────────────────────────────────

async function testHTTPGet() {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('TEST: HTTP GET to Root Domain')
  console.log('═══════════════════════════════════════════════════════')

  const url = `https://${SNAP_HOSTNAME}/`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    console.log(`[${formatTimestamp()}] GET ${url}...`)
    const startTime = Date.now()

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const duration = Date.now() - startTime

    console.log(`✅ HTTP GET succeeded in ${formatDuration(duration)}`)
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Content-Type: ${response.headers.get('content-type')}`)

    return { success: true, status: response.status, duration }
  } catch (error) {
    clearTimeout(timeoutId)
    const duration = Date.now() - Date.now()
    const errorCode = error?.cause?.code || error?.code || 'UNKNOWN'

    console.error(`❌ HTTP GET failed: ${error.message}`)
    console.error(`   Error code: ${errorCode}`)

    return { success: false, error: error.message, code: errorCode }
  }
}

// ── Test 6: HTTP POST to Snap Endpoint ──────────────────────────────────

async function testHTTPPost() {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('TEST: HTTP POST to Snap Endpoint (No Auth)')
  console.log('═══════════════════════════════════════════════════════')

  const url = `https://${SNAP_HOSTNAME}/snap/v1/transactions`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    console.log(`[${formatTimestamp()}] POST ${url}...`)
    console.log('   (Without credentials - expecting 401 or similar)')
    const startTime = Date.now()

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const duration = Date.now() - startTime

    console.log(`✅ HTTP POST succeeded in ${formatDuration(duration)}`)
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Content-Type: ${response.headers.get('content-type')}`)

    const text = await response.text()
    if (text) {
      console.log(`   Response preview: ${text.substring(0, 150)}`)
    }

    return { success: true, status: response.status, duration }
  } catch (error) {
    clearTimeout(timeoutId)
    const errorCode = error?.cause?.code || error?.code || 'UNKNOWN'

    console.error(`❌ HTTP POST failed: ${error.message}`)
    console.error(`   Error code: ${errorCode}`)

    return { success: false, error: error.message, code: errorCode }
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║   MIDTRANS CONNECTIVITY DIAGNOSTIC SCRIPT             ║')
  console.log('╚═══════════════════════════════════════════════════════╝')
  console.log(`\nTarget: ${SNAP_HOSTNAME}:${SNAP_PORT}`)
  console.log(`Timeout: ${TIMEOUT_MS}ms`)
  console.log(`Start time: ${formatTimestamp()}`)

  const results = {}

  // Run all tests
  results.dnsLookup = await testDNSLookup()
  results.resolve4 = await testResolve4()
  results.resolve6 = await testResolve6()
  results.tlsIPv4 = await testTLSHandshake(SNAP_HOSTNAME, SNAP_PORT, 4)
  results.tlsIPv6 = await testTLSHandshake(SNAP_HOSTNAME, SNAP_PORT, 6)
  results.httpGet = await testHTTPGet()
  results.httpPost = await testHTTPPost()

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║                      SUMMARY                          ║')
  console.log('╚═══════════════════════════════════════════════════════╝')

  const tests = [
    { name: 'DNS Lookup', result: results.dnsLookup },
    { name: 'IPv4 Resolution', result: results.resolve4 },
    { name: 'IPv6 Resolution', result: results.resolve6 },
    { name: 'TLS IPv4', result: results.tlsIPv4 },
    { name: 'TLS IPv6', result: results.tlsIPv6 },
    { name: 'HTTP GET', result: results.httpGet },
    { name: 'HTTP POST', result: results.httpPost },
  ]

  tests.forEach((test) => {
    const icon = test.result.success ? '✅' : '❌'
    const status = test.result.success ? 'PASS' : 'FAIL'
    console.log(`${icon} ${test.name.padEnd(20)} ${status}`)
  })

  // Diagnosis
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║                    DIAGNOSIS                          ║')
  console.log('╚═══════════════════════════════════════════════════════╝')

  if (results.dnsLookup.success && !results.tlsIPv4.success) {
    console.log('\n⚠️  DNS resolution works but TLS handshake fails.')
    console.log('   This indicates a network blockage at the TCP or firewall level.')
    console.log('\n   Possible causes:')
    console.log('   • Windows Firewall blocking outbound connections')
    console.log('   • Antivirus software blocking SSL/TLS connections')
    console.log('   • Router firewall or parental controls')
    console.log('   • ISP blocking or traffic shaping')
    console.log('\n   Suggested actions:')
    console.log('   1. Check Windows Firewall settings')
    console.log('   2. Temporarily disable antivirus and test again')
    console.log('   3. Try from a different network (mobile hotspot)')
    console.log('   4. Contact your ISP if issue persists')
  } else if (!results.dnsLookup.success) {
    console.log('\n⚠️  DNS resolution failed.')
    console.log('   This indicates a DNS configuration issue.')
    console.log('\n   Suggested actions:')
    console.log('   1. Check your DNS settings')
    console.log('   2. Try using Google DNS (8.8.8.8, 8.8.4.4)')
    console.log('   3. Flush DNS cache: ipconfig /flushdns')
  } else if (results.tlsIPv4.success && !results.httpPost.success) {
    console.log('\n⚠️  TLS handshake works but HTTP requests fail.')
    console.log('   This indicates an application-level or protocol issue.')
    console.log('\n   Suggested actions:')
    console.log('   1. Check if proxy settings are interfering')
    console.log('   2. Check Node.js version compatibility')
    console.log('   3. Review application logs for detailed errors')
  } else if (results.httpPost.success) {
    console.log('\n✅ All connectivity tests passed!')
    console.log('   Network connectivity to Midtrans appears to be working.')
    console.log('\n   If you are still experiencing issues:')
    console.log('   • Check your Midtrans credentials')
    console.log('   • Review application logs for authentication errors')
    console.log('   • Verify request payload format')
  }

  console.log(`\n\nEnd time: ${formatTimestamp()}`)
}

main().catch((error) => {
  console.error('\n❌ Diagnostic script error:', error)
  process.exit(1)
})
