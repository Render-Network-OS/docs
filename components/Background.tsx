import dynamic from 'next/dynamic'

// Dynamically import Beams to avoid SSR issues
const Beams = dynamic(() => import('./Beams'), { ssr: false })

interface BackgroundProps {
  className?: string
}

export default function Background({ className = '' }: BackgroundProps) {
  return (
    <div
      className={`fixed inset-0 z-0 pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    >
      <Beams
        beamWidth={3}
        beamHeight={30}
        beamNumber={20}
        lightColor="#0b8cb7"
        speed={1.5}
        noiseIntensity={1.75}
        scale={0.2}
        rotation={30}
      />
    </div>
  )
}








