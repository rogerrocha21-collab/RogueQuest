
export type TileType = 'WALL' | 'FLOOR' | 'PLAYER' | 'ENEMY' | 'CHEST' | 'STAIRS' | 'POTION' | 'ITEM' | 'KEY' | 'MERCHANT' | 'EMPTY' | 'ALTAR' | 'EGG' | 'NPC';

export type LevelTheme = 'FOREST' | 'DESERT' | 'SNOW' | 'CAVE' | 'MATRIX' | 'INFERNO' | 'VOID' | 'RUINS' | 'MECHANICAL' | 'CORRUPTED' | 'CATACOMBS' | 'OSSUARY' | 'ASTRAL' | 'FURNACE' | 'SWAMP' | 'TEMPLE' | 'CHAOS' | 'HIVE';

export type Language = 'PT' | 'EN' | 'ES';

export interface Position {
  x: number;
  y: number;
}

export interface EntityStats {
  hp: number;
  maxHp: number;
  attack: number;
  armor: number;
  maxArmor: number;
  speed: number;
}

export interface Enemy extends Position {
  id: string;
  type: string;
  stats: EntityStats;
  isBoss?: boolean;
}

export interface Chest extends Position {
  id: string;
}

export interface ItemEntity extends Position {
  id: string;
  name: string;
  stat: keyof EntityStats;
  value: number;
  price?: number;
  tier?: number;
  iconType: 'sword' | 'shield' | 'boot' | 'heart' | 'zap';
}

export interface PotionEntity extends Position {
  id: string;
  percent: number;
  price?: number;
  type?: 'HEAL' | 'ANTIDOTE';
}

export interface Pet {
  type: 'CACHORRO' | 'LOBO' | 'URSO' | 'PUMA' | 'CORVO';
  name: string;
  hp: number;
  maxHp: number;
  pos: Position;
}

export interface Follower {
  id: string;
  type: 'PRISONER' | 'KNIGHT';
  name: string;
  pos: Position;
  levelsRemaining: number;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface AltarEffect {
  id: string;
  type: 'BLESSING' | 'CURSE';
  nameKey: string;
  descKey: string;
}

export interface PoisonStatus {
  damagePerTurn: number;
  turnsRemaining: number;
  type: 'WEAK' | 'STRONG';
}

export type TrapType = 'SPIKE' | 'POISON' | 'ALARM' | 'EXPLOSIVE';

export interface Trap extends Position {
  id: string;
  type: TrapType;
  triggered: boolean;
  revealed: boolean;
}

export type NPCType = 'MERCHANT_WOUNDED' | 'PRISONER' | 'ALCHEMIST' | 'IDOL' | 'KNIGHT' | 'CHILD' | 'CARTOGRAPHER' | 'VOICE' | 'GUARD';

export interface NPC extends Position {
  id: string;
  type: NPCType;
}

export interface NPCFlags {
  merchantDiscount?: boolean; // 50% off
  merchantTax?: boolean; // +50% cost
  moreEnemies?: boolean; // Spawns more enemies
  knightQuestActive?: boolean; // Need to kill 3 enemies
  knightQuestKills?: number;
  activeBuff?: { type: 'SHIELD' | 'ATTACK', value: number, duration: number, name: string };
  activeDebuff?: { type: 'CURSE', name: string, duration: number }; // Generic curse
}

export interface GameState {
  version?: string;
  playerName: string;
  gold: number;
  level: number;
  theme: LevelTheme;
  playerPos: Position;
  playerStats: EntityStats;
  map: TileType[][];
  enemies: Enemy[];
  chests: Chest[];
  potions: PotionEntity[];
  items: ItemEntity[];
  traps: Trap[];
  npcs: NPC[]; // Lista de NPCs no mapa
  merchantPos?: Position;
  altarPos?: Position;
  keyPos?: Position;
  eggPos?: Position;
  isCrowUnlocked: boolean;
  crowPos?: Position;
  activeFollower?: Follower; // Seguidor humano (Prisioneira/Cavaleiro)
  npcFlags: NPCFlags; // Estado persistente de escolhas
  hasKey: boolean;
  enemiesKilledInLevel: number;
  stairsPos: Position;
  gameStatus: 'START_SCREEN' | 'TUTORIAL' | 'PLAYING' | 'COMBAT' | 'CHEST_OPEN' | 'MERCHANT_SHOP' | 'WON' | 'LOST' | 'NEXT_LEVEL' | 'PICKUP_CHOICE' | 'RELIC_SELECTION' | 'ALTAR_INTERACTION' | 'ALTAR_RESULT' | 'EGG_INTERACTION' | 'REWARD_SUCCESS' | 'NPC_INTERACTION';
  currentEnemy?: Enemy;
  currentPotion?: PotionEntity;
  activeNPC?: NPC; // NPC sendo interagido
  logs: string[];
  tronModeActive?: boolean;
  tronTimeLeft?: number;
  tronTrail?: Position[];
  activePet?: Pet;
  language?: Language;
  inventory: PotionEntity[];
  inventorySize: number;
  activeRelic?: Relic;
  relicOptions?: Relic[];
  lastStats?: EntityStats;
  activeAltarEffect?: AltarEffect;
  hasUsedAltarInLevel: boolean;
  keyPath?: Position[];
  hasCompass?: boolean;
  hasMap?: boolean;
  compassPath?: Position[];
  mapPath?: Position[];
  poisonStatus?: PoisonStatus;
  
  // Relic Specific States
  floorFirstAttackUsed?: boolean; // For "Punho Enrijecido"
  runFirstPotionUsed?: boolean;   // For "Memória Destilada"
}

export type StatChoice = 'Ataque' | 'Armadura' | 'Velocidade';
