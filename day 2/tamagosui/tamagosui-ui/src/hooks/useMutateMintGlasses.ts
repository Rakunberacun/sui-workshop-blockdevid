import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { MODULE_NAME, PACKAGE_ID } from "@/constants/contract";
import { queryKeyOwnedAccessories } from "./useQueryOwnedAccessories";

// Kunci unik untuk mutasi ini
const mutateKeyMintGlasses = ["mutate", "mint-glasses"];

export function useMutateMintGlasses() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: mutateKeyMintGlasses,
    mutationFn: async () => {
      if (!currentAccount) throw new Error("No connected account");

      const tx = new Transaction();
      tx.moveCall({
        // Arahkan ke fungsi mint_accessory untuk kacamata
        target: `${PACKAGE_ID}::${MODULE_NAME}::mint_accessory`,
      });

      const { digest } = await signAndExecute({ transaction: tx });
      const response = await suiClient.waitForTransaction({
        digest,
        options: { showEffects: true, showEvents: true },
      });

      if (response?.effects?.status.status === "failure") {
        throw new Error(response.effects.status.error);
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(`Glasses minted successfully! Tx: ${response.digest.slice(0, 6)}...`);
      queryClient.invalidateQueries({ queryKey: queryKeyOwnedAccessories });
    },
    onError: (error: Error) => {
      console.error("Error minting Glasses:", error);
      toast.error(`Error minting Glasses: ${error.message}`);
    },
  });
}