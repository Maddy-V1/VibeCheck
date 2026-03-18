import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: '✦',
    title: 'Expert Evaluation',
    description:
      'Your projects reviewed by senior developers who understand AI-native development.',
    gradient: 'from-brand/10 to-accent-purple/10',
  },
  {
    icon: '◆',
    title: 'Verifiable Credentials',
    description:
      'Earn badges and certificates that prove your skills with cryptographic verification.',
    gradient: 'from-accent-cyan/10 to-brand/10',
  },
  {
    icon: '◈',
    title: 'Public Portfolio',
    description: 'Showcase your evaluated projects with a professional profile that stands out.',
    gradient: 'from-accent-emerald/10 to-accent-cyan/10',
  },
  {
    icon: '◇',
    title: 'Community Recognition',
    description: 'Join a movement of builders who are shaping the future of development.',
    gradient: 'from-accent-purple/10 to-accent-emerald/10',
  },
]

export function HeroFeatures() {
  return (
    <section className="relative z-10 w-full max-w-7xl px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Built for the <span className="gradient-text">new generation</span>
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-zinc-500">
          VibeCheck is the first platform designed specifically for developers who build with AI
          tools. No more explaining your process — just show your work.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <Card
            key={feature.title}
            className="border-white/[0.08]/50 group relative overflow-hidden transition-all hover:border-brand/30 hover:shadow-lg"
            style={{
              animation: `fade-up 0.5s ease-out ${index * 100 + 600}ms backwards`,
            }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
            />
            <CardHeader className="relative">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand/10 to-accent-purple/10 text-2xl">
                {feature.icon}
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <CardDescription className="leading-relaxed">{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
