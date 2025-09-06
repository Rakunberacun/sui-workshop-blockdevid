import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { MODULE_NAME, PACKAGE_ID } from "@/constants/contract";
import { queryKeyOwnedAccessories } from "./useQueryOwnedAccessories"; // Pastikan path ini benar

// Kunci unik untuk mutasi ini
const mutateKeyMintCatnip = ["mutate", "mint-catnip"];

export function useMutateMintCatnip() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutateKeyMintCatnip,
    mutationFn: async () => {
      if (!currentAccount) throw new Error("No connected account");

      const tx = new Transaction();
      tx.moveCall({
        // Arahkan ke fungsi mint_catnip_accessory
        target: `${PACKAGE_ID}::${MODULE_NAME}::mint_catnip_accessory`,
      });

      // 1. Tanda tangani dan kirim transaksi
      const { digest } = await signAndExecute({ transaction: tx });

      // 2. Tunggu hingga transaksi diindeks oleh fullnode
      const response = await suiClient.waitForTransaction({
        digest,
        options: { showEffects: true, showEvents: true },
      });

      // 3. Lemparkan error jika transaksi gagal di on-chain
      if (response?.effects?.status.status === "failure") {
        throw new Error(response.effects.status.error);
      }

      return response;
    },
    onSuccess: (response) => {
      // Notifikasi sukses menggunakan toast
      toast.success(`Catnip minted successfully! Tx: ${response.digest.slice(0, 6)}...`);

      // Otomatis refresh query untuk daftar aksesori yang dimiliki
      queryClient.invalidateQueries({ queryKey: queryKeyOwnedAccessories });
    },
    onError: (error: Error) => {
      // Notifikasi error menggunakan toast
      console.error("Error minting Catnip:", error);
      toast.error(`Error minting Catnip: ${error.message}`);
    },
  });
}