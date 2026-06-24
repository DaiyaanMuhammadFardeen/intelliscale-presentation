export default function ProgressBar({ totalSteps, consumed, scenes, currentScene, isAutoPlaying }) {
  if (!totalSteps || totalSteps === 0) return null

  const fillPercent = Math.min((consumed / totalSteps) * 100, 100)
  const showLabels = scenes && scenes.length <= 8

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {/* Progress track */}
      <div
        style={{
          width: '100%',
          height: 2,
          background: 'rgba(var(--text-inverse-rgb), 0.06)',
          position: 'relative',
        }}
      >
        {/* Filled portion */}
        <div
          style={{
            height: '100%',
            width: `${fillPercent}%`,
            background: 'var(--neon-cyan)',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Auto-play indicator */}
      {isAutoPlaying && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 6,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: 'var(--neon-cyan)',
              background: 'rgba(0, 245, 255, 0.08)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: 4,
              padding: '2px 8px',
              animation: 'autoPulse 2s ease-in-out infinite',
            }}
          >
            AUTO
          </span>
        </div>
      )}

      {/* Scene dots */}
      {scenes && scenes.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: scenes.length > 12 ? 4 : 8,
            marginTop: 4,
            padding: '0 20px',
          }}
        >
          {scenes.map((scene, i) => {
            const isCurrent = i === currentScene
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 0,
                  flexShrink: 1,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--neon-purple)' : 'rgba(var(--text-inverse-rgb), 0.12)',
                    border: isCurrent ? 'none' : '1px solid rgba(var(--text-inverse-rgb), 0.08)',
                    flexShrink: 0,
                  }}
                />
                {/* Label */}
                {showLabels && (
                  <span
                    style={{
                      marginTop: 3,
                      fontSize: 9,
                      color: 'var(--text-dim)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 48,
                      lineHeight: '11px',
                      textAlign: 'center',
                    }}
                    title={scene.name}
                  >
                    {scene.name}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
