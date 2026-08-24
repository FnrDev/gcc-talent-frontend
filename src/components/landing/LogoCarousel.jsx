import { useEffect, useState } from 'react'

function LogoCarousel({ groups, interval = 3000, className = '' }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const fadeOut = setTimeout(() => setVisible(false), interval - 400)
    const swap = setTimeout(() => {
      setIndex((current) => (current + 1) % groups.length)
      setVisible(true)
    }, interval)

    return () => {
      clearTimeout(fadeOut)
      clearTimeout(swap)
    }
  }, [index, interval, groups.length])

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-10 gap-y-3 transition-all duration-400 ease-out ${
        visible ? 'opacity-100 blur-none' : 'opacity-0 blur-sm'
      } ${className}`}
    >
      {groups[index].map((name) => (
        <span key={name} className="text-lg font-semibold tracking-tight text-white/80">
          {name}
        </span>
      ))}
    </div>
  )
}

export default LogoCarousel
