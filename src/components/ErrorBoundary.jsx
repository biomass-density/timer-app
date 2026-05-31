import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100dvh', padding: '32px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        background: '#F5F6FA', textAlign: 'center', gap: 16,
      }}>
        <span style={{ fontSize: 56 }}>🦝</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: 14, color: '#5A5A72', lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
          Don't worry — your tasks are safely stored. Reload to get back on track.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8, padding: '12px 28px', borderRadius: 999,
            background: '#534AB7', color: 'white', fontSize: 15,
            fontWeight: 600, border: 'none', cursor: 'pointer',
          }}
        >
          Reload app
        </button>
        {import.meta.env.DEV && (
          <details style={{ marginTop: 16, textAlign: 'left', maxWidth: 360, width: '100%' }}>
            <summary style={{ fontSize: 12, color: '#9B9BB0', cursor: 'pointer' }}>
              Error details (dev only)
            </summary>
            <pre style={{
              fontSize: 11, color: '#FF4757', background: '#fff',
              padding: 12, borderRadius: 8, overflowX: 'auto', marginTop: 8,
              border: '1px solid #FFD6D6',
            }}>
              {this.state.error.toString()}
            </pre>
          </details>
        )}
      </div>
    )
  }
}
