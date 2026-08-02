/**
 * API Endpoint: POST /api/print/wifi
 * 
 * Proxy endpoint untuk mengirim ESC/POS commands ke network thermal printer.
 * 
 * Endpoint ini menerima print commands dan meneruskannya ke printer
 * via raw socket connection.
 */

import { NextRequest, NextResponse } from 'next/server'
import net from 'net'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { printerIP, printerPort, commands } = body

    // Validate input
    if (!printerIP || !printerPort || !commands) {
      return NextResponse.json(
        { error: 'Missing required fields: printerIP, printerPort, commands' },
        { status: 400 }
      )
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(printerIP)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      )
    }

    // Validate port
    const port = parseInt(printerPort)
    if (isNaN(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        { error: 'Invalid port number' },
        { status: 400 }
      )
    }

    // Send commands to printer via TCP socket
    await sendToPrinter(printerIP, port, commands)

    return NextResponse.json({
      success: true,
      message: 'Print command sent successfully'
    })

  } catch (error: any) {
    console.error('Error in WiFi print endpoint:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send print command',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * Send ESC/POS commands to printer via raw TCP socket
 */
function sendToPrinter(ip: string, port: number, commands: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket()
    
    // Set timeout
    client.setTimeout(5000)

    // Handle connection
    client.connect(port, ip, () => {
      console.log(`Connected to printer at ${ip}:${port}`)
      
      // Send commands
      client.write(commands, 'binary', (err) => {
        if (err) {
          console.error('Error writing to printer:', err)
          client.destroy()
          reject(err)
        } else {
          console.log('Print commands sent successfully')
          // Give printer time to process
          setTimeout(() => {
            client.end()
          }, 500)
        }
      })
    })

    // Handle successful close
    client.on('close', () => {
      console.log('Connection to printer closed')
      resolve()
    })

    // Handle errors
    client.on('error', (err) => {
      console.error('Socket error:', err)
      client.destroy()
      reject(new Error(`Failed to connect to printer: ${err.message}`))
    })

    // Handle timeout
    client.on('timeout', () => {
      console.error('Socket timeout')
      client.destroy()
      reject(new Error('Connection to printer timed out'))
    })
  })
}
