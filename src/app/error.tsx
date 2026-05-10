'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '40px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f4f4f5', margin: 0 }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
        An unexpected error occurred. Please try again.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            background: 'rgba(139,92,246,0.8)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 600,
            fontSize: 13,
            border: '1px solid rgba(255,255,255,0.1)',
            textDecoration: 'none',
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
