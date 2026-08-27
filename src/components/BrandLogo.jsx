import { cn } from '@/lib/utils'

function BrandLogo({ className, alt = 'GCC Talents' }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}brand/gcc-talents-logo.png`}
      alt={alt}
      width={32}
      height={32}
      draggable={false}
      className={cn('block size-8 shrink-0 rounded-sm bg-white object-contain', className)}
    />
  )
}

export default BrandLogo
