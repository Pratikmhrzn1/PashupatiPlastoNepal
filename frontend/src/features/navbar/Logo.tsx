interface LogoProps {
  className?: string
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <img
      src="/images/logo-64.webp"
      alt=""
      width={60}
      height={60}
      decoding="async"
      className={`size-10 shrink-0 rounded-[11px] object-contain outline outline-1 -outline-offset-1 outline-black/10 ${className}`}
    />
  )
}
