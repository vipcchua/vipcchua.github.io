import { useEffect, useState } from 'react'

function takeRandom(items) {
  return items.splice(Math.floor(Math.random() * items.length), 1)[0]
}

export function useWallRotation(length, canPop) {
  const [wall, setWall] = useState(() => {
    const pool = Array.from({ length }, (_, index) => index)
    const visible = Array.from({ length: Math.min(10, length) }, () => takeRandom(pool))
    return { visible, pool, popped: null, delay: 10000, generations: {} }
  })

  useEffect(() => {
    if (wall.popped !== null) {
      const timer = setTimeout(() => {
        const available = wall.pool.length ? [...wall.pool] : Array.from({ length }, (_, index) => index)
          .filter(index => !wall.visible.includes(index))
        const replacement = takeRandom(available)
        setWall({ visible: [...wall.visible, replacement], pool: available, popped: null, delay: 8000,
          generations: { ...wall.generations, [replacement]: (wall.generations[replacement] ?? 0) + 1 } })
      }, 2000)
      return () => clearTimeout(timer)
    }
    if (!wall.visible.length) return
    const timer = setInterval(() => {
      const eligible = wall.visible.filter(canPop)
      if (!eligible.length) return
      const popped = takeRandom(eligible)
      setWall({ ...wall, popped, visible: wall.visible.filter(index => index !== popped) })
    }, wall.delay)
    return () => clearInterval(timer)
  }, [wall, length, canPop])

  return { indexes: wall.popped === null ? wall.visible : [...wall.visible, wall.popped],
    popped: wall.popped, generations: wall.generations }
}
