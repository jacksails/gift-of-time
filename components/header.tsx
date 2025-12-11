export default function Header() {
  return (
    <header className="border-b border-gold/20 bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/ima-logo.svg"
            alt="IMA"
            className="h-6 w-auto"
            style={{
              filter:
                "brightness(0) saturate(100%) invert(72%) sepia(48%) saturate(568%) hue-rotate(359deg) brightness(101%) contrast(92%)",
            }}
          />
        </div>

        <div className="text-gold text-sm font-medium tracking-wide flex items-center gap-2">
          <span className="text-cranberry text-xs">✦</span>
          Gift of Time {new Date().getFullYear()}
          <span className="text-forest text-xs">✦</span>
        </div>
      </div>
    </header>
  )
}
