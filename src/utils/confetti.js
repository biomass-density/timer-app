const COLORS = ['#FF6B6B','#FF9F43','#F5CB5C','#51CF66','#20C997','#4DA6FF','#9B6FD4','#F06595']

export function launchConfetti({ big = false } = {}) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  const ctx2d = canvas.getContext('2d')

  const count = big ? 280 : 130
  const particles = Array.from({ length: count }, () => {
    const isBig = big && Math.random() > 0.6
    return {
      x: big ? Math.random() * canvas.width : Math.random() * canvas.width * 0.6 + canvas.width * 0.2,
      y: big ? -20 : canvas.height * 0.3 + Math.random() * canvas.height * 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: Math.random() * (isBig ? 16 : 10) + 4,
      h: Math.random() * (isBig ? 8 : 6) + 3,
      vx: (Math.random() - 0.5) * (big ? 7 : 5),
      vy: big ? (Math.random() * 5 + 1) : (Math.random() - 0.5) * 8 - 4,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 10,
      gravity: 0.15 + Math.random() * 0.12,
      fade: 0,
    }
  })

  let raf
  let start = null

  function draw(ts) {
    if (!start) start = ts
    const elapsed = ts - start
    ctx2d.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false

    particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.vx *= 0.99
      p.rot += p.rotV
      // Fade out in last 800ms of 3.5s window
      const alpha = elapsed < 2700 ? 1 : Math.max(0, 1 - (elapsed - 2700) / 800)
      if (p.y < canvas.height + 30 && alpha > 0) {
        alive = true
        ctx2d.save()
        ctx2d.globalAlpha = alpha
        ctx2d.translate(p.x, p.y)
        ctx2d.rotate(p.rot * Math.PI / 180)
        ctx2d.fillStyle = p.color
        ctx2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx2d.restore()
      }
    })

    if (alive && elapsed < 3500) {
      raf = requestAnimationFrame(draw)
    } else {
      canvas.remove()
    }
  }

  raf = requestAnimationFrame(draw)
  setTimeout(() => { cancelAnimationFrame(raf); canvas.remove() }, 4200)
}
