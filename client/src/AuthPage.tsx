
import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  PawPrint,
  ShieldCheck,
  X,
} from 'lucide-react'

export type AuthUser = {
  id: string | number
  full_name: string
  email: string
}

type AuthPageProps = {
  onAuthenticated: (user: AuthUser) => void
  onClose: () => void
}

type AuthResponse = {
  message?: string
  error?: string
  user?: AuthUser
}

const API_URL = 'http://localhost:5000/api/auth'

async function authRequest(
  endpoint: string,
  payload: Record<string, string>
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data: AuthResponse = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.')
  }

  return data
}

export default function AuthPage({
  onAuthenticated,
  onClose,
}: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isSignup = mode === 'signup'

  function switchMode(next: 'login' | 'signup') {
    setMode(next)
    setError('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (
      password.length < 8 ||
      new TextEncoder().encode(password).length > 72
    ) {
      setError('Password must be at least 8 characters and no more than 72 bytes.')
      return
    }

    setLoading(true)

    try {
      if (isSignup) {
        await authRequest('register', {
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        })
      }

      const result = await authRequest('login', {
        email: email.trim(),
        password,
      })

      if (!result.user) {
        throw new Error('Unable to verify your account.')
      }

      onAuthenticated(result.user)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the server.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="PAWTRACE account"
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#090b0b] text-white"
    >
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left information panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-[#111613] p-12 lg:flex">
          <div className="absolute -right-32 top-24 h-96 w-96 rounded-full bg-[#c9fa67]/10 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c9fa67] text-black">
              <PawPrint size={24} />
            </div>

            <span className="text-2xl font-black">
              PAW<span className="text-[#c9fa67]">TRACE</span>
            </span>
          </div>

          <div className="relative max-w-lg">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9fa67]/20 bg-[#c9fa67]/5 px-4 py-2 text-xs font-semibold text-[#c9fa67]">
              <Heart size={14} />
              EVERY PAW DESERVES A WAY HOME
            </div>

            <h1 className="text-6xl font-black leading-[1.08] tracking-tight">
              Together,
              <br />
              we bring
              <br />
              them <span className="text-[#c9fa67]">home.</span>
            </h1>

            <p className="mt-7 max-w-md text-lg leading-8 text-white/50">
              Join a caring community helping lost and found pets
              reconnect with their families.
            </p>

            <div className="mt-12 space-y-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c9fa67]/10 text-[#c9fa67]">
                  <PawPrint size={22} />
                </span>
                <p className="font-medium">Share lost and found pet reports</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c9fa67]/10 text-[#c9fa67]">
                  <Heart size={22} />
                </span>
                <p className="font-medium">Help pets find their families</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c9fa67]/10 text-[#c9fa67]">
                  <ShieldCheck size={22} />
                </span>
                <p className="font-medium">Keep your account protected</p>
              </div>
            </div>
          </div>

          <p className="relative text-sm text-white/30">
            PAWTRACE — Helping paws find their way home.
          </p>
        </div>

        {/* Right form panel */}
        <div className="relative flex min-h-screen items-center justify-center px-5 py-16 sm:px-10">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account page"
            className="absolute right-6 top-6 rounded-full border border-white/15 p-3 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>

          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9fa67] text-black">
                <PawPrint size={22} />
              </span>

              <span className="text-xl font-black">
                PAW<span className="text-[#c9fa67]">TRACE</span>
              </span>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#c9fa67]">
                {isSignup ? 'JOIN OUR COMMUNITY' : 'WELCOME BACK'}
              </p>

              <h2 className="text-4xl font-black tracking-tight">
                {isSignup ? 'Create an account.' : 'Welcome back.'}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/45">
                {isSignup
                  ? 'Create your account and become part of the PAWTRACE community.'
                  : 'Log in to continue your journey with PAWTRACE.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Full name
                  </label>

                  <input
                    id="auth-name"
                    required
                    maxLength={100}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className="w-full rounded-xl border border-white/10 bg-[#151817] px-4 py-3.5 outline-none transition placeholder:text-white/25 focus:border-[#c9fa67]/60"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email address
                </label>

                <input
                  id="auth-email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#151817] px-4 py-3.5 outline-none transition placeholder:text-white/25 focus:border-[#c9fa67]/60"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="mb-2 block text-sm font-semibold"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={isSignup ? 8 : undefined}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/10 bg-[#151817] px-4 py-3.5 pr-12 outline-none transition placeholder:text-white/25 focus:border-[#c9fa67]/60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>

                {isSignup && (
                  <p className="mt-2 text-xs text-white/35">
                    Use at least 8 characters.
                  </p>
                )}
              </div>

              {isSignup && (
                <div>
                  <label
                    htmlFor="auth-confirm"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Confirm password
                  </label>

                  <input
                    id="auth-confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your password"
                    className="w-full rounded-xl border border-white/10 bg-[#151817] px-4 py-3.5 outline-none transition placeholder:text-white/25 focus:border-[#c9fa67]/60"
                  />
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9fa67] px-5 py-4 font-bold text-black transition hover:bg-[#d9ff92] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? 'Please wait...'
                  : isSignup
                    ? 'Create account'
                    : 'Log in'}
                {!loading && <ArrowRight size={19} />}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-white/50">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => switchMode(isSignup ? 'login' : 'signup')}
                className="font-bold text-[#c9fa67] hover:underline"
              >
                {isSignup ? 'Log in' : 'Sign up'}
              </button>
            </div>

            <div className="mt-10 flex items-center justify-center gap-2 border-t border-white/10 pt-6 text-xs text-white/35">
              <LockKeyhole size={14} />
              Secure account access
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
