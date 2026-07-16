interface AvatarFrameProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'profile'
}

export function AvatarFrame({ src, alt, size = 'md' }: AvatarFrameProps) {
  return (
    <div className={`avatar-frame avatar-frame--${size}`}>
      <img src={src} alt={alt} />
    </div>
  )
}
