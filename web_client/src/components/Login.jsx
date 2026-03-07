import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { User, Lock, Loader2, AlertCircle } from 'lucide-react'

function Login({ onSwitchToSignup }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpRequested, setOtpRequested] = useState(false)

  const { login, getOtp } = useAuth()

  const handleOtpRequest = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await getOtp(username, password)

      if (!result.success) {
        const errorMessage = result.error || 'OTP request failed. Please try again.'
        setLoading(false)
        setError(errorMessage)
        return
      }

      setOtpRequested(true)
      setLoading(false)
    } catch (err) {
      console.error('Unexpected error in handleOtpRequest:', err)
      setLoading(false)
      setError('An unexpected error occurred')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('') // Clear any previous errors
    setLoading(true)

    try {
      const result = await login(username, password)

      if (!result.success) {
        const errorMessage = result.error || 'Login failed. Please try again.'
        setLoading(false)
        setError(errorMessage)
        return
      }

      setLoading(false)
    } catch (err) {
      console.error('Unexpected error in handleSubmit:', err)
      setLoading(false)
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🤖 Claude Agent</h1>
          <h2>Sign In</h2>
          <p>Enter your username or email and password</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">
              <User size={16} />
              Email Address
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <Lock size={16} />
              OTP Code
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading || !otpRequested}
            />
          </div>

          <button type="button" className="btn btn-secondary btn-block" onClick={handleOtpRequest} disabled={loading || !username }>

          {loading ? (
              <>
                <Loader2 size={16} className="spinning" />
                Requesting OTP...
              </>
            ) : (
              'Request OTP'
            )}
            </button>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !username || !password ||!otpRequested}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spinning" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? Ask your TC AI Labs administrator for an invite.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
