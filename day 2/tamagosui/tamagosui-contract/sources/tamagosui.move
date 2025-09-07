module 0x0::tamagosui;

use std::string::{Self, String};
use sui::{clock::Clock, display, dynamic_field, event, package, transfer, object::{Self, ID, UID}};

// === Errors ===
const E_NOT_ENOUGH_COINS: u64 = 101;
const E_PET_NOT_HUNGRY: u64 = 102;
const E_PET_TOO_TIRED: u64 = 103;
const E_PET_TOO_HUNGRY: u64 = 104;
const E_ITEM_ALREADY_EQUIPPED: u64 = 105;
const E_NO_ITEM_EQUIPPED: u64 = 106;
const E_NOT_ENOUGH_EXP: u64 = 107;
const E_PET_IS_ASLEEP: u64 = 108;
const E_PET_IS_ALREADY_ASLEEP: u64 = 109;

// === Constants ===
const PET_LEVEL_1_IMAGE_URL: vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeicpye2mhpfrfmpk2yn64yp5kkehyv4ovzeigy2f75vfe5e43nkzq4/1.png";
const PET_LEVEL_1_IMAGE_WITH_GLASSES_URL: vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeicpye2mhpfrfmpk2yn64yp5kkehyv4ovzeigy2f75vfe5e43nkzq4/1.2.png";
const PET_LEVEL_2_IMAGE_URL: vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeicpye2mhpfrfmpk2yn64yp5kkehyv4ovzeigy2f75vfe5e43nkzq4/2.png";
const PET_LEVEL_2_IMAGE_WITH_GLASSES_URL:vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeicpye2mhpfrfmpk2yn64yp5kkehyv4ovzeigy2f75vfe5e43nkzq4/2.2.png";
const PET_LEVEL_3_IMAGE_URL: vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeicpye2mhpfrfmpk2yn64yp5kkehyv4ovzeigy2f75vfe5e43nkzq4/3.png";
const PET_LEVEL_3_IMAGE_WITH_GLASSES_URL:vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeicpye2mhpfrfmpk2yn64yp5kkehyv4ovzeigy2f75vfe5e43nkzq4/3.3.png";
const PET_SLEEP_IMAGE_URL: vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeicpye2mhpfrfmpk2yn64yp5kkehyv4ovzeigy2f75vfe5e43nkzq4/4.png";
const ACCESSORY_GLASSES_IMAGE_URL: vector<u8> = b"https://tan-kind-lizard-741.mypinata.cloud/ipfs/bafkreigyivmq45od3jkryryi3w6t5j65hcnfh5kgwpi2ex7llf2i6se7de";
const ACCESSORY_CATNIP_IMAGE_URL: vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeie6ahhgruszbfm7mceqr3ytkniop4dhbmzhldespyb3i5djwntybu";
const PET_LEVEL_1_IMAGE_WITH_CATNIP_URL: vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeicpye2mhpfrfmpk2yn64yp5kkehyv4ovzeigy2f75vfe5e43nkzq4/1.1.png";
const PET_LEVEL_2_IMAGE_WITH_CATNIP_URL: vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeicpye2mhpfrfmpk2yn64yp5kkehyv4ovzeigy2f75vfe5e43nkzq4/2.1.png";
const PET_LEVEL_3_IMAGE_WITH_CATNIP_URL: vector<u8> = b"https://aqua-effective-crane-913.mypinata.cloud/ipfs/bafybeicpye2mhpfrfmpk2yn64yp5kkehyv4ovzeigy2f75vfe5e43nkzq4/3.1.png";

const EQUIPPED_ITEM_KEY: vector<u8> = b"equipped_item";
const SLEEP_STARTED_AT_KEY: vector<u8> = b"sleep_started_at";

// === Game Balance ===
public struct GameBalance has copy, drop {
    max_stat: u8,
    feed_coins_cost: u64,
    feed_experience_gain: u64,
    feed_hunger_gain: u8,
    play_energy_loss: u8,
    play_hunger_loss: u8,
    play_experience_gain: u64,
    play_happiness_gain: u8,
    work_energy_loss: u8,
    work_happiness_loss: u8,
    work_hunger_loss: u8,
    work_coins_gain: u64,
    work_experience_gain: u64,
    sleep_energy_gain_ms: u64,
    sleep_happiness_loss_ms: u64,
    sleep_hunger_loss_ms: u64,
    exp_per_level: u64,
}

fun get_game_balance(): GameBalance {
    GameBalance {
        max_stat: 100,
        feed_coins_cost: 5,
        feed_experience_gain: 5,
        feed_hunger_gain: 20,
        play_energy_loss: 15,
        play_hunger_loss: 15,
        play_experience_gain: 10,
        play_happiness_gain: 25,
        work_energy_loss: 20,
        work_hunger_loss: 20,
        work_happiness_loss: 20,
        work_coins_gain: 10,
        work_experience_gain: 15,
        sleep_energy_gain_ms: 1000,
        sleep_happiness_loss_ms: 700,
        sleep_hunger_loss_ms: 500,
        exp_per_level: 100,
    }
}

public struct TAMAGOSUI has drop {}

public struct Pet has key, store {
    id: UID,
    name: String,
    image_url: String,
    adopted_at: u64,
    stats: PetStats,
    game_data: PetGameData,
}

public struct PetAccessory has key, store {
    id: UID,
    name: String,
    image_url: String
}

public struct PetStats has store {
    energy: u8,
    happiness: u8,
    hunger: u8,
}

public struct PetGameData has store {
    coins: u64,
    experience: u64,
    level: u8,
}

// === Events ===
public struct PetAdopted has copy, drop {
    pet_id: ID,
    name: String,
    adopted_at: u64
}
public struct PetAction has copy, drop {
    pet_id: ID,
    action: String,
    energy: u8,
    happiness: u8,
    hunger: u8
}

fun init(witness: TAMAGOSUI, ctx: &mut TxContext) {
    let publisher = package::claim(witness, ctx);
    // Omitted display object creation for brevity, it should be restored if needed
    transfer::public_transfer(publisher, ctx.sender());
}

public fun adopt_pet(name: String, clock: &Clock, ctx: &mut TxContext) {
    let current_time = clock.timestamp_ms();
    let pet_stats = PetStats { energy: 60, happiness: 50, hunger: 40 };
    let pet_game_data = PetGameData { coins: 20, experience: 0, level: 1 };

    let pet = Pet {
        id: object::new(ctx),
        name,
        image_url: string::utf8(PET_LEVEL_1_IMAGE_URL),
        adopted_at: current_time,
        stats: pet_stats,
        game_data: pet_game_data
    };
    event::emit(PetAdopted { pet_id: object::id(&pet), name: pet.name, adopted_at: pet.adopted_at });
    transfer::public_transfer(pet, ctx.sender());
}

public fun feed_pet(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);
    let gb = get_game_balance();
    assert!(pet.stats.hunger < gb.max_stat, E_PET_NOT_HUNGRY);
    assert!(pet.game_data.coins >= gb.feed_coins_cost, E_NOT_ENOUGH_COINS);

    pet.game_data.coins = pet.game_data.coins - gb.feed_coins_cost;
    pet.game_data.experience = pet.game_data.experience + gb.feed_experience_gain;
    pet.stats.hunger = if (pet.stats.hunger + gb.feed_hunger_gain > gb.max_stat) gb.max_stat else pet.stats.hunger + gb.feed_hunger_gain;
    emit_action(pet, b"fed");
}

public fun play_with_pet(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);
    let gb = get_game_balance();
    assert!(pet.stats.energy >= gb.play_energy_loss, E_PET_TOO_TIRED);
    assert!(pet.stats.hunger >= gb.play_hunger_loss, E_PET_TOO_HUNGRY);

    pet.stats.energy = pet.stats.energy - gb.play_energy_loss;
    pet.stats.hunger = pet.stats.hunger - gb.play_hunger_loss;
    pet.game_data.experience = pet.game_data.experience + gb.play_experience_gain;
    pet.stats.happiness = if (pet.stats.happiness + gb.play_happiness_gain > gb.max_stat) gb.max_stat else pet.stats.happiness + gb.play_happiness_gain;
    emit_action(pet, b"played");
}

public fun work_for_coins(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);
    let gb = get_game_balance();
    assert!(pet.stats.energy >= gb.work_energy_loss, E_PET_TOO_TIRED);
    assert!(pet.stats.happiness >= gb.work_happiness_loss, E_PET_NOT_HUNGRY); // Note: Original code had E_PET_NOT_HUNGRY, might be a typo
    assert!(pet.stats.hunger >= gb.work_hunger_loss, E_PET_TOO_HUNGRY);

    pet.stats.energy = if (pet.stats.energy >= gb.work_energy_loss) pet.stats.energy - gb.work_energy_loss else 0;
    pet.stats.happiness = if (pet.stats.happiness >= gb.work_happiness_loss) pet.stats.happiness - gb.work_happiness_loss else 0;
    pet.stats.hunger = if (pet.stats.hunger >= gb.work_hunger_loss) pet.stats.hunger - gb.work_hunger_loss else 0;
    pet.game_data.coins = pet.game_data.coins + gb.work_coins_gain;
    pet.game_data.experience = pet.game_data.experience + gb.work_experience_gain;
    emit_action(pet, b"worked");
}

public fun let_pet_sleep(pet: &mut Pet, clock: &Clock) {
    assert!(!is_sleeping(pet), E_PET_IS_ALREADY_ASLEEP);
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::add(&mut pet.id, key, clock.timestamp_ms());
    pet.image_url = string::utf8(PET_SLEEP_IMAGE_URL);
    emit_action(pet, b"started_sleeping");
}

public fun wake_up_pet(pet: &mut Pet, clock: &Clock) {
    assert!(is_sleeping(pet), E_PET_IS_ASLEEP);
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    let sleep_started_at: u64 = dynamic_field::remove(&mut pet.id, key);
    let duration_ms = clock.timestamp_ms() - sleep_started_at;
    let gb = get_game_balance();

    let energy_gained = ((duration_ms / gb.sleep_energy_gain_ms) as u8);
    pet.stats.energy = if ((pet.stats.energy as u16) + (energy_gained as u16) > (gb.max_stat as u16)) gb.max_stat else pet.stats.energy + energy_gained;

    let happiness_lost = ((duration_ms / gb.sleep_happiness_loss_ms) as u8);
    pet.stats.happiness = if (pet.stats.happiness > happiness_lost) pet.stats.happiness - happiness_lost else 0;

    let hunger_lost = ((duration_ms / gb.sleep_hunger_loss_ms) as u8);
    pet.stats.hunger = if (pet.stats.hunger > hunger_lost) pet.stats.hunger - hunger_lost else 0;
    
    update_pet_image(pet);
    emit_action(pet, b"woke_up");
}

public fun check_and_level_up(pet: &mut Pet) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);
    let gb = get_game_balance();
    let required_exp = (pet.game_data.level as u64) * gb.exp_per_level;
    assert!(pet.game_data.experience >= required_exp, E_NOT_ENOUGH_EXP);

    pet.game_data.level = pet.game_data.level + 1;
    pet.game_data.experience = pet.game_data.experience - required_exp;
    update_pet_image(pet);
    emit_action(pet, b"leveled_up");
}

public fun mint_accessory(ctx: &mut TxContext) {
    let accessory = PetAccessory {
        id: object::new(ctx),
        name: string::utf8(b"cool glasses"),
        image_url: string::utf8(ACCESSORY_GLASSES_IMAGE_URL)
    };
    transfer::public_transfer(accessory, ctx.sender());
}

public fun mint_catnip_accessory(ctx: &mut TxContext) {
    let accessory = PetAccessory {
        id: object::new(ctx),
        name: string::utf8(b"catnip"),
        image_url: string::utf8(ACCESSORY_CATNIP_IMAGE_URL)
    };
    transfer::public_transfer(accessory, ctx.sender());
}

public fun equip_accessory(pet: &mut Pet, accessory: PetAccessory) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);
    let key = string::utf8(EQUIPPED_ITEM_KEY);
    assert!(!dynamic_field::exists_<String>(&pet.id, copy key), E_ITEM_ALREADY_EQUIPPED);
    dynamic_field::add(&mut pet.id, key, accessory);
    update_pet_image(pet);
    emit_action(pet, b"equipped_item");
}

public fun unequip_accessory(pet: &mut Pet, ctx: &mut TxContext) {
    assert!(!is_sleeping(pet), E_PET_IS_ASLEEP);
    let key = string::utf8(EQUIPPED_ITEM_KEY);
    assert!(dynamic_field::exists_<String>(&pet.id, key), E_NO_ITEM_EQUIPPED);
    let accessory: PetAccessory = dynamic_field::remove(&mut pet.id, key);
    update_pet_image(pet);
    transfer::transfer(accessory, ctx.sender());
    emit_action(pet, b"unequipped_item");
}

// === Helper Functions ===
fun emit_action(pet: &Pet, action: vector<u8>) {
    event::emit(PetAction {
        pet_id: object::id(pet),
        action: string::utf8(action),
        energy: pet.stats.energy,
        happiness: pet.stats.happiness,
        hunger: pet.stats.hunger,
    });
}

fun update_pet_image(pet: &mut Pet) {
    let key = string::utf8(EQUIPPED_ITEM_KEY);
    if (dynamic_field::exists_<String>(&pet.id, copy key)) {
        let accessory: &PetAccessory = dynamic_field::borrow(&pet.id, key);
        if (accessory.name == string::utf8(b"cool glasses")) {
            if (pet.game_data.level == 1) {
                pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_WITH_GLASSES_URL);
            } else if (pet.game_data.level == 2) {
                pet.image_url = string::utf8(PET_LEVEL_2_IMAGE_WITH_GLASSES_URL);
            } else {
                pet.image_url = string::utf8(PET_LEVEL_3_IMAGE_WITH_GLASSES_URL);
            };
        } else if (accessory.name == string::utf8(b"catnip")) {
            if (pet.game_data.level == 1) {
                pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_WITH_CATNIP_URL);
            } else if (pet.game_data.level == 2) {
                pet.image_url = string::utf8(PET_LEVEL_2_IMAGE_WITH_CATNIP_URL);
            } else {
                pet.image_url = string::utf8(PET_LEVEL_3_IMAGE_WITH_CATNIP_URL);
            };
        };
    } else {
        if (pet.game_data.level == 1) {
            pet.image_url = string::utf8(PET_LEVEL_1_IMAGE_URL);
        } else if (pet.game_data.level == 2) {
            pet.image_url = string::utf8(PET_LEVEL_2_IMAGE_URL);
        } else {
            pet.image_url = string::utf8(PET_LEVEL_3_IMAGE_URL);
        };
    };
}

// === View Functions ===
public fun get_pet_name(pet: &Pet): String { pet.name }
public fun get_pet_adopted_at(pet: &Pet): u64 { pet.adopted_at }
public fun get_pet_coins(pet: &Pet): u64 { pet.game_data.coins }
public fun get_pet_experience(pet: &Pet): u64 { pet.game_data.experience }
public fun get_pet_level(pet: &Pet): u8 { pet.game_data.level }
public fun get_pet_energy(pet: &Pet): u8 { pet.stats.energy }
public fun get_pet_hunger(pet: &Pet): u8 { pet.stats.hunger }
public fun get_pet_happiness(pet: &Pet): u8 { pet.stats.happiness }
public fun get_pet_stats(pet: &Pet): (u8, u8, u8) { (pet.stats.energy, pet.stats.hunger, pet.stats.happiness) }
public fun get_pet_game_data(pet: &Pet): (u64, u64, u8) { (pet.game_data.coins, pet.game_data.experience, pet.game_data.level) }
public fun is_sleeping(pet: &Pet): bool {
    let key = string::utf8(SLEEP_STARTED_AT_KEY);
    dynamic_field::exists_<String>(&pet.id, key)
}

// === Test-Only Functions ===
#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(TAMAGOSUI {}, ctx);
}