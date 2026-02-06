import { Crop, Github } from 'lucide-react';
export function Header() {
  return <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Crop className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            My <span className="text-primary">BIRME</span>
          </h1>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">
          Bulk Image Resizer with Smart Cropping
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden md:block">
          100% Client-Side • Privacy First
        </span>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted transition-colors" title="View on GitHub">
          <Github className="w-5 h-5 text-muted-foreground" />
        </a>
      </div>
    </header>;
}