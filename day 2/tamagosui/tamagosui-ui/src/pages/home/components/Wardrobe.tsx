import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { UseMutateEquipAccessory } from "@/hooks/useMutateEquipAccessory";
import { UseMutateUnequipAccessory } from "@/hooks/useMutateUnequipAccessory";
import { useQueryEquippedAccessory } from "@/hooks/useQueryEquippedAccessory";
import { useQueryOwnedAccessories } from "@/hooks/useQueryOwnedAccessories";
import type { PetStruct } from "@/types/Pet";

type WardrobeManagerProps = {
  pet: PetStruct;
  isAnyActionPending: boolean;
};

export function WardrobeManager({
  pet,
  isAnyActionPending,
}: WardrobeManagerProps) {
  // --- Hooks for Actions ---
  const { mutate: mutateEquip, isPending: isEquipping } =
    UseMutateEquipAccessory();
  const { mutate: mutateUnequip, isPending: isUnequipping } =
    UseMutateUnequipAccessory();

  // --- Wardrobe Data Fetching Hooks ---
  const { data: ownedAccessories, isLoading: isLoadingAccessories } =
    useQueryOwnedAccessories();
  const { data: equippedAccessory, isLoading: isLoadingEquipped } =
    useQueryEquippedAccessory({ petId: pet.id });

  // A specific loading state for wardrobe actions to disable buttons.
  const isProcessingWardrobe = isEquipping || isUnequipping;
  const isLoading = isLoadingAccessories || isLoadingEquipped;

  const renderContent = () => {
    // Priority 1: Handle the loading state.
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="h-4 w-4 animate-spin" />
          <span>Loading wardrobe...</span>
        </div>
      );
    }

    // Priority 2: Check if an accessory is currently equipped.
    if (equippedAccessory) {
      return (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <img
              src={equippedAccessory.image_url}
              alt={equippedAccessory.name}
              className="w-12 h-12 rounded-md border p-1 bg-white"
            />
            <p className="text-sm font-semibold capitalize">
              Equipped: <strong>{equippedAccessory.name}</strong>
            </p>
          </div>
          <Button
            onClick={() => mutateUnequip({ petId: pet.id })}
            disabled={isAnyActionPending || isProcessingWardrobe}
            variant="destructive"
            size="sm"
          >
            {isUnequipping && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}{" "}
            Unequip
          </Button>
        </div>
      );
    }

    // Priority 3: If nothing is equipped, check the user's wallet inventory.
    if (ownedAccessories && ownedAccessories.length > 0) {
      return (
        // Gunakan .map() untuk me-looping dan menampilkan SEMUA item
        <div className="flex flex-col gap-3 w-full">
          {ownedAccessories.map((accessory) => (
            <div
              key={accessory.id.id}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <img
                  src={accessory.image_url}
                  alt={accessory.name}
                  className="w-12 h-12 rounded-md border p-1 bg-white"
                />
                <p className="text-sm font-semibold capitalize">{accessory.name}</p>
              </div>
              <Button
                onClick={() =>
                  mutateEquip({
                    petId: pet.id,
                    accessoryId: accessory.id.id, // Gunakan ID dari item yang di-loop
                  })
                }
                disabled={isAnyActionPending || isProcessingWardrobe}
                size="sm"
              >
                {isEquipping && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Equip
              </Button>
            </div>
          ))}
        </div>
      );
    }
    
    // Priority 4: If nothing is equipped and inventory is empty.
    return (
      <p className="text-sm text-muted-foreground">
        You don't own any accessories.
      </p>
    );
  };

  return (
    <CardFooter className="flex-col items-start gap-4 pt-4">
      <h3 className="text-3xl font-bold flex items-center gap-2 mx-auto">Wardrobe</h3>
      <div className="w-full text-center p-2 bg-muted rounded-lg min-h-[72px] flex items-center justify-center">
        {renderContent()}
      </div>
    </CardFooter>
  );
}