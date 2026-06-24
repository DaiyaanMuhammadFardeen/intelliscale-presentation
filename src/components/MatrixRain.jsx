import { useRef, useEffect } from 'react'

export default function MatrixRain({ opacity = 0.05 }) {
  const canvasRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let drops = []
    
    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // Reinitialize drops on resize
      const cols = Math.floor(canvas.width / 20)
      drops = Array.from({ length: cols }, () => ({
        y: Math.random() * canvas.height,
        speed: 0.3 + Math.random() * 0.5,      // slow falling
        length: 5 + Math.floor(Math.random() * 15),  // trail length
        chars: Array.from({ length: 20 }, () => Math.random() > 0.5 ? '0' : '1'),
      }))
    }
    
    function draw() {
      ctx.fillStyle = `rgba(var(--black-rgb), 0.05)`    // trail fade
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.font = '14px monospace'
      ctx.textAlign = 'center'
      
      drops.forEach((drop, i) => {
        const x = i * 20 + 10
        
        // Draw trailing characters
        for (let j = 0; j < drop.length; j++) {
          const alpha = Math.max(0, 1 - j / drop.length) * opacity * 20
          ctx.fillStyle = `rgba(var(--matrix-green-rgb), ${alpha})`
          const char = drop.chars[Math.floor(Math.random() * drop.chars.length)]
          ctx.fillText(char, x, drop.y - j * 18)
        }
        
        // Move drop down
        drop.y += drop.speed
        
        // Reset when off screen
        if (drop.y > canvas.height + 50) {
          drop.y = -drop.length * 18
          drop.speed = 0.3 + Math.random() * 0.5
        }
      })
      
      animId = requestAnimationFrame(draw)
    }
    
    resize()
    window.addEventListener('resize', resize)
    animId = requestAnimationFrame(draw)
    
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [opacity])
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
        opacity,
      }}
    />
  )
}
