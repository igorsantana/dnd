interface DancingSkeletonProps {
  className?: string
  flip?: boolean
  delay?: number
}

export function DancingSkeleton({ className = '', flip = false, delay = 0 }: DancingSkeletonProps) {
  return (
    <div
      className={`dancing-skeleton-wrap ${flip ? 'is-flipped' : ''} ${className}`}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden
    >
      <div className="dancing-skeleton" />
    </div>
  )
}
