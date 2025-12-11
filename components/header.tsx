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

        <div className="text-gold text-sm font-medium tracking-wide">Gift of Time 2025</div>
      </div>
    </header>
  )
}
