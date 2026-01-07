
import { MAP_WIDTH, MAP_HEIGHT, MAX_LEVELS, BIOME_ENEMIES } from '../constants';
import { TileType, Enemy, Chest, EntityStats, PotionEntity, LevelTheme, Position, Trap, TrapType, NPC, NPCType } from '../types';

const BIOMES: LevelTheme[] = [
  'CAVE', 'FOREST', 'SNOW', 'DESERT', 'RUINS', 'CATACOMBS', 
  'OSSUARY', 'MECHANICAL', 'CORRUPTED', 'INFERNO', 'ASTRAL', 'MATRIX', 'VOID',
  'FURNACE', 'SWAMP', 'TEMPLE', 'CHAOS', 'HIVE'
];

// ... (Existing helper functions checkPath, getRegionTiles, getMainFloorRegion, getDistance remain unchanged)

function checkPath(start: Position, end: Position, map: TileType[][]): boolean {
  if (!start || !end) return false;
  const queue: Position[] = [start];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);
  
  const dirs = [{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0}];
  
  while(queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.x === end.x && curr.y === end.y) return true;
    
    for (const d of dirs) {
      const nx = curr.x + d.x;
      const ny = curr.y + d.y;
      const key = `${nx},${ny}`;
      
      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT && map[ny][nx] !== 'WALL' && !visited.has(key)) {
        visited.add(key);
        queue.push({x:nx, y:ny});
      }
    }
  }
  return false;
}

function getRegionTiles(start: Position, map: TileType[][], visitedGlobal: Set<string>): Position[] {
    const tiles: Position[] = [];
    const queue: Position[] = [start];
    const key = `${start.x},${start.y}`;
    
    visitedGlobal.add(key);
    tiles.push(start);

    const dirs = [{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0}];

    let head = 0;
    while(head < queue.length) {
        const curr = queue[head++];
        
        for (const d of dirs) {
            const nx = curr.x + d.x;
            const ny = curr.y + d.y;
            const k = `${nx},${ny}`;

            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT && 
                map[ny][nx] !== 'WALL' && !visitedGlobal.has(k)) {
                visitedGlobal.add(k);
                const pos = {x: nx, y: ny};
                tiles.push(pos);
                queue.push(pos);
            }
        }
    }
    return tiles;
}

function getMainFloorRegion(map: TileType[][]): Position[] {
    let largestRegion: Position[] = [];
    const visited = new Set<string>();

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x] === 'FLOOR' && !visited.has(`${x},${y}`)) {
                const region = getRegionTiles({x, y}, map, visited);
                if (region.length > largestRegion.length) {
                    largestRegion = region;
                }
            }
        }
    }
    return largestRegion;
}

function getDistance(p1: Position, p2: Position): number {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

export function generateDungeon(level: number, isCrowUnlocked: boolean = false) {
  let attempt = 0;
  while (attempt < 50) {
    const dungeon = generateRawDungeon(level, isCrowUnlocked);
    const hasPathKey = checkPath(dungeon.playerPos, dungeon.keyPos, dungeon.map);
    const hasPathStairs = checkPath(dungeon.keyPos, dungeon.stairsPos, dungeon.map);
    const validArea = checkPath(dungeon.playerPos, dungeon.stairsPos, dungeon.map);
    
    let enemiesAccessible = true;
    if (dungeon.enemies.length > 0) {
        const first = checkPath(dungeon.playerPos, dungeon.enemies[0], dungeon.map);
        const last = checkPath(dungeon.playerPos, dungeon.enemies[dungeon.enemies.length-1], dungeon.map);
        enemiesAccessible = first && last;
    }

    if (hasPathKey && hasPathStairs && validArea && enemiesAccessible) {
      return dungeon;
    }
    if (attempt > 40) return generateRawDungeon(level, isCrowUnlocked, true);
    attempt++;
  }
  return generateRawDungeon(level, isCrowUnlocked, true);
}

function generateRawDungeon(level: number, isCrowUnlocked: boolean, forceOpen = false) {
  const maxW = MAP_WIDTH - 2;
  const maxH = MAP_HEIGHT - 2;
  const widthGrowth = Math.floor(level * 0.8);
  const heightGrowth = Math.floor(level * 0.5);
  const currentWidth = Math.min(maxW, 40 + widthGrowth);
  const currentHeight = Math.min(maxH, 25 + heightGrowth);

  const map: TileType[][] = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill('WALL'));
  const layoutTypes = ['ABERTO', 'LABIRINTO', 'SALAS', 'CORREDORES', 'SIMETRICO', 'CAOTICO'];
  const layout = forceOpen ? 'ABERTO' : layoutTypes[Math.floor(Math.random() * layoutTypes.length)];

  // ... (Layout generation logic remains same as before) ...
  if (layout === 'ABERTO') {
    for (let y = 2; y < currentHeight - 2; y++) {
      for (let x = 2; x < currentWidth - 2; x++) map[y][x] = 'FLOOR';
    }
  } else if (layout === 'LABIRINTO') {
    const density = level > 20 ? 0.35 : 0.25;
    for (let y = 1; y < currentHeight - 1; y++) {
      for (let x = 1; x < currentWidth - 1; x++) {
        if (x % 2 === 1 && y % 2 === 1) map[y][x] = 'FLOOR';
        else if (Math.random() > density) map[y][x] = 'FLOOR';
      }
    }
  } else if (layout === 'SALAS') {
    const area = currentWidth * currentHeight;
    const roomCount = Math.floor(area / 100) + Math.floor(level / 5); 
    generateRoomLayout(map, currentWidth, currentHeight, roomCount, 4, 10);
  } else if (layout === 'CORREDORES') {
    for (let y = 3; y < currentHeight - 3; y += 4) {
      for (let x = 2; x < currentWidth - 2; x++) map[y][x] = 'FLOOR';
    }
    for (let x = 3; x < currentWidth - 3; x += 8) {
      for (let y = 1; y < currentHeight - 1; y++) map[y][x] = 'FLOOR';
    }
    for(let i=0; i<level; i++) {
        const rx = Math.floor(Math.random() * (currentWidth-4)) + 2;
        const ry = Math.floor(Math.random() * (currentHeight-4)) + 2;
        map[ry][rx] = 'FLOOR';
    }
  } else if (layout === 'SIMETRICO') {
    const half = Math.floor(currentWidth / 2);
    for (let y = 2; y < currentHeight - 2; y++) {
      for (let x = 2; x < half; x++) {
        if (Math.random() > 0.4) {
           map[y][x] = 'FLOOR';
           map[y][currentWidth - x - 1] = 'FLOOR';
        }
      }
    }
    for (let x = 2; x < currentWidth - 2; x++) map[Math.floor(currentHeight/2)][x] = 'FLOOR';
  } else { 
    for (let y = 2; y < currentHeight - 2; y++) {
      for (let x = 2; x < currentWidth - 2; x++) {
        if (Math.random() > 0.45) map[y][x] = 'FLOOR';
      }
    }
  }

  const mainRegion = getMainFloorRegion(map);
  if (mainRegion.length < 20) {
      const cx = Math.floor(currentWidth/2);
      const cy = Math.floor(currentHeight/2);
      for(let y=cy-3; y<=cy+3; y++) {
          for(let x=cx-3; x<=cx+3; x++) {
              map[y][x] = 'FLOOR';
              mainRegion.push({x,y});
          }
      }
  }

  const mainRegionSet = new Set(mainRegion.map(p => `${p.x},${p.y}`));
  for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
          if (map[y][x] === 'FLOOR' && !mainRegionSet.has(`${x},${y}`)) {
              map[y][x] = 'WALL';
          }
      }
  }

  let availableTiles = [...mainRegion]; 
  const removeTile = (pos: Position) => {
      availableTiles = availableTiles.filter(t => t.x !== pos.x || t.y !== pos.y);
  };
  const getFreeTile = (): Position => {
      if (availableTiles.length === 0) return { x: 1, y: 1 };
      const idx = Math.floor(Math.random() * availableTiles.length);
      const tile = availableTiles[idx];
      availableTiles.splice(idx, 1);
      return tile;
  };
  const findFarTile = (targets: Position[], minDistance: number): Position => {
      const validTiles = availableTiles.filter(t => {
          return targets.every(target => getDistance(t, target) >= minDistance);
      });
      if (validTiles.length > 0) {
          const idx = Math.floor(Math.random() * validTiles.length);
          const tile = validTiles[idx];
          removeTile(tile);
          return tile;
      }
      if (minDistance > 5) return findFarTile(targets, Math.floor(minDistance * 0.7));
      return getFreeTile();
  };

  // --- PLACEMENT ---
  const playerPos = getFreeTile();
  const minStairDist = Math.floor((currentWidth + currentHeight) / 4);
  const stairsPos = findFarTile([playerPos], minStairDist);
  const keyPos = findFarTile([stairsPos, playerPos], minStairDist);

  let theme: LevelTheme;
  const extremes: LevelTheme[] = ['VOID', 'INFERNO', 'MATRIX', 'ASTRAL', 'CHAOS', 'FURNACE'];
  if (level > 80 && Math.random() > 0.4) {
    theme = extremes[Math.floor(Math.random() * extremes.length)];
  } else {
    theme = BIOMES[Math.floor(Math.random() * BIOMES.length)];
  }

  // NPCs
  const npcs: NPC[] = [];
  // 15% chance to spawn, max 1
  // Ensure not adjacent to walls to avoid getting stuck or looking weird
  if (Math.random() < 0.15) {
      // Filter tiles that are not adjacent to walls
      const safeTiles = availableTiles.filter(t => {
          const neighbors = [
              map[t.y-1]?.[t.x], map[t.y+1]?.[t.x],
              map[t.y]?.[t.x-1], map[t.y]?.[t.x+1]
          ];
          return neighbors.every(n => n === 'FLOOR');
      });

      if (safeTiles.length > 0) {
          const npcPos = safeTiles[Math.floor(Math.random() * safeTiles.length)];
          removeTile(npcPos); // Remove from available pool

          // Determine Type
          const types: NPCType[] = ['MERCHANT_WOUNDED', 'PRISONER', 'ALCHEMIST', 'IDOL', 'KNIGHT', 'CHILD', 'VOICE', 'GUARD'];
          if (level >= 30) types.push('CARTOGRAPHER');
          
          const type = types[Math.floor(Math.random() * types.length)];
          npcs.push({ id: `npc-${level}`, x: npcPos.x, y: npcPos.y, type });
      }
  }

  const area = currentWidth * currentHeight;
  const baseEnemies = 4 + Math.floor(level / 2);
  const densityBonus = Math.floor(area / 150); 
  const targetEnemies = Math.min(30, baseEnemies + densityBonus);

  const enemies: Enemy[] = [];
  const enemyPool = BIOME_ENEMIES[theme];
  for (let i = 0; i < targetEnemies; i++) {
    if (availableTiles.length === 0) break;
    const pos = getFreeTile();
    const type = enemyPool[Math.floor(Math.random() * enemyPool.length)];
    enemies.push({
      id: `e-${level}-${i}`, x: pos.x, y: pos.y, type,
      stats: generateEnemyStats(level, Math.random() > 0.95),
      isBoss: level % 10 === 0 && i === 0
    });
  }

  const chests: Chest[] = [];
  const numChests = Math.random() > 0.5 || level > 10 ? 2 : 1;
  for (let i = 0; i < numChests; i++) {
    if (availableTiles.length === 0) break;
    const pos = getFreeTile();
    chests.push({ id: `c-${level}-${i}`, x: pos.x, y: pos.y });
  }

  const potions: PotionEntity[] = [];
  for (let i = 0; i < 2; i++) {
    if (availableTiles.length === 0) break;
    const pos = getFreeTile();
    potions.push({ id: `p-${level}-${i}`, x: pos.x, y: pos.y, percent: 25 });
  }

  const altarPos = (availableTiles.length > 0) ? getFreeTile() : undefined;
  const hasMerchant = level % 2 !== 0;
  let merchantPos = (availableTiles.length > 0 && hasMerchant) ? getFreeTile() : undefined;

  const traps: Trap[] = [];
  if (level >= 30) {
      let trapCount = Math.floor(level / 5); 
      if (['INFERNO', 'VOID', 'MATRIX', 'CORRUPTED', 'MECHANICAL', 'FURNACE', 'CHAOS', 'HIVE'].includes(theme)) {
          trapCount += 5;
      }
      for(let i=0; i<trapCount; i++) {
          if (availableTiles.length === 0) break;
          const pos = getFreeTile();
          const types: TrapType[] = ['SPIKE', 'POISON', 'ALARM', 'EXPLOSIVE'];
          traps.push({
              id: `t-${level}-${i}`, x: pos.x, y: pos.y,
              type: types[Math.floor(Math.random() * types.length)],
              triggered: false, revealed: false
          });
      }
  }

  let eggPos: Position | undefined = undefined;
  if (level === 30 && !isCrowUnlocked && availableTiles.length > 0) {
      eggPos = getFreeTile();
  }

  return { map, theme, playerPos, stairsPos, enemies, chests, potions, keyPos, merchantPos, altarPos, traps, eggPos, npcs };
}

// ... (Rest of the file: generateRoomLayout, generateEnemyStats, findDungeonPath remain unchanged)

function generateRoomLayout(map: TileType[][], w: number, h: number, count: number, minS: number, maxS: number) {
  const rooms: Position[] = [];
  if (count < 1) count = 1;
  for (let i = 0; i < count; i++) {
    const rw = Math.floor(Math.random() * (maxS - minS)) + minS;
    const rh = Math.floor(Math.random() * (maxS - minS)) + minS;
    if (w - rw - 2 <= 1 || h - rh - 2 <= 1) continue;
    const rx = Math.floor(Math.random() * (w - rw - 2)) + 1;
    const ry = Math.floor(Math.random() * (h - rh - 2)) + 1;
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) map[y][x] = 'FLOOR';
    }
    rooms.push({x: Math.floor(rx + rw/2), y: Math.floor(ry + rh/2)});
  }
  for (let i = 0; i < rooms.length - 1; i++) {
    let cx = rooms[i].x;
    let cy = rooms[i].y;
    const tx = rooms[i+1].x;
    const ty = rooms[i+1].y;
    if (Math.random() > 0.5) {
        while(cx !== tx) { map[cy][cx] = 'FLOOR'; cx += cx < tx ? 1 : -1; }
        while(cy !== ty) { map[cy][cx] = 'FLOOR'; cy += cy < ty ? 1 : -1; }
    } else {
        while(cy !== ty) { map[cy][cx] = 'FLOOR'; cy += cy < ty ? 1 : -1; }
        while(cx !== tx) { map[cy][cx] = 'FLOOR'; cx += cx < tx ? 1 : -1; }
    }
  }
}

function generateEnemyStats(level: number, isElite: boolean): EntityStats {
  const mult = isElite ? 2.0 : 1.0;
  const hp = Math.floor((40 + level * 15) * mult);
  return {
    hp, maxHp: hp,
    attack: Math.floor((5 + level * 3) * mult),
    armor: Math.floor((2 + level * 1.5) * mult),
    maxArmor: Math.floor((2 + level * 1.5) * mult),
    speed: 8 + level / 10
  };
}

export function findDungeonPath(start: Position, end: Position, map: TileType[][], enemies: Enemy[]): Position[] | null {
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [] }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    if (pos.x === end.x && pos.y === end.y) return path;

    for (const [dx, dy] of directions) {
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT && map[ny][nx] !== 'WALL' && !visited.has(key)) {
        visited.add(key);
        queue.push({ pos: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
      }
    }
  }
  return null;
}
