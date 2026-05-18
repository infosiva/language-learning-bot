'use client'
/* SpeakIQ — sound wave pulse + floating language characters */
export default function AnimatedBackground() {
  // Language characters from different scripts
  const chars = ['你好', 'Hola', 'Bonjour', 'مرحبا', 'こんにちは', 'Ciao', 'Привет', '안녕', 'Olá', 'Γεια']
  const positions = [
    { x: '6%',  y: '12%', delay: '0s',   dur: '7s',  op: 0.3,  size: 13 },
    { x: '85%', y: '8%',  delay: '1.5s', dur: '9s',  op: 0.25, size: 12 },
    { x: '3%',  y: '60%', delay: '3s',   dur: '8s',  op: 0.2,  size: 11 },
    { x: '90%', y: '50%', delay: '2s',   dur: '6s',  op: 0.3,  size: 14 },
    { x: '20%', y: '82%', delay: '4s',   dur: '10s', op: 0.2,  size: 12 },
    { x: '75%', y: '75%', delay: '2.5s', dur: '7.5s',op: 0.25, size: 13 },
    { x: '45%', y: '5%',  delay: '5s',   dur: '8s',  op: 0.22, size: 11 },
    { x: '30%', y: '92%', delay: '1s',   dur: '9.5s',op: 0.18, size: 12 },
    { x: '60%', y: '25%', delay: '3.5s', dur: '7s',  op: 0.2,  size: 11 },
    { x: '12%', y: '42%', delay: '6s',   dur: '8.5s',op: 0.15, size: 10 },
  ]

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Orange warm gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 40% 20%, rgba(124,58,237,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 75% 75%, rgba(139,92,246,0.12) 0%, transparent 60%)',
      }} />

      {/* Sound wave SVG */}
      <svg className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.08 }}
        width="800" height="200" viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
        {[1,2,3,4,5].map(i => (
          <ellipse key={i}
            cx="400" cy="100"
            rx={i * 70} ry={i * 14}
            fill="none" stroke="#7c3aed" strokeWidth="1.5"
            opacity={1 / i}
          >
            <animate attributeName="rx" values={`${i*70};${i*80};${i*70}`} dur={`${2+i*0.5}s`} repeatCount="indefinite" />
            <animate attributeName="ry" values={`${i*14};${i*18};${i*14}`} dur={`${2+i*0.5}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values={`${1/i};${0.6/i};${1/i}`} dur={`${2+i*0.5}s`} repeatCount="indefinite" />
          </ellipse>
        ))}
      </svg>

      {/* Waveform lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }} xmlns="http://www.w3.org/2000/svg">
        {[0.3, 0.5, 0.7].map((y, i) => (
          <polyline key={i}
            points={Array.from({length: 80}, (_, j) => {
              const x = (j / 79) * 1200
              const amp = 20 + i * 15
              const freq = 0.04 + i * 0.02
              return `${x},${y * 800 + Math.sin(j * freq * Math.PI) * amp}`
            }).join(' ')}
            fill="none" stroke="#7c3aed" strokeWidth="1.5"
          >
            <animate attributeName="points"
              values={
                Array.from({length: 80}, (_, j) => {
                  const x = (j / 79) * 1200
                  const amp = 20 + i * 15
                  const freq = 0.04 + i * 0.02
                  return `${x},${y * 800 + Math.sin(j * freq * Math.PI) * amp}`
                }).join(' ') + ';' +
                Array.from({length: 80}, (_, j) => {
                  const x = (j / 79) * 1200
                  const amp = 20 + i * 15
                  const freq = 0.04 + i * 0.02
                  return `${x},${y * 800 + Math.sin((j + 20) * freq * Math.PI) * amp}`
                }).join(' ') + ';' +
                Array.from({length: 80}, (_, j) => {
                  const x = (j / 79) * 1200
                  const amp = 20 + i * 15
                  const freq = 0.04 + i * 0.02
                  return `${x},${y * 800 + Math.sin(j * freq * Math.PI) * amp}`
                }).join(' ')
              }
              dur={`${4 + i}s`} repeatCount="indefinite" />
          </polyline>
        ))}
      </svg>

      {/* Floating language characters */}
      {positions.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.x, top: p.y,
          fontSize: p.size, opacity: p.op,
          color: '#7c3aed',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 500,
          animation: `float ${p.dur} ease-in-out infinite`,
          animationDelay: p.delay,
        }}>{chars[i]}</div>
      ))}

      <div className="orb orb-1" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.22), rgba(139,92,246,0.08) 60%, transparent)', top: '-80px', left: '-60px' }} />
      <div className="orb orb-2" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)', bottom: '5%', right: '-80px' }} />
    </div>
  )
}
