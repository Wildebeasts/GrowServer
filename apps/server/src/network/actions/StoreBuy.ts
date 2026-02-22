import { type NonEmptyObject } from "type-fest";
import { Base } from "../../core/Base";
import { Peer } from "../../core/Peer";
import { DialogBuilder } from "@growserver/utils";
import { Variant } from "growtopia.js";

type TabConfig = {
  id: string;
  label: string;
  position: number;
};

/** items: fixed [{id, amount}] pairs, or "random_seed_rarity2", "random_clothing_common", "random_clothing_rare" for packs */
type StoreItem = {
  name: string;
  title: string;
  description: string;
  image: string;
  imagePos: { x: number; y: number };
  cost: number;
  /** tab key this item belongs to */
  tab: string;
  /** Optional full-width custom button image for the Featured tab (rttex path) */
  featuredImage?: string;
  /** Fixed items to give on purchase. Use special string keys for random packs. */
  items?: (
    | { id: number; amount: number }
    | "random_seed_rarity2"
    | "random_clothing_common"
    | "random_clothing_rare"
  )[];
};

const TABS: TabConfig[] = [
  { id: "main_menu", label: "Home", position: 0 },
  { id: "locks_menu", label: "Locks And Stuff", position: 1 },
  { id: "itempack_menu", label: "Item Packs", position: 2 },
  { id: "bigitems_menu", label: "Awesome Items", position: 3 },
  { id: "weather_menu", label: "Weather Machines", position: 4 },
  { id: "token_menu", label: "Growtoken Items", position: 5 },
];

// Tab index mapping: 1=locks, 2=itempack, 3=bigitems, 4=weather, 5=token
const STORE_ITEMS: StoreItem[] = [
  // ── FEATURED / ITEM OF THE MONTH (main_menu) ────────────────────────────────
  {
    name: "iotm_magplant",
    title: "`oMagplant 5000``",
    description:
      "`2You Get:`` 1 Magplant 5000.<CR><CR>`5Description:`` Simply target the machine to the seed or block of your choosing, and it will collect and store any that drop in your world! Holds up to `$5,000`` items. Wrench it to set the item to collect or retrieve your `5Remote``. Only works in World Locked worlds. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons2.rttex",
    imagePos: { x: 0, y: 8 },
    cost: 200000,
    tab: "main",
    items: [{ id: 5638, amount: 1 }],
  },
  {
    name: "iotm_growtopia_anniversary_pack",
    title: "`oGrowtopia Anniversary Pack``",
    description:
      "`2You Get:`` 1 Anniversary Cake, 1 Golden Pickaxe and 5 Gems Ores.<CR><CR>`5Description:`` Celebrate Growtopia's Anniversary with this exclusive bundle! `4Only available this month!``",
    image: "interface/large/store_buttons/store_buttons2.rttex",
    imagePos: { x: 0, y: 8 },
    cost: 15000,
    tab: "main",
    items: [
      { id: 672, amount: 1 },
      { id: 1438, amount: 1 },
      { id: 136, amount: 5 },
    ],
  },
  {
    name: "iotm_transmutabooth",
    title: "`oTransmutabooth``",
    description:
      "`2You Get:`` 1 Transmutabooth.<CR><CR>`5Description:`` A wondrous technological achievement that allows you to merge clothing items, transferring the visual appearance of one onto another in the same slot! `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons2.rttex",
    imagePos: { x: 0, y: 8 },
    cost: 25000,
    tab: "main",
    items: [{ id: 9170, amount: 1 }],
  },

  // ── LOCKS (locks_menu) ──────────────────────────────────────────────────────
  {
    name: "world_lock",
    title: "`oWorld Lock``",
    description:
      "`2You Get:`` 1 World Lock.<CR><CR>`5Description:`` Become the undisputed ruler of your domain with one of these babies.  It works like a normal lock except it locks the `$entire world``!  Won't work on worlds that other people already have locks on. You can even add additional normal locks to give access to certain areas to friends. `5It's a perma-item, is never lost when destroyed.``  `wRecycles for 200 Gems.``",
    image: "interface/large/store_buttons/store_buttons.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 2000,
    tab: "locks",
    items: [{ id: 242, amount: 1 }],
  },
  {
    name: "world_lock_10_pack",
    title: "`oWorld Lock Pack``",
    description:
      "`2You Get:`` 10 World Locks.<CR><CR>`5Description:`` 10-pack of World Locks. Become the undisputed ruler of up to TEN kingdoms with these babies. Each works like a normal lock except it locks the `$entire world``!  Won't work on worlds that other people already have locks on. You can even add additional normal locks to give access to certain areas to friends. `5It's a perma-item, is never lost when destroyed.`` `wEach recycles for 200 Gems.``",
    image: "interface/large/store_buttons/store_buttons18.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 20000,
    tab: "locks",
    items: [{ id: 242, amount: 10 }],
  },
  {
    name: "small_lock",
    title: "`oSmall Lock``",
    description:
      "`2You Get:`` 1 Small Lock.<CR><CR>`5Description:`` Protect up to `$10`` tiles.  Can add friends to the lock so others can edit that area as well. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons.rttex",
    imagePos: { x: 1, y: 3 },
    cost: 50,
    tab: "locks",
    items: [{ id: 202, amount: 1 }],
  },
  {
    name: "big_lock",
    title: "`oBig Lock``",
    description:
      "`2You Get:`` 1 Big Lock.<CR><CR>`5Description:`` Protect up to `$48`` tiles.  Can add friends to the lock so others can edit that area as well. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons.rttex",
    imagePos: { x: 1, y: 1 },
    cost: 200,
    tab: "locks",
    items: [{ id: 204, amount: 1 }],
  },
  {
    name: "huge_lock",
    title: "`oHuge Lock``",
    description:
      "`2You Get:`` 1 Huge Lock.<CR><CR>`5Description:`` Protect up to `$200`` tiles.  Can add friends to the lock so others can edit that area as well. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons.rttex",
    imagePos: { x: 0, y: 4 },
    cost: 500,
    tab: "locks",
    items: [{ id: 206, amount: 1 }],
  },
  {
    name: "builders_lock",
    title: "`oBuilder's Lock``",
    description:
      "`2You Get:`` 1 Builders Lock.<CR><CR>`5Description:`` Protect up to `$200`` tiles. Wrench the lock to limit it - it can either only allow building, or only allow breaking! `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons17.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 50000,
    tab: "locks",
    items: [{ id: 4994, amount: 1 }],
  },
  {
    name: "upgrade_backpack",
    title: "`0Upgrade Backpack`` (`w10 Slots``)",
    description:
      "`2You Get:`` 10 Additional Backpack Slots.<CR><CR>`5Description:`` Sewing an extra pocket onto your backpack will allow you to store `$10`` additional item types.  How else are you going to fit all those toilets and doors?",
    image: "interface/large/store_buttons/store_buttons.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 0,
    tab: "locks",
    items: [{ id: 9412, amount: 10 }],
  },
  {
    name: "signal_jammer",
    title: "`oSignal Jammer``",
    description:
      "`2You Get:`` 1 Signal Jammer.<CR><CR>`5Description:`` Get off the grid! Install a `$Signal Jammer``! A single punch will cause it to whir to life, tireless hiding your world and its population from pesky snoopers - only those who know the world name will be able to enter. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons.rttex",
    imagePos: { x: 1, y: 6 },
    cost: 2000,
    tab: "locks",
    items: [{ id: 226, amount: 1 }],
  },
  {
    name: "zombie_jammer",
    title: "`oZombie Jammer``",
    description:
      "`2You Get:`` 1 Zombie Jammer.<CR><CR>`5Description:`` Got a parkour or race that you don't want slowed down? Turn this on and nobody can be infected by zombie bites in your world. It does not prevent direct infection by the g-Virus itself though. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons7.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 15000,
    tab: "locks",
    items: [{ id: 1278, amount: 1 }],
  },
  {
    name: "punch_jammer",
    title: "`oPunch Jammer``",
    description:
      "`2You Get:`` 1 Punch Jammer.<CR><CR>`5Description:`` Tired of getting bashed around? Set up a Punch Jammer in your world, and people won't be able to punch each other! Can be turned on and off as needed. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons7.rttex",
    imagePos: { x: 0, y: 4 },
    cost: 15000,
    tab: "locks",
    items: [{ id: 1276, amount: 1 }],
  },
  {
    name: "change_of_address",
    title: "`oChange of Address``",
    description:
      "`2You Get:`` 1 Change of Address.<CR><CR>`5Description:`` Don't like the name of your world? You can use up one of these to trade your world's name with the name of any other world that you own. You must have a `2World Lock`` in both worlds.",
    image: "interface/large/store_buttons/store_buttons12.rttex",
    imagePos: { x: 0, y: 6 },
    cost: 20000,
    tab: "locks",
    items: [{ id: 2580, amount: 1 }],
  },
  {
    name: "door_mover",
    title: "`oDoor Mover``",
    description:
      "`2You Get:`` 1 Door Mover.<CR><CR>`5Description:`` Unsatisfied with your world's layout?  This one-use device can be used to move the White Door to any new location in your world, provided there are 2 empty spaces for it to fit in. Disappears when used. `2Only usable on a world you have World Locked.``",
    image: "interface/large/store_buttons/store_buttons8.rttex",
    imagePos: { x: 0, y: 6 },
    cost: 5000,
    tab: "locks",
    items: [{ id: 1404, amount: 1 }],
  },
  {
    name: "vending_machine",
    title: "`oVending Machine``",
    description:
      "`2You Get:`` 1 Vending Machine.<CR><CR>`5Description:`` Tired of interacting with human beings? Try a Vending Machine! You can put a stack of items inside it, set a price in World Locks, and people can buy from the machine while you sit back and rake in the profits! `5It's a perma-item, is never lost when destroyed, and it is not available any other way.``",
    image: "interface/large/store_buttons/store_buttons13.rttex",
    imagePos: { x: 0, y: 6 },
    cost: 8000,
    tab: "locks",
    items: [{ id: 2978, amount: 1 }],
  },
  {
    name: "digivend_machine",
    title: "`oDigiVend Machine``",
    description:
      "`2You Get:`` 1 DigiVend Machine.<CR><CR>`5Description:`` Get with the times and go digital! This wired vending machine can connect its contents to Vending Hubs AND the multiversal economy.",
    image: "interface/large/store_buttons/store_buttons29.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 12000,
    tab: "locks",
    items: [{ id: 9268, amount: 1 }],
  },
  {
    name: "vending_hub",
    title: "`oVending Hub - Checkout Counter``",
    description:
      "`2You Get:`` 1 Vending Hub.<CR><CR>`5Description:`` Your one-stop shop! This vending hub will collect and display the contents of ALL DigiVends in its row or column!",
    image: "interface/large/store_buttons/store_buttons29.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 50000,
    tab: "locks",
    items: [{ id: 9270, amount: 1 }],
  },
  {
    name: "ectojuicer",
    title: "`oEctoJuicer``",
    description:
      "`2You Get:`` 1 EctoJuicer.<CR><CR>`5Description:`` Infuse your muscles with the unearthly might of the Other Side! This spectral potion gives you the strength to wring every last drop of ectoplasm from a defeated Boss Ghost, granting you an EXTRA Boss Goo after a successful banishing!",
    image: "interface/large/store_buttons/store_buttons20.rttex",
    imagePos: { x: 0, y: 0 },
    cost: 30000,
    tab: "locks",
    items: [{ id: 6096, amount: 1 }],
  },
  {
    name: "grow_spray_5_pack",
    title: "`o5-pack of Grow Spray Fertilizer``",
    description:
      "`2You Get:`` 5 Grow Spray Fertilizers.<CR><CR>`5Description:`` Why wait?!  Treat yourself to a `$5-pack`` of amazing `wGrow Spray Fertilizer`` by GrowTech Corp.  Each bottle instantly ages a tree by `$1 hour``.",
    image: "interface/large/store_buttons/store_buttons.rttex",
    imagePos: { x: 0, y: 6 },
    cost: 200,
    tab: "locks",
    items: [{ id: 228, amount: 5 }],
  },
  {
    name: "deluxe_grow_spray",
    title: "`oDeluxe Grow Spray``",
    description:
      "`2You Get:`` 1 Deluxe Grow Spray.<CR><CR>`5Description:`` GrowTech's new `$Deluxe`` `wGrow Spray`` instantly ages a tree by `$24 hours`` per bottle!",
    image: "interface/large/store_buttons/store_buttons11.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 900,
    tab: "locks",
    items: [{ id: 1778, amount: 1 }],
  },
  {
    name: "fish_flakes",
    title: "`oFish Flakes``",
    description:
      "`2You Get:`` 5 Fish Flakes.<CR><CR>`5Description:`` Every fish adores these tasty flakes! Give a pinch to your Training Fish and fill their scaly bellies with aquatic goodness!",
    image: "interface/large/store_buttons/store_buttons18.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 7500,
    tab: "locks",
    items: [{ id: 5536, amount: 5 }],
  },
  {
    name: "fish_medicine",
    title: "`oFish Medicine``",
    description:
      "`2You Get:`` 1 Fish Medicine.<CR><CR>`5Description:`` Make a sick Training Fish bright and healthy with this healing potion.",
    image: "interface/large/store_buttons/store_buttons18.rttex",
    imagePos: { x: 0, y: 0 },
    cost: 1500,
    tab: "locks",
    items: [{ id: 5532, amount: 1 }],
  },
  {
    name: "fish_reviver",
    title: "`oFish Reviver``",
    description:
      "`2You Get:`` 1 `#Rare Fish Reviver``.<CR><CR>`5Description:`` Resurrect a dead Training Fish with a revivifying zap from this `#Rare`` Fish Reviver!",
    image: "interface/large/store_buttons/store_buttons18.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 5000,
    tab: "locks",
    items: [{ id: 5534, amount: 1 }],
  },

  // ── ITEM PACKS (itempack_menu) ───────────────────────────────────────────────
  {
    name: "small_seed_pack",
    title: "`oSmall Seed Pack``",
    description:
      "`2You Get:`` 1 Small Seed Pack.<CR><CR>`5Description:`` Contains one Small Seed Pack. Open it for `$5`` randomly chosen seeds, including 1 rare seed! Who knows what you'll get?!",
    image: "interface/large/store_buttons/store_buttons.rttex",
    imagePos: { x: 1, y: 4 },
    cost: 100,
    tab: "itempack",
    items: [{ id: 5706, amount: 1 }],
  },
  {
    name: "small_seed_pack_collection",
    title: "`oSmall Seed Pack Collection``",
    description:
      "`2You Get:`` 10 Small Seed Packs.<CR><CR>`5Description:`` Open each one for `$5`` randomly chosen seeds apiece, including 1 rare seed per pack!",
    image: "interface/large/store_buttons/store_buttons18.rttex",
    imagePos: { x: 0, y: 4 },
    cost: 1000,
    tab: "itempack",
    items: [{ id: 5706, amount: 10 }],
  },
  {
    name: "basic_splice",
    title: "`oBasic Splicing Kit``",
    description:
      "`2You Get:`` 10 Rock Seeds and 10 Random Seeds of Rarity 2.<CR><CR>`5Description:`` The basic seeds every farmer needs.",
    image: "interface/large/store_buttons/store_buttons2.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 200,
    tab: "itempack",
    items: [
      { id: 11, amount: 10 },
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
    ],
  },
  {
    name: "rare_seed",
    title: "`oRare Seed Pack``",
    description:
      "`2You Get:`` 5 Randomly Chosen Rare Seeds.<CR><CR>`5Description:`` Expect some wondrous crops with these!",
    image: "interface/large/store_buttons/store_buttons.rttex",
    imagePos: { x: 1, y: 7 },
    cost: 1000,
    tab: "itempack",
    items: [
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
      "random_seed_rarity2",
    ],
  },
  {
    name: "bountiful_seed_pack",
    title: "`oBountiful Seed Pack``",
    description:
      "`2You Get:`` 1 Bountiful Seed Pack.<CR><CR>`5Description:`` Contains `$5`` randomly chosen bountiful seeds, including 1 rare seed!",
    image: "interface/large/store_buttons/store_buttons28.rttex",
    imagePos: { x: 0, y: 4 },
    cost: 1000,
    tab: "itempack",
    items: [{ id: 8970, amount: 1 }],
  },
  {
    name: "door_and_sign_hello_pack",
    title: "`oDoor And Sign Hello Pack``",
    description:
      "`2You Get:`` 1 Door and 1 Sign.<CR><CR>`5Description:`` Own your very own door and sign! Leave cryptic messages and create a door that can open to, well, anywhere.",
    image: "interface/large/store_buttons/store_buttons.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 15,
    tab: "itempack",
    items: [
      { id: 12, amount: 1 },
      { id: 20, amount: 1 },
    ],
  },
  {
    name: "clothes_pack",
    title: "`oClothes Pack``",
    description:
      "`2You Get:`` 3 Randomly Wearable Items.<CR><CR>`5Description:`` Why not look the part? Some may even have special powers...",
    image: "interface/large/store_buttons/store_buttons2.rttex",
    imagePos: { x: 0, y: 0 },
    cost: 50,
    tab: "itempack",
    items: [
      "random_clothing_common",
      "random_clothing_common",
      "random_clothing_common",
    ],
  },
  {
    name: "rare_clothes_pack",
    title: "`oRare Clothes Pack``",
    description:
      "`2You Get:`` 3 Randomly Chosen Wearable Items.<CR><CR>`5Description:`` Enjoy the garb of kings! Some may even have special powers...",
    image: "interface/large/store_buttons/store_buttons2.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 500,
    tab: "itempack",
    items: [
      "random_clothing_rare",
      "random_clothing_rare",
      "random_clothing_rare",
    ],
  },

  // ── AWESOME ITEMS (bigitems_menu) ────────────────────────────────────────────
  {
    name: "turtle_hat",
    title: "`oTurtle Hat``",
    description:
      "`2You Get:`` 1 Turtle Hat.<CR><CR>`5Description:`` It's the greatest hat ever. It bloops out bubbles as you run! `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons3.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 25000,
    tab: "bigitems",
    items: [{ id: 574, amount: 1 }],
  },
  {
    name: "tiny_horsie",
    title: "`oTiny Horsie``",
    description:
      "`2You Get:`` 1 Tiny Horsie.<CR><CR>`5Description:`` Tired of wearing shoes? Wear a Tiny Horsie instead! It lets you run around faster than normal. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons3.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 25000,
    tab: "bigitems",
    items: [{ id: 592, amount: 1 }],
  },
  {
    name: "star_ship",
    title: "`oPleiadian Star Ship``",
    description:
      "`2You Get:`` 1 Pleiadian Star Ship.<CR><CR>`5Description:`` Float on, my brother. It's all groovy. This star ship can't fly, but you can still zoom around in it, leaving a trail of energy rings and moving at enhanced speed. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons4.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 25000,
    tab: "bigitems",
    items: [{ id: 760, amount: 1 }],
  },
  {
    name: "infernal_shades",
    title: "`oInfernal Shades``",
    description:
      "`2You Get:`` 1 Infernal Shades.<CR><CR>`5Description:`` Head into town with hottest shades out right now... literally. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons38.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 25000,
    tab: "bigitems",
    items: [{ id: 12474, amount: 1 }],
  },
  {
    name: "dragon_hand",
    title: "`oDragon Hand``",
    description:
      "`2You Get:`` 1 Dragon Hand.<CR><CR>`5Description:`` Call forth the dragons of legend! With the Dragon Hand, you will command your own pet dragon. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons5.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 50000,
    tab: "bigitems",
    items: [{ id: 900, amount: 1 }],
  },
  {
    name: "corvette",
    title: "`oLittle Red Corvette``",
    description:
      "`2You Get:`` 1 Little Red Corvette.<CR><CR>`5Description:`` Cruise around the neighborhood in style with this sweet convertible. It moves at enhanced speed. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons6.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 25000,
    tab: "bigitems",
    items: [{ id: 766, amount: 1 }],
  },
  {
    name: "stick_horse",
    title: "`oStick Horse``",
    description:
      "`2You Get:`` 1 Stick Horse.<CR><CR>`5Description:`` Nobody looks cooler than a person bouncing along on a stick with a fake horse head attached. NOBODY. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons6.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 25000,
    tab: "bigitems",
    items: [{ id: 1012, amount: 1 }],
  },
  {
    name: "ambulance",
    title: "`oAmbulance``",
    description:
      "`2You Get:`` 1 Ambulance.<CR><CR>`5Description:`` Rush to the scene of an accident while lawyers chase you in this speedy rescue vehicle. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons7.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 25000,
    tab: "bigitems",
    items: [{ id: 1272, amount: 1 }],
  },
  {
    name: "raptor",
    title: "`oRiding Raptor``",
    description:
      "`2You Get:`` 1 Riding Raptor.<CR><CR>`5Description:`` Long thought to be extinct, it turns out these dinosaurs are easily tamed and riding one lets you run around faster! `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons7.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 25000,
    tab: "bigitems",
    items: [{ id: 1320, amount: 1 }],
  },
  {
    name: "owl",
    title: "`oMid-Pacific Owl``",
    description:
      "`2You Get:`` 1 Mid-Pacific Owl.<CR><CR>`5Description:`` This owl is a bit lazy - if you stop moving around, he'll land on your head and fall asleep. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons10.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 30000,
    tab: "bigitems",
    items: [{ id: 1540, amount: 1 }],
  },
  {
    name: "unicorn",
    title: "`oUnicorn Garland``",
    description:
      "`2You Get:`` 1 Unicorn Garland.<CR><CR>`5Description:`` Prance about in the fields with your very own pet unicorn! It shoots `1R`2A`3I`4N`5B`6O`7W`8S``. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons10.rttex",
    imagePos: { x: 0, y: 4 },
    cost: 50000,
    tab: "bigitems",
    items: [{ id: 1648, amount: 1 }],
  },
  {
    name: "starboard",
    title: "`oStarBoard``",
    description:
      "`2You Get:`` 1 StarBoard.<CR><CR>`5Description:`` Hoverboards are here at last! Zoom around Growtopia on this brand new model, which is powered by fusion energy. Moves faster than walking. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons11.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 30000,
    tab: "bigitems",
    items: [{ id: 1740, amount: 1 }],
  },
  {
    name: "motorcycle",
    title: "`oGrowley Motorcycle``",
    description:
      "`2You Get:`` 1 Growley Motorcycle.<CR><CR>`5Description:`` The coolest motorcycles available are Growley Dennisons. It even moves faster than walking. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons11.rttex",
    imagePos: { x: 0, y: 6 },
    cost: 50000,
    tab: "bigitems",
    items: [{ id: 1950, amount: 1 }],
  },
  {
    name: "geiger",
    title: "`oGeiger Counter``",
    description:
      "`2You Get:`` 1 Geiger Counter.<CR><CR>`5Description:`` With this fantabulous device, you can detect radiation around you. `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons12.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 25000,
    tab: "bigitems",
    items: [{ id: 2204, amount: 1 }],
  },
  {
    name: "monkey_on_back",
    title: "`oMonkey On Your Back``",
    description:
      "`2You Get:`` 1 Monkey On Your Back.<CR><CR>`5Description:`` Most people work really hard to get rid of these, but hey, if you want one, it's available! `4But not available any other way!``",
    image: "interface/large/store_buttons/store_buttons13.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 50000,
    tab: "bigitems",
    items: [{ id: 2900, amount: 1 }],
  },
  {
    name: "carrot_sword",
    title: "`oCarrot Sword``",
    description:
      "`2You Get:`` 1 Carrot Sword.<CR><CR>`5Description:`` Razor sharp, yet oddly tasty. This can carve bunny symbols into your foes! `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons13.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 15000,
    tab: "bigitems",
    items: [{ id: 2908, amount: 1 }],
  },
  {
    name: "red_bicycle",
    title: "`oRed Bicycle``",
    description:
      "`2You Get:`` 1 Red Bicycle.<CR><CR>`5Description:`` It's the environmentally friendly way to get around! `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons13.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 30000,
    tab: "bigitems",
    items: [{ id: 2974, amount: 1 }],
  },
  {
    name: "fire_truck",
    title: "`oFire Truck``",
    description:
      "`2You Get:`` 1 Fire Truck.<CR><CR>`5Description:`` Race to the scene of the fire in this speedy vehicle! `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons14.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 50000,
    tab: "bigitems",
    items: [{ id: 3068, amount: 1 }],
  },
  {
    name: "pet_slime",
    title: "`oPet Slime``",
    description:
      "`2You Get:`` 1 Pet Slime.<CR><CR>`5Description:`` What could be better than a blob of greasy slime that follows you around and spits corrosive acid, melting blocks more quickly! `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons14.rttex",
    imagePos: { x: 0, y: 4 },
    cost: 100000,
    tab: "bigitems",
    items: [{ id: 3166, amount: 1 }],
  },
  {
    name: "silkworm",
    title: "`oSilkworm``",
    description:
      "`2You Get:`` 1 Silk Worm.<CR><CR>`5Description:`` It's the newest cuddly pet from Growtech Pharma! They'll eat almost any food, but don't forget to give them water too! `4Not available any other way``.`6Warning:`` `9Silkworms are living creatures. They will not live forever!``",
    image: "interface/large/store_buttons/store_buttons14.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 7000,
    tab: "bigitems",
    items: [{ id: 3316, amount: 1 }],
  },
  {
    name: "antigravity_generator",
    title: "`oAntigravity Generator``",
    description:
      "`2You Get:`` 1 Antigravity Generator.<CR><CR>`5Description:`` Disables gravity in your world when activated! `5It's a perma-item - never lost when destroyed! `4Not available any other way!````",
    image: "interface/large/store_buttons/store_buttons17.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 450000,
    tab: "bigitems",
    items: [{ id: 4992, amount: 1 }],
  },
  {
    name: "dabstep_shoes",
    title: "`oDabstep Low Top Sneakers``",
    description:
      "`2You Get:`` 1 Dabstep Low Top Sneakers.<CR><CR>`5Description:`` Light up every footfall and move to a better beat with these dabulous shoes! `4Not available any other way!``",
    image: "interface/large/store_buttons/store_buttons21.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 30000,
    tab: "bigitems",
    items: [{ id: 6780, amount: 1 }],
  },
  {
    name: "building_blocks_machine",
    title: "`oBuilding Blocks Machine``",
    description:
      "`2You Get:`` 1 Building Blocks Machine.<CR><CR>`5Description:`` Pop this beauty in your world and it'll start cranking out awesome blocks in no time!",
    image: "interface/large/store_buttons/store_buttons26.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 8000,
    tab: "bigitems",
    items: [{ id: 8196, amount: 1 }],
  },
  {
    name: "transmutation_device",
    title: "`oTransmutabooth``",
    description:
      "`2You Get:`` 1 Transmutabooth.<CR><CR>`5Description:`` A wondrous technological achievement that allows you to merge clothing items, transferring the visual appearance of one onto another in the same slot!",
    image: "interface/large/store_buttons/store_buttons27.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 25000,
    tab: "bigitems",
    items: [{ id: 9170, amount: 1 }],
  },

  // ── WEATHER MACHINES (weather_menu) ──────────────────────────────────────────
  {
    name: "weather_sunny",
    title: "`oWeather Machine - Sunny``",
    description:
      "`2You Get:`` 1 Weather Machine - Sunny.<CR><CR>`5Description:`` Restore the default Growtopia sky! `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons5.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 1000,
    tab: "weather",
    items: [{ id: 932, amount: 1 }],
  },
  {
    name: "weather_night",
    title: "`oWeather Machine - Night``",
    description:
      "`2You Get:`` 1 Weather Machine - Night.<CR><CR>`5Description:`` This will turn the background of your world into a lovely night scene with stars and moon. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons5.rttex",
    imagePos: { x: 0, y: 6 },
    cost: 10000,
    tab: "weather",
    items: [{ id: 934, amount: 1 }],
  },
  {
    name: "weather_arid",
    title: "`oWeather Machine - Arid``",
    description:
      "`2You Get:`` 1 Weather Machine - Arid.<CR><CR>`5Description:`` Want your world to look like a cartoon desert? `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons5.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 10000,
    tab: "weather",
    items: [{ id: 946, amount: 1 }],
  },
  {
    name: "weather_rainy",
    title: "`oWeather Machine - Rainy City``",
    description:
      "`2You Get:`` 1 Weather Machine - Rainy City.<CR><CR>`5Description:`` This will turn the background of your world into a dark, rainy city scene complete with sound effects. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons6.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 10000,
    tab: "weather",
    items: [{ id: 984, amount: 1 }],
  },
  {
    name: "weather_warp",
    title: "`oWeather Machine - Warp Speed``",
    description:
      "`2You Get:`` 1 Weather Machine - Warp Speed.<CR><CR>`5Description:`` This Weather Machine will launch your world through space at relativistic speeds. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons11.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 10000,
    tab: "weather",
    items: [{ id: 1750, amount: 1 }],
  },
  {
    name: "mars_blast",
    title: "`oMars Blast``",
    description:
      "`2You Get:`` 1 Mars Blast.<CR><CR>`5Description:`` Blast off to Mars! This powerful rocket ship will launch you to a new world set up like the surface of Mars.",
    image: "interface/large/store_buttons/store_buttons6.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 15000,
    tab: "weather",
    items: [{ id: 1136, amount: 1 }],
  },
  {
    name: "thermo_blast",
    title: "`oThermonuclear Blast``",
    description:
      "`2You Get:`` 1 Thermonuclear Blast.<CR><CR>`5Description:`` This supervillainous device will blast you to a new world that has been scoured completely empty - nothing but Bedrock and a White Door.",
    image: "interface/large/store_buttons/store_buttons8.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 15000,
    tab: "weather",
    items: [{ id: 1402, amount: 1 }],
  },
  {
    name: "undersea_blast",
    title: "`oUndersea Blast``",
    description:
      "`2You Get:`` 1 Undersea Blast.<CR><CR>`5Description:`` Explore the ocean! This advanced device will terraform a new world set up like the bottom of the ocean.",
    image: "interface/large/store_buttons/store_buttons9.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 15000,
    tab: "weather",
    items: [{ id: 1532, amount: 1 }],
  },
  {
    name: "cave_blast",
    title: "`oCave Blast``",
    description:
      "`2You Get:`` 1 Cave Blast.<CR><CR>`5Description:`` This explosive device will punch a hole in the ground, giving you a dark cavern to explore. There are even rumors of treasure hidden deep in the caves...",
    image: "interface/large/store_buttons/store_buttons15.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 30000,
    tab: "weather",
    items: [{ id: 3562, amount: 1 }],
  },
  {
    name: "weather_stuff",
    title: "`oWeather Machine - Stuff``",
    description:
      "`2You Get:`` 1 Weather Machine - Stuff.<CR><CR>`5Description:`` This is the most fun weather imaginable - Choose any item from your inventory, adjust some settings, and watch it rain down from the sky! `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons15.rttex",
    imagePos: { x: 0, y: 6 },
    cost: 50000,
    tab: "weather",
    items: [{ id: 3832, amount: 1 }],
  },
  {
    name: "weather_jungle",
    title: "`oWeather Machine - Jungle``",
    description:
      "`2You Get:`` 1 Weather Machine - Jungle.<CR><CR>`5Description:`` This weather machine will turn the background of your world into a steamy jungle. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons16.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 20000,
    tab: "weather",
    items: [{ id: 4776, amount: 1 }],
  },
  {
    name: "weather_backgd",
    title: "`oWeather Machine - Background``",
    description:
      "`2You Get:`` 1 Weather Machine - Background.<CR><CR>`5Description:`` This amazing device can scan any Background Block, and will make your entire world look like it's been filled with that block. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons17.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 150000,
    tab: "weather",
    items: [{ id: 5000, amount: 1 }],
  },
  {
    name: "starship_blast",
    title: "`oImperial Starship Blast``",
    description:
      "`2You Get:`` 1 Imperial Starship Blast.<CR><CR>`5Description:`` Command your very own Starship and explore the cosmos! This blast contains one of 3 possible Imperial ship types.",
    image: "interface/large/store_buttons/store_buttons21.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 10000,
    tab: "weather",
    items: [{ id: 6420, amount: 1 }],
  },
  {
    name: "digital_rain_weather",
    title: "`oWeather Machine - Digital Rain``",
    description:
      "`2You Get:`` 1 Weather Machine - Digital Rain.<CR><CR>`5Description:`` Splash the scrolling code of creation across the skies of your worlds. `5It's a perma-item, is never lost when destroyed.``",
    image: "interface/large/store_buttons/store_buttons22.rttex",
    imagePos: { x: 0, y: 6 },
    cost: 30000,
    tab: "weather",
    items: [{ id: 6854, amount: 1 }],
  },
  {
    name: "treasure_blast",
    title: "`oTreasure Blast``",
    description:
      "`2You Get:`` 1 Treasure Blast.<CR><CR>`5Description:`` Enter a world of snow-capped peaks and long-forgotten mysteries! Riddles and secrets - and a ton of treasure - await those who brave this blast's blocks!",
    image: "interface/large/store_buttons/store_buttons26.rttex",
    imagePos: { x: 0, y: 6 },
    cost: 10000,
    tab: "weather",
    items: [{ id: 7588, amount: 1 }],
  },
  {
    name: "surg_blast",
    title: "`oSurgWorld Blast``",
    description:
      "`2You Get:`` 1 SurgWorld Blast, 1 Caduceaxe and 1 Reception Desk.<CR><CR>`5Description:`` Your gateway to a world of medical wonders!",
    image: "interface/large/store_buttons/store_buttons27.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 15000,
    tab: "weather",
    items: [{ id: 8556, amount: 1 }],
  },
  {
    name: "bountiful_blast",
    title: "`oBountiful Blast``",
    description:
      "`2You Get:`` 1 Bountiful Blast.<CR><CR>`5Description:`` Enter a world of fertile soil, cheerful sunshine and lush green hills, and bountiful new trees!",
    image: "interface/large/store_buttons/store_buttons27.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 5000,
    tab: "weather",
    items: [{ id: 8738, amount: 1 }],
  },
  {
    name: "infinity_weather_machine",
    title: "`oInfinity Weather Machine``",
    description:
      "`2You Get:`` 1 Infinity Weather Machine.<CR><CR>`5Description:`` Add multiple Weather Machines to this machine and have them play on a loop, like a weather mix tape!",
    image: "interface/large/store_buttons/store_buttons32.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 50000,
    tab: "weather",
    items: [{ id: 10058, amount: 1 }],
  },

  // ── GROWTOKENS (token_menu) ──────────────────────────────────────────────────
  {
    name: "challenge_timer",
    title: "`oChallenge Timer``",
    description:
      "`2You Get:`` 1 Challenge Timer.<CR><CR>`5Description:`` Get more people playing your parkours with this secure prize system. Stock prizes into the Challenge Timer, set a time limit, and watch as players race from start to end.",
    image: "interface/large/store_buttons/store_buttons15.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 5,
    tab: "token",
    items: [{ id: 3804, amount: 1 }],
  },
  {
    name: "xp_potion",
    title: "`oExperience Potion``",
    description:
      "`2You Get:`` 1 Experience Potion.<CR><CR>`5Description:`` This `#Untradeable`` delicious fizzy drink will make you smarter! 10,000 XP smarter instantly, to be exact.",
    image: "interface/large/store_buttons/store_buttons9.rttex",
    imagePos: { x: 0, y: 2 },
    cost: 10,
    tab: "token",
    items: [{ id: 1488, amount: 1 }],
  },
  {
    name: "growmoji_pack",
    title: "`oGrowmoji Mystery Box``",
    description:
      "`2You Get:`` 1 Growmoji.<CR><CR>`5Description:`` Express yourself! This mysterious box contains one of six fun growmojis you can use to spice up your chat!",
    image: "interface/large/store_buttons/store_buttons19.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 15,
    tab: "token",
    items: [{ id: 5, amount: 1 }],
  },
  {
    name: "mini_mod",
    title: "`oMini-Mod``",
    description:
      "`2You Get:`` 1 Mini-Mod.<CR><CR>`5Description:`` Oh no, it's a Mini-Mod! Punch him to activate. When activated, he won't allow anyone to drop items in your world.",
    image: "interface/large/store_buttons/store_buttons17.rttex",
    imagePos: { x: 0, y: 0 },
    cost: 20,
    tab: "token",
    items: [{ id: 4758, amount: 1 }],
  },
  {
    name: "derpy_star",
    title: "`oDerpy Star Block``",
    description:
      "`2You Get:`` 1 Derpy Star Block.<CR><CR>`5Description:`` DER IM A SUPERSTAR. This is a fairly ordinary block, except for the derpy star on it.",
    image: "interface/large/store_buttons/store_buttons10.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 30,
    tab: "token",
    items: [{ id: 1628, amount: 1 }],
  },
  {
    name: "growtoken_shades",
    title: "`oGrowtoken Shades``",
    description:
      "`2You Get:`` 1 Growtoken Shades.<CR><CR>`5Description:`` It's all about the Growtokens, Growtokens, Growtokens!",
    image: "interface/large/store_buttons/store_buttons40.rttex",
    imagePos: { x: 1, y: 1 },
    cost: 40,
    tab: "token",
    items: [{ id: 13362, amount: 1 }],
  },
  {
    name: "dirt_gun",
    title: "`oBLYoshi's Free Dirt``",
    description:
      "`2You Get:`` 1 BLYoshi's Free Dirt.<CR><CR>`5Description:`` Once you buy this deadly rifle, you can spew out all the dirt you want for free!",
    image: "interface/large/store_buttons/store_buttons13.rttex",
    imagePos: { x: 0, y: 4 },
    cost: 40,
    tab: "token",
    items: [{ id: 2876, amount: 1 }],
  },
  {
    name: "nothingness",
    title: "`oWeather Machine - Nothingness``",
    description:
      "`2You Get:`` 1 Weather Machine - Nothingness.<CR><CR>`5Description:`` This machine will turn your world completely black. Yup, that's it.",
    image: "interface/large/store_buttons/store_buttons9.rttex",
    imagePos: { x: 0, y: 3 },
    cost: 50,
    tab: "token",
    items: [{ id: 1490, amount: 1 }],
  },
  {
    name: "spike_juice",
    title: "`oSpike Juice``",
    description:
      "`2You Get:`` 1 Spike Juice.<CR><CR>`5Description:`` Drinking this `#Untradeable`` one-use potion will make you immune to Death Spikes and Lava for 5 seconds.",
    image: "interface/large/store_buttons/store_buttons10.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 60,
    tab: "token",
    items: [{ id: 1662, amount: 1 }],
  },
  {
    name: "crystal_cape",
    title: "`oCrystal Cape``",
    description:
      "`2You Get:`` 1 Crystal Cape.<CR><CR>`5Description:`` This cape is woven of pure crystal. It lets you double-jump off of an imaginary Crystal Block in mid-air.",
    image: "interface/large/store_buttons/store_buttons11.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 90,
    tab: "token",
    items: [{ id: 1738, amount: 1 }],
  },
  {
    name: "focused_eyes",
    title: "`oFocused Eyes``",
    description:
      "`2You Get:`` 1 Focused Eyes.<CR><CR>`5Description:`` This `#Untradeable`` item lets you shoot electricity from your eyes!",
    image: "interface/large/store_buttons/store_buttons9.rttex",
    imagePos: { x: 0, y: 4 },
    cost: 100,
    tab: "token",
    items: [{ id: 1204, amount: 1 }],
  },
  {
    name: "grip_tape",
    title: "`oGrip Tape``",
    description:
      "`2You Get:`` 1 Grip Tape.<CR><CR>`5Description:`` This is handy for wrapping around the handle of a weapon or tool. It can improve your grip.",
    image: "interface/large/store_buttons/store_buttons14.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 100,
    tab: "token",
    items: [{ id: 3248, amount: 1 }],
  },
  {
    name: "cat_eyes",
    title: "`oCat Eyes``",
    description:
      "`2You Get:`` 1 Cat Eyes.<CR><CR>`5Description:`` Wow, pawesome! These new eyes are the cat's meow, and the purrfect addition to any style.",
    image: "interface/large/store_buttons/store_buttons23.rttex",
    imagePos: { x: 0, y: 5 },
    cost: 100,
    tab: "token",
    items: [{ id: 7106, amount: 1 }],
  },
  {
    name: "muddy_pants",
    title: "`oMuddy Pants``",
    description:
      "`2You Get:`` 1 Muddy Pants.<CR><CR>`5Description:`` Well, this is just a pair of muddy pants. But it does come with a super secret bonus surprise!",
    image: "interface/large/store_buttons/store_buttons12.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 125,
    tab: "token",
    items: [{ id: 2584, amount: 1 }],
  },
  {
    name: "piranha",
    title: "`oCuddly Piranha``",
    description:
      "`2You Get:`` 1 Cuddly Piranha.<CR><CR>`5Description:`` This friendly pet piranha won't stay in its bowl!  It just wants to snuggle with your face!",
    image: "interface/large/store_buttons/store_buttons10.rttex",
    imagePos: { x: 0, y: 0 },
    cost: 150,
    tab: "token",
    items: [{ id: 1534, amount: 1 }],
  },
  {
    name: "puddy_leash",
    title: "`oPuddy Leash``",
    description:
      "`2You Get:`` 1 Puddy Leash.<CR><CR>`5Description:`` Puddy is a friendly little kitten who will follow you around forever.",
    image: "interface/large/store_buttons/store_buttons11.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 180,
    tab: "token",
    items: [{ id: 2032, amount: 1 }],
  },
  {
    name: "golden_axe",
    title: "`oGolden Pickaxe``",
    description:
      "`2You Get:`` 1 Golden Pickaxe.<CR><CR>`5Description:`` Get your own sparkly pickaxe! This `#Untradeable`` item is a status symbol!",
    image: "interface/large/store_buttons/store_buttons9.rttex",
    imagePos: { x: 0, y: 1 },
    cost: 200,
    tab: "token",
    items: [{ id: 1438, amount: 1 }],
  },
  {
    name: "puppy_leash",
    title: "`oPuppy Leash``",
    description:
      "`2You Get:`` 1 Puppy Leash.<CR><CR>`5Description:`` Get your own pet puppy! This little dog will follow you around forever, never wavering in her loyalty, thus making her `#Untradeable``.",
    image: "interface/large/store_buttons/store_buttons11.rttex",
    imagePos: { x: 0, y: 4 },
    cost: 200,
    tab: "token",
    items: [{ id: 1742, amount: 1 }],
  },
  {
    name: "diggers_spade",
    title: "`oDigger's Spade``",
    description:
      "`2You Get:`` 1 Digger's Spade.<CR><CR>`5Description:`` This may appear to be a humble shovel, but it can smash Dirt or Cave Background in a single hit! Note: The spade is `#UNTRADEABLE``.",
    image: "interface/large/store_buttons/store_buttons13.rttex",
    imagePos: { x: 0, y: 7 },
    cost: 200,
    tab: "token",
    items: [{ id: 2952, amount: 1 }],
  },
  {
    name: "meow_ears",
    title: "`oMeow Ears``",
    description:
      "`2You Get:`` 1 Meow Ears.<CR><CR>`5Description:`` Meow's super special ears that everyone can now get! Note: These ears are `#UNTRADEABLE``.",
    image: "interface/large/store_buttons/store_buttons22.rttex",
    imagePos: { x: 0, y: 0 },
    cost: 200,
    tab: "token",
    items: [{ id: 698, amount: 1 }],
  },
];

// Pre-compute a lookup map from item name to StoreItem for O(1) purchase lookups
const STORE_ITEM_MAP = new Map<string, StoreItem>(
  STORE_ITEMS.map((i) => [i.name, i]),
);

const TAB_LABELS: Record<string, string> = {
  main: "Home",
  locks: "Locks And Stuff",
  itempack: "Item Packs",
  bigitems: "Awesome Items",
  weather: "Weather Machines",
  token: "Growtoken Items",
};

const VALID_TABS = new Set([
  "main",
  "locks",
  "itempack",
  "bigitems",
  "weather",
  "token",
]);

export class StoreBuy {
  constructor(
    public base: Base,
    public peer: Peer,
  ) {}

  private createTabButtons(activeTab: string): string {
    return TABS.map((tab) => {
      const isActive =
        tab.id === `${activeTab}_menu` ||
        (tab.id === "main_menu" && activeTab === "main")
          ? 1
          : 0;
      return `add_tab_button|${tab.id}|${tab.label}|interface/large/btn_shop.rttex||${isActive}|${tab.position}|0|0||||-1|-1|||0|0|CustomParams:|\n`;
    }).join("");
  }

  public createMainDialog(): string {
    return this.createStoreDialog("main");
  }

  public createStoreDialog(activeTab: string): string {
    const tabItems = STORE_ITEMS.filter((i) => i.tab === activeTab);
    const isTokenTab = activeTab === "token";

    let dialog = "";

    if (activeTab === "main") {
      dialog += `set_description_text|Welcome to the \`2Growtopia Store\`\`! Select the item you'd like more info on.\n`;
      dialog += "enable_tabs|1\n";
      dialog += this.createTabButtons(activeTab);
      // Featured header banner (⭐ Featured)
      dialog +=
        "add_banner|interface/large/gui_shop_featured_header.rttex|0|1|\n";
      // 3 featured items as normal store buttons (client lays them side-by-side)
      for (const item of tabItems) {
        dialog += `add_button|${item.name}|${item.title}|${item.image}|${item.description}|${item.imagePos.x}|${item.imagePos.y}|${item.cost}|0|||-1|-1||-1|-1||1||||||0|0|CustomParams:|\n`;
      }
      // "Get More Gems!" banner below the featured items
      dialog += "add_banner|interface/large/gui_store_title_gems.rttex|0|1|\n";
    } else {
      dialog += "enable_tabs|1\n";
      dialog += this.createTabButtons(activeTab);
      for (const item of tabItems) {
        const currencyFlag = isTokenTab ? 1 : 0;
        dialog += `add_button|${item.name}|${item.title}|${item.image}|${item.description}|${item.imagePos.x}|${item.imagePos.y}|${item.cost}|${currencyFlag}|||-1|-1||-1|-1||1||||||0|0|CustomParams:|\n`;
      }
    }

    return dialog;
  }

  /** Resolve random items for special pack types */
  private resolveItems(storeItem: StoreItem): { id: number; amount: number }[] {
    const result: { id: number; amount: number }[] = [];
    for (const entry of storeItem.items ?? []) {
      if (typeof entry === "object") {
        result.push(entry);
      } else if (entry === "random_seed_rarity2") {
        // rarity 2 seeds = item IDs that are odd (seeds) with rarity between 13-60
        const seeds = [...this.base.items.metadata.items.values()].filter(
          (it) =>
            (it.id ?? 0) % 2 === 1 &&
            (it.rarity ?? 0) >= 13 &&
            (it.rarity ?? 0) <= 60,
        );
        if (seeds.length) {
          const pick = seeds[Math.floor(Math.random() * seeds.length)];
          result.push({ id: pick.id as number, amount: 1 });
        }
      } else if (entry === "random_clothing_common") {
        const clothing = [...this.base.items.metadata.items.values()].filter(
          (it) => (it.type === 6 || it.type === 7) && (it.rarity ?? 99) <= 10,
        );
        if (clothing.length) {
          const pick = clothing[Math.floor(Math.random() * clothing.length)];
          result.push({ id: pick.id as number, amount: 1 });
        }
      } else if (entry === "random_clothing_rare") {
        const clothing = [...this.base.items.metadata.items.values()].filter(
          (it) =>
            (it.type === 6 || it.type === 7) &&
            (it.rarity ?? 0) >= 11 &&
            (it.rarity ?? 0) <= 60,
        );
        if (clothing.length) {
          const pick = clothing[Math.floor(Math.random() * clothing.length)];
          result.push({ id: pick.id as number, amount: 1 });
        }
      }
    }
    return result;
  }

  public async execute(
    action: NonEmptyObject<Record<string, string>>,
  ): Promise<void> {
    const raw = action.item as string;
    // Client sends tab IDs like "locks_menu" — strip the "_menu" suffix to get the tab key
    const selected = raw.endsWith("_menu") ? raw.slice(0, -5) : raw;

    if (VALID_TABS.has(selected)) {
      // Navigation: just open the tab
      const dialog = this.createStoreDialog(selected);
      const tokenCount =
        this.peer.data.inventory.items.find((i) => i.id === 1486)?.amount ?? 0;
      this.peer.send(
        Variant.from("OnSetVouchers", selected === "token" ? tokenCount : 0),
        Variant.from("OnStoreRequest", dialog),
      );
      return;
    }

    const storeItem = STORE_ITEM_MAP.get(selected);
    if (!storeItem) {
      // Unknown item — reopen main tab
      this.peer.send(
        Variant.from("OnStoreRequest", this.createStoreDialog("main")),
      );
      return;
    }

    // Check if player can afford it
    const isToken = storeItem.tab === "token";
    const playerGems = Number(this.peer.data.gems) || 0;
    const playerTokens = isToken
      ? (this.peer.data.inventory.items.find((i) => i.id === 1486)?.amount ?? 0)
      : 0;
    const canAfford = isToken
      ? playerTokens >= storeItem.cost
      : playerGems >= storeItem.cost;

    if (!canAfford) {
      const shortBy = isToken
        ? storeItem.cost - playerTokens
        : storeItem.cost - playerGems;
      const currency = isToken ? "`2Growtokens``" : "Gems";
      this.peer.send(
        Variant.from(
          "OnStorePurchaseResult",
          `You can't afford \`0${storeItem.title}\`\`!  You're \`$${shortBy}\`\` ${currency} short.`,
        ),
      );
      return;
    }

    // Resolve and give items
    const itemsToGive = this.resolveItems(storeItem);
    const receivedNames: string[] = [];

    for (const { id, amount } of itemsToGive) {
      this.peer.addItemInven(id, amount);
      const meta = this.base.items.metadata.items.get(id.toString());
      receivedNames.push(meta?.name ?? `Item #${id}`);
    }

    // Deduct cost
    if (isToken) {
      const tokenSlot = this.peer.data.inventory.items.find(
        (i) => i.id === 1486,
      );
      if (tokenSlot) tokenSlot.amount -= storeItem.cost;
    } else {
      this.peer.data.gems = playerGems - storeItem.cost;
      this.peer.setGems(this.peer.data.gems);
    }

    const gemsLeft = isToken
      ? (this.peer.data.inventory.items.find((i) => i.id === 1486)?.amount ?? 0)
      : this.peer.data.gems;
    const currency = isToken ? "`2Growtokens``" : "Gems";

    this.peer.send(
      Variant.from(
        "OnStorePurchaseResult",
        `You've purchased \`0${storeItem.title}\`\` for \`$${storeItem.cost}\`\` ${currency}.\nYou have \`$${gemsLeft}\`\` ${currency} left.\n\n\`5Received: \`\`\`0${receivedNames.join(", ")}\`\``,
      ),
    );

    // Reopen the tab dialog after purchase
    const dialog = this.createStoreDialog(storeItem.tab);
    this.peer.send(Variant.from("OnStoreRequest", dialog));

    this.peer.saveToCache();
    this.peer.saveToDatabase();
  }
}
