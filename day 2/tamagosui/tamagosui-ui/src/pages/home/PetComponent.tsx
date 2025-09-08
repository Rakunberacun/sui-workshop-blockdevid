import { useEffect, useState } from "react";
import {
  CoinsIcon,
  HeartIcon,
  StarIcon,
  Loader2Icon,
  BatteryIcon,
  DrumstickIcon,
  PlayIcon,
  BedIcon,
  BriefcaseIcon,
  ZapIcon,
  ChevronUpIcon,
  VeganIcon,
  GlassesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatDisplay } from "./components/StatDisplay";
import { ActionButton } from "./components/ActionButton";
import { WardrobeManager } from "./components/Wardrobe";
import { useMutateCheckAndLevelUp } from "@/hooks/useMutateCheckLevel";
import { useMutateFeedPet } from "@/hooks/useMutateFeedPet";
import { useMutateLetPetSleep } from "@/hooks/useMutateLetPetSleep";
import { useMutatePlayWithPet } from "@/hooks/useMutatePlayWithPet";
import { useMutateWakeUpPet } from "@/hooks/useMutateWakeUpPet";
import { useMutateWorkForCoins } from "@/hooks/useMutateWorkForCoins";
import { useQueryGameBalance } from "@/hooks/useQueryGameBalance";
import { useMutateMintCatnip } from "@/hooks/useMutateMintCatnip";
import { useMutateMintGlasses } from "@/hooks/useMutateMintGlasses";
import type { PetStruct } from "@/types/Pet";

type PetDashboardProps = {
  pet: PetStruct;
};

export default function PetComponent({ pet }: PetDashboardProps) {
  const { data: gameBalance, isLoading: isLoadingGameBalance } = useQueryGameBalance();
  const [displayStats, setDisplayStats] = useState(pet.stats);
  const { mutate: mutateFeedPet, isPending: isFeeding } = useMutateFeedPet();
  const { mutate: mutatePlayWithPet, isPending: isPlaying } = useMutatePlayWithPet();
  const { mutate: mutateWorkForCoins, isPending: isWorking } = useMutateWorkForCoins();
  const { mutate: mutateLetPetSleep, isPending: isSleeping } = useMutateLetPetSleep();
  const { mutate: mutateWakeUpPet, isPending: isWakingUp } = useMutateWakeUpPet();
  const { mutate: mutateLevelUp, isPending: isLevelingUp } = useMutateCheckAndLevelUp();
  const { mutate: mintCatnip, isPending: isMintingCatnip } = useMutateMintCatnip();
  const { mutate: mintGlasses, isPending: isMintingGlasses } = useMutateMintGlasses();
  
  useEffect(() => { setDisplayStats(pet.stats); }, [pet.stats]);
  useEffect(() => {
    if (pet.isSleeping && !isWakingUp && gameBalance) {
      const intervalId = setInterval(() => {
        setDisplayStats((prev) => {
          const energyPerSecond = 1000 / Number(gameBalance.sleep_energy_gain_ms);
          const hungerLossPerSecond = 1000 / Number(gameBalance.sleep_hunger_loss_ms);
          const happinessLossPerSecond = 1000 / Number(gameBalance.sleep_happiness_loss_ms);
          return {
            energy: Math.min(gameBalance.max_stat, prev.energy + energyPerSecond),
            hunger: Math.max(0, prev.hunger - hungerLossPerSecond),
            happiness: Math.max(0, prev.happiness - happinessLossPerSecond),
          };
        });
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [pet.isSleeping, isWakingUp, gameBalance]);

  if (isLoadingGameBalance || !gameBalance)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl">Loading Game Rules...</h1>
      </div>
    );

  const isAnyActionPending = isFeeding || isPlaying || isSleeping || isWorking || isLevelingUp || isMintingCatnip || isMintingGlasses || isWakingUp;
  const canFeed = !pet.isSleeping && pet.stats.hunger < gameBalance.max_stat && pet.game_data.coins >= Number(gameBalance.feed_coins_cost);
  const canPlay = !pet.isSleeping && pet.stats.energy >= gameBalance.play_energy_loss && pet.stats.hunger >= gameBalance.play_hunger_loss;
  const canWork = !pet.isSleeping && pet.stats.energy >= gameBalance.work_energy_loss && pet.stats.happiness >= gameBalance.work_happiness_loss && pet.stats.hunger >= gameBalance.work_hunger_loss;
  const canLevelUp = !pet.isSleeping && pet.game_data.experience >= pet.game_data.level * Number(gameBalance.exp_per_level);

  return (
    <TooltipProvider>
      <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start justify-center min-h-[calc(100vh-64px)]">
        
        {/* === KOLOM 1: INFO PET === */}
        <div className="w-full">
          <Card className="shadow-hard border-2 border-primary flex flex-col items-center p-6 space-y-6 w-full">
            <div className="text-center w-full">
              <h1 className="text-5xl font-bold capitalize">{pet.name}</h1>
              <p className="text-2xl text-muted-foreground">
                Level {pet.game_data.level}
              </p>
            </div>
              <img
                src={pet.image_url}
                alt={pet.name}
                className="w-full aspect-square rounded-lg object-contain image-rendering-pixelated" 
              />
          </Card>
        </div>

        {/* === KOLOM 2: STATS & AKSI === */}
        <div className="w-full">
          <Card className="shadow-hard border-2 border-primary p-6 space-y-6">
            <h2 className="text-3xl font-bold text-center">Stats</h2>
            
            {/* Stats */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xl">
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-2">
                    <CoinsIcon className="w-6 h-6 text-yellow-500" />
                    <span className="font-bold">{pet.game_data.coins}</span>
                  </TooltipTrigger>
                  <TooltipContent><p>Coins</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-2">
                    <span className="font-bold">{pet.game_data.experience}</span>
                    <StarIcon className="w-6 h-6 text-purple-500" />
                  </TooltipTrigger>
                  <TooltipContent><p>Experience Points (XP)</p></TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <StatDisplay icon={<BatteryIcon className="text-green-500" />} label="Energy" value={displayStats.energy} />
                <StatDisplay icon={<HeartIcon className="text-pink-500" />} label="Happiness" value={displayStats.happiness} />
                <StatDisplay icon={<DrumstickIcon className="text-orange-500" />} label="Hunger" value={displayStats.hunger} />
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t">
              <ActionButton 
                onClick={() => mutateFeedPet({ petId: pet.id })} 
                disabled={!canFeed || isAnyActionPending} 
                isPending={isFeeding} 
                label="Feed" 
                icon={<DrumstickIcon className="w-5 h-5" />} 
                className="py-5 bg-pink-500 hover:bg-pink-600 text-lg" 
              />
              <ActionButton 
                onClick={() => mutatePlayWithPet({ petId: pet.id })} 
                disabled={!canPlay || isAnyActionPending} 
                isPending={isPlaying} 
                label="Play" 
                icon={<PlayIcon className="w-5 h-5" />} 
                className="py-5 bg-blue-500 hover:bg-blue-600 text-lg" 
              />
              <ActionButton 
                onClick={() => mutateWorkForCoins({ petId: pet.id })} 
                disabled={!canWork || isAnyActionPending} 
                isPending={isWorking} 
                label="Work" 
                icon={<BriefcaseIcon className="w-5 h-5" />} 
                className="py-5 bg-purple-500 hover:bg-purple-600 text-lg" 
              />
              {pet.isSleeping ? (
                <Button onClick={() => mutateWakeUpPet({ petId: pet.id })} disabled={isWakingUp} className="w-full text-lg py-5 bg-red-500 hover:bg-red-600">
                  {isWakingUp ? <Loader2Icon className="mr-2 h-5 w-5 animate-spin" /> : <ZapIcon className="mr-2 h-5 w-5" />} Wake Up!
                </Button>
              ) : (
                <Button onClick={() => mutateLetPetSleep({ petId: pet.id })} disabled={isAnyActionPending} className="w-full text-lg py-5 bg-gray-600 hover:bg-gray-700">
                  {isSleeping ? <Loader2Icon className="mr-2 h-5 w-5 animate-spin" /> : <BedIcon className="mr-2 h-5 w-5" />} Sleep
                </Button>
              )}
            </div>

            {/* Tombol Level Up */}
            <div className="pt-4 border-t">
              <Button onClick={() => mutateLevelUp({ petId: pet.id })} disabled={!canLevelUp || isAnyActionPending} className="w-full text-lg py-5 bg-green-600 hover:bg-green-700">
                {isLevelingUp ? <Loader2Icon className="mr-2 h-5 w-5 animate-spin" /> : <ChevronUpIcon className="mr-2 h-5 w-5" />} Level Up!
              </Button>
            </div>
          </Card>
        </div>

        {/* === KOLOM 3: WARDROBE & MINT === */}
        <div className="w-full">
          <Card className="shadow-hard border-2 border-primary p-6 space-y-6">
            <WardrobeManager pet={pet} isAnyActionPending={isAnyActionPending || pet.isSleeping} />
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <Button onClick={() => mintCatnip()} disabled={isAnyActionPending} className="w-full py-5" variant="outline">
                {isMintingCatnip ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <VeganIcon className="mr-2 h-4 w-4" />} Take Catnip
              </Button>
              <Button onClick={() => mintGlasses()} disabled={isAnyActionPending} className="w-full py-5" variant="outline">
                {isMintingGlasses ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <GlassesIcon className="mr-2 h-4 w-4" />} Cool Glasses
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </TooltipProvider>
  );
}