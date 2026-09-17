import { useTheme } from '../../theme/ThemeProvider'

type BrandMarkProps = {
  size?: 'sm' | 'md'
  className?: string
}

export function BrandMark({ size = 'md', className = '' }: BrandMarkProps) {
  const { accentHue } = useTheme()
  const dim = size === 'sm' ? 'h-8 w-8 text-[0.62rem]' : 'h-9 w-9 text-[0.68rem]'

  return (
    <span
      className={`brand-mark ${dim} ${className}`}
      title="TechTrack"
      style={{ ['--brand-hue' as string]: String(accentHue) }}
    >
      <span className="brand-mark__fluid" aria-hidden />
      <span className="brand-mark__tint" aria-hidden />
      <span className="brand-mark__glass" aria-hidden />
      <span className="brand-mark__specular" aria-hidden />
      <span className="brand-mark__letter">TT</span>
    </span>
  )
}
