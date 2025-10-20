import Image from 'next/image'

export default function SocialFooter() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      
        href="https://x.com/AIPolyseer"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 hover:bg-black/70 transition-all"
      >
        <Image src="/x.png" alt="Twitter" width={16} height={16} />
        <span className="text-white text-sm">@AIPolyseer</span>
      </a>
    </div>
  )
}