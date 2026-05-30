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
      // Big: rain from top. Small: burst up from bottom-center.
      x: big
        ? Math.random() * canvas.width
        : canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.5,
      y: big ? -20 : canvas.height + 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: Math.random() * (isBig ? 16 : 10) + 4,
      h: Math.random() * (isBig ? 8 : 6) + 3,
      vx: (Math.random() - 0.5) * (big ? 7 : 11),
      // Big: falls down. Small: shoots upward with arc.
      vy: big ? (Math.random() * 5 + 1) : -(Math.random() * 18 + 9),
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 10,
      gravity: big ? (0.15 + Math.random() * 0.12) : (0.35 + Math.random() * 0.15),
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
      const alpha = elapsed < 2700 ? 1 : Math.max(0, 1 - (elapsed - 2700) / 800)
      const inBounds = big ? p.y < canvas.height + 30 : p.y > -30
      if (inBounds && alpha > 0) {
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
