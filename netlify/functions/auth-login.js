// netlify/functions/auth-login.js - OPTIMIZED VERSION
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// Pre-generate JWT secret outside handler for reuse
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES = '24h'

export const handler = async (event) => {
  const startTime = Date.now()

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // Fast OPTIONS response
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    // Parse request body quickly
    const { email, password } = JSON.parse(event.body)

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and password required' }),
      }
    }

    console.log(`📊 Request parsed in ${Date.now() - startTime}ms`)
    const dbStartTime = Date.now()

    // OPTIMIZATION 1: Single database query with better indexing
    const { data: user, error } = await supabase
      .from('users')
      .select(
        'id, email, name, role, password_hash, failed_login_attempts, locked_until, created_at',
      )
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .maybeSingle() // Use maybeSingle instead of single for better performance

    console.log(`📊 Database query took ${Date.now() - dbStartTime}ms`)

    if (error || !user) {
      console.log('❌ User not found:', email)
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid email or password' }),
      }
    }

    // OPTIMIZATION 2: Quick lock check before expensive bcrypt
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      console.log('🔒 Account locked:', email)
      return {
        statusCode: 423,
        headers,
        body: JSON.stringify({
          error: 'Account temporarily locked due to too many failed attempts',
        }),
      }
    }

    // OPTIMIZATION 3: Parallel bcrypt and JWT preparation
    const bcryptStartTime = Date.now()
    const passwordCheckPromise = bcrypt.compare(password, user.password_hash)

    // Prepare JWT payload while bcrypt runs
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    // Wait for password check
    const isValid = await passwordCheckPromise
    console.log(`📊 Password verification took ${Date.now() - bcryptStartTime}ms`)

    if (!isValid) {
      console.log('❌ Invalid password for:', email)

      // OPTIMIZATION 4: Async database update (don't wait for it)
      const failedAttempts = (user.failed_login_attempts || 0) + 1
      let lockedUntil = null

      if (failedAttempts >= 5) {
        lockedUntil = new Date()
        lockedUntil.setMinutes(lockedUntil.getMinutes() + 30)
      }

      // Fire and forget - don't await this update
      supabase
        .from('users')
        .update({
          failed_login_attempts: failedAttempts,
          locked_until: lockedUntil?.toISOString() || null,
        })
        .eq('id', user.id)
        .then(() => console.log('📊 Failed attempt logged'))
        .catch((err) => console.error('❌ Failed to log attempt:', err))

      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid email or password' }),
      }
    }

    // OPTIMIZATION 5: Generate JWT immediately
    const jwtStartTime = Date.now()
    const accessToken = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
    console.log(`📊 JWT generation took ${Date.now() - jwtStartTime}ms`)

    // OPTIMIZATION 6: Fire-and-forget success database update
    const currentTime = new Date().toISOString()
    supabase
      .from('users')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: currentTime,
      })
      .eq('id', user.id)
      .then(() => console.log('📊 Login success logged'))
      .catch((err) => console.error('❌ Failed to log success:', err))

    // OPTIMIZATION 7: Return response immediately without waiting for DB update
    const totalTime = Date.now() - startTime
    console.log(`✅ Total login completed in ${totalTime}ms`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.created_at,
          lastLoginAt: currentTime,
        },
        tokens: {
          accessToken,
          expiresIn: JWT_EXPIRES,
        },
      }),
    }
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`❌ Login error after ${totalTime}ms:`, error)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Login failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      }),
    }
  }
}
