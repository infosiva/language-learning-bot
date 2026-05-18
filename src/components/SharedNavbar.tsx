'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserButton, SignInButton, useAuth } from '@clerk/nextjs'

export interface NavLink { label: string; href: string; external?: boolean }
export interface BrandConfig {
  name: string; tagline: string; icon: string; color: string; url: string
  navLinks?: NavLink[]; cta?: { label: string; href: string }
  logoSrc?: string
}

function Wordmark({ color }: { color: string }) {
  return (
    <span className="flex items-center select-none">
      <span className="font-black text-white text-[17px] tracking-[-0.03em] leading-none">Speak</span>
      <span
        className="font-black text-[17px] tracking-[-0.03em] leading-none"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, #06b6d4 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >IQ</span>
    </span>
  )
}

export default function SharedNavbar({ brand }: { brand: BrandConfig }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // isSignedIn is undefined when Clerk keys aren't configured — treat as signed out
  const { isSignedIn = false } = useAuth()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const links = brand.navLinks ?? []
  const cta = brand.cta ?? { label: 'Try free', href: '/' }

  return (
    <>
      <nav
        style={{ '--accent': brand.color } as React.CSSProperties}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out
          ${scrolled
            ? 'bg-[#030305]/80 backdrop-blur-2xl border-b border-white/[0.05]'
            : 'bg-transparent'
          }`}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo — clean wordmark */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Wordmark color={brand.color} />
          </Link>

          {/* Desktop nav links */}
          {links.length > 0 && (
            <div className="hidden md:flex items-center px-1 py-1 rounded-xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm gap-0.5">
              {links.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  target={l.external ? '_blank' : undefined}
                  rel={l.external ? 'noopener noreferrer' : undefined}
                  className="px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/90 rounded-lg hover:bg-white/[0.06] transition-all duration-150"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side: CTA + auth */}
          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 ring-2 ring-violet-500/40 hover:ring-violet-500/70 transition-all',
                    userButtonPopoverCard: 'bg-[#0d0d1a] border border-white/10 shadow-2xl',
                    userButtonPopoverActionButton: 'text-white/70 hover:text-white hover:bg-white/5',
                    userButtonPopoverActionButtonText: 'text-sm',
                    userButtonPopoverFooter: 'hidden',
                  },
                }}
              />
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-xs text-white/40 hover:text-white/70 transition-colors">
                    Sign in
                  </button>
                </SignInButton>
                <Link
                  href={cta.href}
                  className="px-5 py-2 text-sm font-semibold rounded-xl border transition-all duration-150 hover:-translate-y-px active:translate-y-0"
                  style={{
                    color: brand.color,
                    borderColor: `${brand.color}50`,
                    background: `${brand.color}15`,
                  }}
                >
                  {cta.label}
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(v => !v)}
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-md text-white/50 hover:text-white/80 transition-colors ml-auto"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className={`block w-5 h-px bg-current transition-all duration-200 origin-center ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block w-5 h-px bg-current transition-all duration-200 ${open ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block w-5 h-px bg-current transition-all duration-200 origin-center ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${open ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        {/* Drawer */}
        <div className={`absolute top-0 left-0 right-0 bg-[#030305]/98 backdrop-blur-2xl border-b border-white/[0.06] transition-all duration-300 ease-out ${open ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/[0.05]">
            <Link href="/" onClick={() => setOpen(false)}>
              <Wordmark color={brand.color} />
            </Link>
            <div className="flex items-center gap-3">
              {isSignedIn && (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-7 h-7 ring-2 ring-violet-500/40',
                    },
                  }}
                />
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 text-white/40 hover:text-white/80 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-2 py-2.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-white/[0.05] my-2" />
            {!isSignedIn && (
              <>
                <Link
                  href={cta.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium rounded-lg text-center transition-all"
                  style={{ color: brand.color, background: `${brand.color}15` }}
                >
                  {cta.label}
                </Link>
                <SignInButton mode="modal">
                  <button onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm text-white/40 hover:text-white/70 rounded-lg text-center transition-all w-full">
                    Sign in
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
