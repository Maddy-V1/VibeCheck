// Satori React component for badge generation
// IMPORTANT: Use only inline styles - no Tailwind classes

interface BadgeTemplateProps {
  project: {
    title: string
  }
  evaluation: {
    id: string
    score_total: number
    tier_confirmed: string
    evaluated_at: string
  }
}

const TIER_COLORS = {
  tier1: '#00F5A0',
  tier2: '#00E5FF',
  tier3: '#6C47FF',
}

export function BadgeTemplate({ project, evaluation }: BadgeTemplateProps) {
  const tierColor = TIER_COLORS[evaluation.tier_confirmed as keyof typeof TIER_COLORS] || '#6C47FF'

  return (
    <div
      style={{
        display: 'flex',
        width: 800,
        height: 400,
        background: '#0D0D1A',
        borderRadius: 12,
        border: '1px solid #2D2D4E',
        fontFamily: 'Inter',
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          width: 8,
          background: tierColor,
          borderRadius: '12px 0 0 12px',
        }}
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p
              style={{
                color: '#A78BFA',
                fontSize: 11,
                letterSpacing: 3,
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              PROJECT BADGE
            </p>
            <h2
              style={{
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 12,
                maxWidth: 500,
              }}
            >
              {project.title}
            </h2>
            <div
              style={{
                display: 'inline-flex',
                padding: '4px 12px',
                borderRadius: 6,
                border: `1px solid ${tierColor}`,
                backgroundColor: `${tierColor}15`,
                color: tierColor,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                alignSelf: 'flex-start',
              }}
            >
              {evaluation.tier_confirmed.replace('tier', 'TIER ')}
            </div>
          </div>

          {/* Score circle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: `4px solid ${tierColor}`,
              backgroundColor: '#1A1A2E',
            }}
          >
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              {evaluation.score_total}
            </span>
            <span
              style={{
                fontSize: 12,
                color: '#94A3B8',
              }}
            >
              / 100
            </span>
          </div>
        </div>

        {/* Bottom section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <p
            style={{
              color: '#94A3B8',
              fontSize: 11,
            }}
          >
            Evaluated by VibeCheck •{' '}
            {new Date(evaluation.evaluated_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p
            style={{
              color: '#2D2D4E',
              fontSize: 10,
              fontFamily: 'monospace',
            }}
          >
            ID: {evaluation.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  )
}
