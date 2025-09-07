import { ConnectButton } from "@mysten/dapp-kit";
import { CatIcon } from "lucide-react"; // <-- 1. Tambahkan import untuk ikon

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-background/50 backdrop-blur-sm border-b/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* 2. Perbarui baris di bawah ini */}
        <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-2">
          <CatIcon className="h-10 w-10 text-black" />
          <span>TamagoSUI</span>
        </h1>
        
        <ConnectButton />
      </div>
    </header>
  );
}