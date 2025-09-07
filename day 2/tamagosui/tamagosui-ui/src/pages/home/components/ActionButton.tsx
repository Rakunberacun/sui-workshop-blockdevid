import type { ReactNode } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Definisikan tipe untuk props, tambahkan 'className' sebagai opsional
type ActionButtonProps = {
  onClick: () => void;
  disabled: boolean;
  isPending: boolean;
  label: string;
  icon: ReactNode;
  className?: string; // <-- Ditambahkan
};

export function ActionButton({
  onClick,
  disabled,
  isPending,
  label,
  icon,
  className = "", // <-- Ditambahkan, dengan nilai default string kosong
}: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      // Gabungkan kelas default dengan className yang baru
      className={`w-full cursor-pointer ${className}`} // <-- Diperbarui
    >
      {isPending ? (
        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        // Wrapper div untuk ikon dipertahankan agar ukurannya konsisten
        <div className="mr-2 h-4 w-4 flex items-center justify-center">{icon}</div>
      )}
      {label}
    </Button>
  );
}