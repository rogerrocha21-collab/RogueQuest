import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Position, EntityStats, StatChoice, PotionEntity, Pet, Language, Relic, AltarEffect, PoisonStatus, Trap, NPC, NPCFlags } from './types';
import { INITIAL_PLAYER_STATS, MAP_WIDTH, MAP_HEIGHT, TRANSLATIONS, RELICS_POOL, THEME_CONFIG, MAX_LEVELS, BLESSINGS_POOL, CURSES_POOL, BIOME_MUSIC_URLS, SAVE_VERSION } from './constants';
import { generateDungeon, findDungeonPath } from './utils/dungeon';
import GameMap from './components/GameMap';
import HUD from './components/HUD';
import { CombatModal, ChestModal, MerchantShopModal, TutorialModal, PotionPickupModal, RelicSelectionModal, AltarInteractionModal, AltarResultModal, EggStoryModal, RewardSuccessModal, NPCInteractionModal, LevelCompleteModal, InventoryFullModal } from './components/Modals';
import { Icon } from './components/Icons';
import { AdSense } from './components/AdSense';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [nameInput, setNameInput] = useState('');
  
  // SOUND SYSTEM
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
      const saved = localStorage.getItem('rq_sound_enabled');
      return saved === null ? true : saved === 'true';
  });

  const [currentLang, setCurrentLang] = useState<Language>('PT');
  const [moveQueue, setMoveQueue] = useState<Position[]>([]);
  const [isNewGameMode, setIsNewGameMode] = useState(false);
  const [inventoryFullAlert, setInventoryFullAlert] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [rewardType, setRewardType] = useState<'GOLD' | 'OST' | 'CROW' | null>(null);
  
  const audioContext = useRef<AudioContext | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const currentSongIdx = useRef<number>(0);
  const soundEnabledRef = useRef(soundEnabled);
  const playerPosRef = useRef<Position>({ x: 0, y: 0 });

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    if (bgmRef.current) {
      bgmRef.current.muted = !soundEnabled;
    }
    localStorage.setItem('rq_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    if (!gameState) return;

    if (!bgmRef.current) {
        bgmRef.current = new Audio();
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.4;
        bgmRef.current.muted = !soundEnabled;
    }

    if (gameState.gameStatus === 'PLAYING') {
        const isBossLevel = gameState.level % 10 === 0;
        const targetUrl = isBossLevel ? BIOME_MUSIC_URLS.BOSS : BIOME_MUSIC_URLS[gameState.theme];
        if (bgmRef.current.src !== targetUrl || bgmRef.current.paused) {
            bgmRef.current.src = targetUrl;
            bgmRef.current.play().catch(e => console.log("Audio play failed (user interaction needed):", e));
        }
    } else if (gameState.gameStatus === 'NEXT_LEVEL' || gameState.gameStatus === 'WON' || gameState.gameStatus === 'LOST' || gameState.gameStatus === 'START_SCREEN') {
        bgmRef.current.pause();
    }
  }, [gameState?.gameStatus, gameState?.theme, gameState?.level]);

  useEffect(() => {
    if (!gameState || !gameState.tronModeActive) return;
    const timer = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.tronTimeLeft === undefined) return prev;
        if (prev.tronTimeLeft <= 1) {
          return { ...prev, tronModeActive: false, tronTimeLeft: 0, tronTrail: [] };
        }
        return { ...prev, tronTimeLeft: prev.tronTimeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState?.tronModeActive]);

  const updateGuides = (state: GameState, pos: Position): { compass: Position[], map: Position[] } => {
     let compass: Position[] = [];
     let mapP: Position[] = [];

     if (state.hasCompass && state.enemies.length > 0) {
         let closestEnemy = state.enemies[0];
         let minLen = Infinity;
         let bestPath = null;
         for (const enemy of state.enemies) {
             const path = findDungeonPath(pos, enemy, state.map, state.enemies); 
             if (path && path.length < minLen) {
                 minLen = path.length;
                 bestPath = path;
             }
         }
         if (bestPath) compass = bestPath;
     }

     if (state.hasMap) {
         const path = findDungeonPath(pos, state.stairsPos, state.map, state.enemies);
         if (path) mapP = path;
     }
     return { compass, map: mapP };
  };

  useEffect(() => {
    let loadedData: GameState | null = null;

    try {
      const saved = localStorage.getItem('rq_save_v150_final');
      const globalUnlock = localStorage.getItem('rq_crow_unlocked') === 'true';

      if (saved) {
        const data = JSON.parse(saved);
        const isValid = data.version === SAVE_VERSION && data.map && Array.isArray(data.map) && data.playerStats && data.playerPos;

        if (isValid) {
            loadedData = { ...data, isCrowUnlocked: globalUnlock }; 
            if (data.gameStatus === 'LOST' || data.gameStatus === 'RELIC_SELECTION') {
            } else {
                 loadedData!.gameStatus = 'START_SCREEN';
            }
            setNameInput(data.playerName || '');
            if (data.language) setCurrentLang(data.language);
            playerPosRef.current = data.playerPos;
        } else {
            console.warn("Save incompatible or corrupted. Resetting.");
            setUpdateMessage("RESET");
        }
      }
    } catch (e) {
      console.error("Critical error loading save:", e);
      setUpdateMessage("RESET");
    }

    if (!loadedData) {
      localStorage.removeItem('rq_save_v150_final');
      const globalUnlock = localStorage.getItem('rq_crow_unlocked') === 'true';
      const initialPos = { x: 0, y: 0 };
      loadedData = {
        version: SAVE_VERSION,
        playerName: '', gold: 0, level: 1, theme: 'VOID' as const, playerPos: initialPos,
        playerStats: { ...INITIAL_PLAYER_STATS }, map: [], enemies: [], chests: [],
        potions: [], items: [], traps: [], npcs: [], hasKey: false, enemiesKilledInLevel: 0,
        stairsPos: {x:0,y:0}, gameStatus: 'START_SCREEN' as const, logs: [],
        tronModeActive: false, tronTimeLeft: 0, tronTrail: [], language: 'PT',
        inventory: [], inventorySize: 5, hasUsedAltarInLevel: false, hasCompass: false, hasMap: false,
        isCrowUnlocked: globalUnlock, npcFlags: {}
      };
      playerPosRef.current = initialPos;
      setIsNewGameMode(true);
    }
    
    setGameState(loadedData);
  }, []);

  useEffect(() => {
      if (!gameState) return;
      const params = new URLSearchParams(window.location.search);
      const reward = params.get('reward');
      const paymentStatus = params.get('payment');

      if (paymentStatus === 'cancelled') {
           window.history.replaceState({}, document.title, window.location.pathname);
           alert("Pagamento cancelado.");
           return;
      }

      if (reward) {
          let updatedState = { ...gameState };
          let changed = false;
          let rType: 'GOLD' | 'OST' | 'CROW' | null = null;

          if (reward === 'crow_unlocked') {
               localStorage.setItem('rq_crow_unlocked', 'true');
               updatedState.isCrowUnlocked = true;
               rType = 'CROW';
               changed = true;
          } else if (reward.startsWith('gold_')) {
               const amount = parseInt(reward.split('_')[1], 10);
               if (!isNaN(amount)) {
                   updatedState.gold += amount;
                   rType = 'GOLD';
                   changed = true;
               }
          } else if (reward === 'soundtrack') {
               rType = 'OST';
               changed = true;
          }

          if (changed) {
              setGameState(updatedState);
              localStorage.setItem('rq_save_v150_final', JSON.stringify(updatedState));
              if (rType === 'CROW') setRewardMessage('CROW'); 
              else setRewardType(rType);
              window.history.replaceState({}, document.title, window.location.pathname);
          }
      }
  }, [gameState?.version]); 

  const saveGame = useCallback((state: GameState) => {
    try {
      const stateToSave = { ...state, version: SAVE_VERSION, language: currentLang };
      localStorage.setItem('rq_save_v150_final', JSON.stringify(stateToSave));
      if (state.isCrowUnlocked) localStorage.setItem('rq_crow_unlocked', 'true');
    } catch (e) {}
  }, [currentLang]);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    if (gameState) {
      const newState = { ...gameState, language: lang };
      try {
        localStorage.setItem('rq_save_v150_final', JSON.stringify({ ...newState, version: SAVE_VERSION }));
      } catch (e) {}
    }
  };

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.PT;

  const playSound = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1, gainVal: number = 0.05) => {
    if (!soundEnabledRef.current || !audioContext.current) return;
    try {
      const ctx = audioContext.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };
  const playChime = () => playSound(880, 'sine', 0.3);
  const playCoinSound = () => playSound(987, 'sine', 0.1, 0.03);
  const playAttackSound = (attacker: 'player' | 'enemy') => {
    if (attacker === 'player') playSound(600, 'square', 0.15, 0.04);
    else playSound(220, 'sawtooth', 0.2, 0.06);
  };
  const playTrapSound = () => playSound(150, 'sawtooth', 0.2, 0.1);
  const startMusic = () => {
    if (audioContext.current) return;
    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  };

  const initLevel = useCallback((level: number, stats?: EntityStats, gold?: number, name?: string, activePet?: Pet, activeRelic?: Relic, inventory?: PotionEntity[], inheritedInventorySize?: number, inheritedFlags?: NPCFlags) => {
    if (level > MAX_LEVELS) {
      setGameState(prev => prev ? { ...prev, gameStatus: 'WON' as const } : null);
      return;
    }
    
    const globalCrow = localStorage.getItem('rq_crow_unlocked') === 'true';
    const tutorialCompleted = localStorage.getItem('rq_tutorial_completed') === 'true';
    
    const dungeon = generateDungeon(level, globalCrow);
    let currentStats = stats ? { ...stats, armor: stats.maxArmor } : { ...INITIAL_PLAYER_STATS };
    let currentGold = gold ?? 0;
    
    // RELIC: +5 Slots (starts with 10 total)
    let invSize = level === 1 ? (activeRelic?.id === 'slots' ? 10 : 5) : (inheritedInventorySize || 5);
    if (invSize > 50) invSize = 50;
    
    let startInventory = inventory || [];
    let currentFlags = inheritedFlags || {};

    setGameState(prev => {
        let finalHasCompass = prev?.hasCompass || false;
        let finalHasMap = prev?.hasMap || false;
        let activeFollower = prev?.activeFollower;
        let runFirstPotionUsed = prev?.runFirstPotionUsed || false;

        if (activeFollower) {
            if (activeFollower.levelsRemaining > 1) {
                activeFollower = { ...activeFollower, levelsRemaining: activeFollower.levelsRemaining - 1, pos: dungeon.playerPos };
            } else {
                activeFollower = undefined;
            }
        }

        if (currentFlags.knightQuestActive && !activeFollower) {
             if (Math.random() > 0.5) {
                 activeFollower = {
                     id: 'knight-follower',
                     type: 'KNIGHT',
                     name: 'Cavaleiro',
                     pos: dungeon.playerPos,
                     levelsRemaining: 3
                 };
                 currentFlags.knightQuestActive = false;
             }
        }

        if (level === 1) {
            // RELIC: Ancient Gauze (Start with 70% Potion)
            if (activeRelic?.id === 'gaze') startInventory.push({ id: 'relic-potion', percent: 70, x: 0, y: 0 });
            
            // RELIC: Mark of Sacrifice (-10% HP, +60 Gold)
            if (activeRelic?.id === 'mark') { 
                currentGold += 60; 
                currentStats.maxHp = Math.floor(currentStats.maxHp * 0.9); 
                currentStats.hp = currentStats.maxHp; 
            }
            
            // RELIC: Fissured Heart (+10% Dmg, -5% Max HP)
            if (activeRelic?.id === 'heart') { 
                currentStats.attack = Math.floor(currentStats.attack * 1.1); 
                currentStats.maxHp = Math.floor(currentStats.maxHp * 0.95); 
                currentStats.hp = Math.min(currentStats.hp, currentStats.maxHp); 
            }
            
            if (activeRelic?.id === 'life_long') { currentStats.maxHp += 30; currentStats.hp = currentStats.maxHp; }
            finalHasCompass = false;
            finalHasMap = false;
            currentFlags = {}; 
            activeFollower = undefined;
            runFirstPotionUsed = false; // Reset for new run
        }

        if (currentFlags.activeBuff) {
            currentFlags.activeBuff.duration -= 1;
            if (currentFlags.activeBuff.duration <= 0) currentFlags.activeBuff = undefined;
        }
        if (currentFlags.activeDebuff) {
            currentFlags.activeDebuff.duration -= 1;
            if (currentFlags.activeDebuff.duration <= 0) currentFlags.activeDebuff = undefined;
        }

        const finalPlayerName = name || nameInput;
        const currentT = TRANSLATIONS[currentLang] || TRANSLATIONS.PT;
        
        const initialStatus = (level === 1 && !tutorialCompleted) ? 'TUTORIAL' : 'PLAYING';

        const tempState: GameState = {
          ...dungeon, version: SAVE_VERSION, playerName: finalPlayerName, gold: currentGold, level, playerStats: currentStats, items: [], hasKey: false, enemiesKilledInLevel: 0,
          gameStatus: initialStatus as any,
          logs: (level === 1) ? [`${finalPlayerName} ${currentT.log_entered}`] : [`${currentT.log_descending} ${level}`],
          inventory: startInventory, inventorySize: invSize, 
          activePet: activePet, 
          activeRelic, language: currentLang, hasUsedAltarInLevel: false, tronModeActive: false, tronTimeLeft: 0, tronTrail: [],
          activeAltarEffect: undefined, keyPath: undefined,
          hasCompass: finalHasCompass, hasMap: finalHasMap, poisonStatus: undefined,
          isCrowUnlocked: globalCrow,
          crowPos: globalCrow ? dungeon.playerPos : undefined,
          activeFollower,
          npcFlags: currentFlags,
          floorFirstAttackUsed: false, // Reset every floor
          runFirstPotionUsed: runFirstPotionUsed
        };

        const guides = updateGuides(tempState, tempState.playerPos);
        tempState.compassPath = guides.compass;
        tempState.mapPath = guides.map;

        const getFreeAdjacent = (center: Position, occupied: Position[]): Position => {
            const dirs = [{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0},{x:1,y:1},{x:-1,y:-1},{x:1,y:-1},{x:-1,y:1}];
            const shuffled = dirs.sort(() => 0.5 - Math.random());
            for (const d of shuffled) {
                const nx = center.x + d.x;
                const ny = center.y + d.y;
                if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT && 
                    tempState.map[ny][nx] === 'FLOOR' && 
                    !occupied.some(p => p.x === nx && p.y === ny)) {
                    return {x: nx, y: ny};
                }
            }
            return center; 
        };

        if (tempState.activePet) {
            tempState.activePet.pos = getFreeAdjacent(tempState.playerPos, [tempState.playerPos]);
        }
        
        if (tempState.activeFollower) {
            const occupied = [tempState.playerPos];
            if (tempState.activePet) occupied.push(tempState.activePet.pos);
            tempState.activeFollower.pos = getFreeAdjacent(tempState.playerPos, occupied);
        }

        if (tempState.isCrowUnlocked && tempState.crowPos) {
            const occupied = [tempState.playerPos];
            if (tempState.activePet) occupied.push(tempState.activePet.pos);
            if (tempState.activeFollower) occupied.push(tempState.activeFollower.pos);
            tempState.crowPos = getFreeAdjacent(tempState.playerPos, occupied);
        }

        playerPosRef.current = tempState.playerPos;
        saveGame(tempState); 
        return tempState;
    });
    setMoveQueue([]);
  }, [nameInput, currentLang, saveGame]);

  const handleTileClick = (tx: number, ty: number) => {
    if (!gameState || gameState.gameStatus !== 'PLAYING') return;
    const path = findDungeonPath(playerPosRef.current, { x: tx, y: ty }, gameState.map, gameState.enemies);
    if (path && path.length > 0) setMoveQueue(path);
    else setMoveQueue([]);
  };
  
  const handleLevelTransition = (isNextLevel: boolean) => {
      setIsTransitioning(true);
      setTimeout(() => {
          if (isNextLevel) {
              setGameState(prev => prev ? { ...prev, gameStatus: 'NEXT_LEVEL' as const } as GameState : null);
          } else {
              initLevel(
                  gameState!.level + 1, 
                  gameState!.playerStats, 
                  gameState!.gold, 
                  gameState!.playerName, 
                  gameState!.activePet, 
                  gameState!.activeRelic, 
                  gameState!.inventory, 
                  gameState!.inventorySize,
                  gameState!.npcFlags
              );
          }
          setTimeout(() => setIsTransitioning(false), 100);
      }, 500); 
  };

  useEffect(() => {
    if (moveQueue.length === 0 || !gameState || gameState.gameStatus !== 'PLAYING') return;
    const moveStep = () => {
      setGameState(prev => {
        if (!prev || prev.gameStatus !== 'PLAYING' || moveQueue.length === 0) return prev;
        const nextPos = moveQueue[0];
        const oldPos = { ...prev.playerPos };
        
        let updatedPet = prev.activePet ? { ...prev.activePet, pos: oldPos } : undefined;
        let updatedFollower = prev.activeFollower ? { ...prev.activeFollower, pos: (updatedPet ? updatedPet.pos : oldPos) } : undefined;
        
        let newCrowPos = prev.crowPos || oldPos; 
        
        if (prev.isCrowUnlocked) {
            const scanCenter = nextPos;
            const nearbyTrap = prev.traps.find(t => 
                !t.triggered && 
                Math.abs(t.x - scanCenter.x) < 6 && 
                Math.abs(t.y - scanCenter.y) < 6
            );
            
            if (nearbyTrap) {
                newCrowPos = { x: nearbyTrap.x, y: nearbyTrap.y };
            } else {
                if (updatedFollower) newCrowPos = updatedFollower.pos;
                else if (updatedPet) newCrowPos = updatedPet.pos;
                else newCrowPos = oldPos;
            }

            const isOccupied = (p: Position) => 
                (p.x === nextPos.x && p.y === nextPos.y) || 
                (updatedPet && p.x === updatedPet.pos.x && p.y === updatedPet.pos.y) ||
                (updatedFollower && p.x === updatedFollower.pos.x && p.y === updatedFollower.pos.y);

            if (isOccupied(newCrowPos)) {
                const leaderPos = updatedFollower ? updatedFollower.pos : (updatedPet ? updatedPet.pos : nextPos);
                const neighbors = [{x: leaderPos.x, y: leaderPos.y - 1}, {x: leaderPos.x, y: leaderPos.y + 1}, {x: leaderPos.x - 1, y: leaderPos.y}, {x: leaderPos.x + 1, y: leaderPos.y}];
                const valid = neighbors.find(n => n.x >= 0 && n.x < MAP_WIDTH && n.y >= 0 && n.y < MAP_HEIGHT && prev.map[n.y]?.[n.x] !== 'WALL' && !isOccupied(n));
                if (valid) newCrowPos = valid;
            }
        }

        const npc = prev.npcs.find(n => n.x === nextPos.x && n.y === nextPos.y);
        if (npc) {
            setMoveQueue([]);
            return { ...prev, gameStatus: 'NPC_INTERACTION', activeNPC: npc, activePet: updatedPet, activeFollower: updatedFollower, crowPos: newCrowPos };
        }

        const enemy = prev.enemies.find(e => e.x === nextPos.x && e.y === nextPos.y);
        if (enemy) { 
          setMoveQueue([]); 
          if (prev.tronModeActive) {
            playAttackSound('player');
            return { ...prev, enemies: prev.enemies.filter(e => e.id !== enemy.id), enemiesKilledInLevel: prev.enemiesKilledInLevel + 1, gold: prev.gold + 10, logs: [...prev.logs, t.log_trampled] } as GameState;
          }
          return { ...prev, gameStatus: 'COMBAT' as const, currentEnemy: enemy } as GameState; 
        }
        
        const chest = prev.chests.find(c => c.x === nextPos.x && c.y === nextPos.y);
        if (chest) { setMoveQueue([]); return { ...prev, gameStatus: 'CHEST_OPEN' as const, chests: prev.chests.filter(c => c.id !== chest.id) } as GameState; }
        
        if (prev.keyPos && nextPos.x === prev.keyPos.x && nextPos.y === prev.keyPos.y && !prev.hasKey) {
          playChime(); setMoveQueue(q => q.slice(1)); playerPosRef.current = nextPos;
          return { ...prev, hasKey: true, logs: [...prev.logs, t.log_key], playerPos: nextPos, activePet: updatedPet, activeFollower: updatedFollower, crowPos: newCrowPos } as GameState;
        }
        
        const potion = prev.potions.find(p => p.x === nextPos.x && p.y === nextPos.y);
        if (potion) { 
            setMoveQueue([]); 
            return { ...prev, gameStatus: 'PICKUP_CHOICE' as const, currentPotion: potion } as GameState; 
        }
        
        if (prev.merchantPos && nextPos.x === prev.merchantPos.x && nextPos.y === prev.merchantPos.y) {
          setMoveQueue([]); playerPosRef.current = nextPos; return { ...prev, gameStatus: 'MERCHANT_SHOP' as const, playerPos: nextPos, activePet: updatedPet, activeFollower: updatedFollower, crowPos: newCrowPos } as GameState;
        }
        
        if (prev.altarPos && nextPos.x === prev.altarPos.x && nextPos.y === prev.altarPos.y) {
          setMoveQueue([]); playerPosRef.current = nextPos; return { ...prev, gameStatus: 'ALTAR_INTERACTION' as const, playerPos: nextPos, activePet: updatedPet, activeFollower: updatedFollower, crowPos: newCrowPos } as GameState;
        }

        if (prev.eggPos && nextPos.x === prev.eggPos.x && nextPos.y === prev.eggPos.y) {
            setMoveQueue([]); playerPosRef.current = nextPos;
            return { ...prev, gameStatus: 'EGG_INTERACTION' as const, playerPos: nextPos, activePet: updatedPet, activeFollower: updatedFollower, crowPos: newCrowPos } as GameState;
        }
        
        if (nextPos.x === prev.stairsPos.x && nextPos.y === prev.stairsPos.y) {
          if (prev.hasKey && prev.enemiesKilledInLevel > 0) { 
              playChime(); 
              setMoveQueue([]); 
              handleLevelTransition(true);
              return prev; 
          } else { 
              setMoveQueue(q => q.slice(1)); 
              playerPosRef.current = nextPos; 
              return { ...prev, logs: [...prev.logs, t.log_locked], playerPos: nextPos, activePet: updatedPet, activeFollower: updatedFollower, crowPos: newCrowPos } as GameState; 
          }
        }
        
        setMoveQueue(q => q.slice(1));
        playerPosRef.current = nextPos;
        let newTrail = prev.tronTrail || [];
        if (prev.tronModeActive) newTrail = [...newTrail, oldPos].slice(-10);

        const guides = updateGuides(prev, nextPos);
        
        let currentPoison = prev.poisonStatus;
        let currentHp = prev.playerStats.hp;
        let newLogs = [...prev.logs];
        
        if (currentPoison) {
            const damage = Math.max(1, Math.floor(prev.playerStats.maxHp * (currentPoison.damagePerTurn / 100)));
            currentHp -= damage;
            if (currentHp <= 0) {
               currentHp = 0;
               setMoveQueue([]);
               return { ...prev, gameStatus: 'LOST' as const, lastStats: { ...prev.playerStats, hp: 0 }, logs: [...newLogs, `${t.poison_damage} -${damage}`] } as GameState;
            }
            const remaining = currentPoison.turnsRemaining - 1;
            if (remaining <= 0) {
                currentPoison = undefined;
                newLogs.push(t.cured);
            } else {
                currentPoison = { ...currentPoison, turnsRemaining: remaining };
            }
        }

        let finalHp = currentHp;
        let finalPoison = currentPoison;
        let triggeredTrap: Trap | undefined = undefined;
        let closestEnemyToTrigger: any = undefined;
        let nextGameStatus: GameState['gameStatus'] = prev.gameStatus;

        const trap = prev.traps.find(t => t.x === nextPos.x && t.y === nextPos.y && !t.triggered);
        if (trap) {
            if (prev.playerStats.speed > 85) {
                newLogs.push(t.trap_evaded);
            } else {
                playTrapSound();
                triggeredTrap = { ...trap, triggered: true, revealed: true };
                
                if (trap.type === 'SPIKE') {
                    const dmg = Math.floor(prev.playerStats.maxHp * 0.10);
                    finalHp -= dmg;
                    newLogs.push(`${t.trap_spike} -${dmg} HP`);
                } else if (trap.type === 'POISON') {
                    const dmg = Math.floor(prev.playerStats.maxHp * 0.05);
                    finalHp -= dmg;
                    newLogs.push(`${t.trap_poison} -${dmg} HP`);
                    if (finalPoison) {
                        finalPoison = { ...finalPoison, turnsRemaining: finalPoison.turnsRemaining + 5 };
                    } else {
                        finalPoison = { type: 'WEAK', turnsRemaining: 5, damagePerTurn: 5 };
                    }
                } else if (trap.type === 'EXPLOSIVE') {
                    const dmg = Math.floor(prev.playerStats.maxHp * 0.15);
                    finalHp -= dmg;
                    newLogs.push(`${t.trap_explosive} -${dmg} HP`);
                } else if (trap.type === 'ALARM') {
                    newLogs.push(t.trap_alarm);
                    let minDist = Infinity;
                    let nearest = null;
                    prev.enemies.forEach(e => {
                        const d = Math.abs(e.x - nextPos.x) + Math.abs(e.y - nextPos.y);
                        if (d < minDist) { minDist = d; nearest = e; }
                    });
                    if (nearest) {
                        setMoveQueue([]);
                        closestEnemyToTrigger = nearest;
                        nextGameStatus = 'COMBAT';
                    }
                }

                if (finalHp <= 0) {
                    finalHp = 0;
                    setMoveQueue([]);
                    return { ...prev, gameStatus: 'LOST' as const, lastStats: { ...prev.playerStats, hp: 0 }, logs: newLogs } as GameState;
                }
            }
        }

        let updatedTraps = prev.traps.map(t => triggeredTrap && t.id === triggeredTrap.id ? triggeredTrap : t);
        if (prev.isCrowUnlocked && newCrowPos) {
            let revealedCount = 0;
            updatedTraps = updatedTraps.map(t => {
                if (!t.revealed && !t.triggered) {
                    const dist = Math.abs(t.x - newCrowPos.x) + Math.abs(t.y - newCrowPos.y);
                    if (dist <= 6) { 
                        revealedCount++;
                        return { ...t, revealed: true };
                    }
                }
                return t;
            });
            if (revealedCount > 0 && !prev.logs.includes(t.crow_reveal)) {
                 newLogs.push(t.crow_reveal);
            }
        }

        return { 
            ...prev, 
            playerPos: nextPos, 
            activePet: updatedPet, 
            activeFollower: updatedFollower,
            crowPos: newCrowPos,
            tronTrail: newTrail, 
            compassPath: guides.compass, 
            mapPath: guides.map,
            playerStats: { ...prev.playerStats, hp: finalHp },
            poisonStatus: finalPoison,
            logs: newLogs,
            traps: updatedTraps,
            gameStatus: nextGameStatus,
            currentEnemy: closestEnemyToTrigger || prev.currentEnemy
        } as GameState;
      });
    };
    const speed = gameState.tronModeActive ? 40 : 80;
    const timer = setTimeout(moveStep, speed); 
    return () => clearTimeout(timer);
  }, [moveQueue, gameState?.gameStatus, gameState?.tronModeActive, t]);

  const onCombatFinish = useCallback((newStats: EntityStats, win: boolean, goldEarned: number, petHp?: number, isPoisoned?: boolean) => {
    setGameState(prev => {
      if (!prev) return prev;
      if (!win) {
          const lostState = { ...prev, gameStatus: 'LOST' as const, lastStats: { ...newStats, hp: 0 } };
          saveGame(lostState); 
          return lostState;
      }
      
      const updatedPet = prev.activePet ? { ...prev.activePet, hp: petHp || 0 } : undefined;
      let finalGold = goldEarned;
      
      // RELIC: Stitched Bag (+5% Gold)
      if (prev.activeRelic?.id === 'bag') finalGold = Math.floor(finalGold * 1.05);
      
      // RELIC: Ancient Coin (5% Chance for extra gold)
      if (prev.activeRelic?.id === 'coin' && Math.random() < 0.05) {
          finalGold += 20; 
      }

      if (prev.activeAltarEffect?.id === 'sacred_greed') finalGold = Math.floor(finalGold * 1.15);
      if (prev.activeAltarEffect?.id === 'cursed_greed') finalGold = Math.floor(finalGold * 0.75);

      let nextStats = { ...newStats };
      nextStats.armor = nextStats.maxArmor;

      // RELIC: Crimson Hourglass (Recover 15% HP on kill)
      if (prev.activeRelic?.id === 'vamp') {
        nextStats.hp = Math.min(nextStats.maxHp, nextStats.hp + Math.floor(nextStats.maxHp * 0.15));
      }
      
      if (prev.activeAltarEffect?.id === 'surrendered_blood') {
        nextStats.hp = Math.min(nextStats.maxHp, nextStats.hp + Math.floor(nextStats.maxHp * 0.3));
      }
      if (prev.activeAltarEffect?.id === 'blood_tribute' && finalGold > 0) {
        nextStats.hp = Math.max(1, nextStats.hp - 5);
      }

      let newPoison = prev.poisonStatus;
      if (isPoisoned) {
          const isStrong = Math.random() > 0.7;
          const type = isStrong ? 'STRONG' : 'WEAK';
          const turns = isStrong ? 7 : 15;
          const dmg = isStrong ? 7 : 3;
          if (newPoison) {
              newPoison = { ...newPoison, turnsRemaining: newPoison.turnsRemaining + turns };
          } else {
              newPoison = { type: type as any, turnsRemaining: turns, damagePerTurn: dmg };
          }
      }

      let updatedFlags = { ...prev.npcFlags };
      if (updatedFlags.knightQuestActive) {
          updatedFlags.knightQuestKills = (updatedFlags.knightQuestKills || 0) + 1;
      }

      playCoinSound();
      const newEnemies = prev.enemies.filter(e => e.id !== prev.currentEnemy?.id);
      
      const tempState = { ...prev, enemies: newEnemies };
      const guides = updateGuides(tempState, prev.playerPos);

      const updated: GameState = {
        ...prev, playerStats: nextStats, gold: prev.gold + finalGold, gameStatus: 'PLAYING' as const,
        enemies: newEnemies,
        enemiesKilledInLevel: prev.enemiesKilledInLevel + 1, activePet: updatedPet, currentEnemy: undefined, keyPath: undefined,
        compassPath: guides.compass, mapPath: guides.map,
        poisonStatus: newPoison,
        npcFlags: updatedFlags
      };
      saveGame(updated);
      return updated;
    });
    setMoveQueue([]);
  }, [saveGame]);

  // ... (handleNPCInteraction remains mostly same, can be condensed in output if needed, but keeping logic consistent)
  const handleNPCInteraction = (choice: 1|2|3|4) => {
      setGameState(prev => {
          if (!prev || !prev.activeNPC) return prev;
          
          let stats = { ...prev.playerStats };
          let gold = prev.gold;
          let inventory = [...prev.inventory];
          let flags = { ...prev.npcFlags };
          let npcs = prev.npcs.filter(n => n.id !== prev.activeNPC?.id);
          let activeFollower = prev.activeFollower;
          let gameStatus: GameState['gameStatus'] = 'PLAYING';
          let logs = [...prev.logs];
          let currentEnemy: any = undefined;

          const removePotion = () => {
              const idx = inventory.findIndex(p => p.type !== 'ANTIDOTE');
              if (idx > -1) inventory.splice(idx, 1);
          };
          const removeAntidote = () => {
              const idx = inventory.findIndex(p => p.type === 'ANTIDOTE');
              if (idx > -1) inventory.splice(idx, 1);
          };

          // ... (NPC Logic switch - assuming same as before) ...
          switch (prev.activeNPC.type) {
              case 'MERCHANT_WOUNDED':
                  if (choice === 1) { removePotion(); if(Math.random()>0.5) inventory.push({id:`gift-${Date.now()}`, percent:50, x:0,y:0}); flags.merchantDiscount = true; }
                  else if (choice === 2) { gold -= 50; inventory.push({id:`anti-${Date.now()}`, percent:0, type:'ANTIDOTE', x:0,y:0}); inventory.push({id:`anti2-${Date.now()}`, percent:0, type:'ANTIDOTE', x:0,y:0}); }
                  else if (choice === 4) { gold += 50; flags.merchantTax = true; }
                  break;
              
              case 'PRISONER':
                  if (choice === 1) { 
                      stats.maxArmor += 2; stats.armor += 2; 
                      flags.activeBuff = { type: 'SHIELD', value: 10, duration: 3, name: 'Bênção da Prisioneira' };
                      activeFollower = { id: `fol-${Date.now()}`, type: 'PRISONER', name: 'Prisioneira', pos: prev.playerPos, levelsRemaining: 10 };
                  }
                  else if (choice === 2) { gold += 30; flags.moreEnemies = true; }
                  break;

              case 'ALCHEMIST':
                  if (choice === 1) { removeAntidote(); stats.hp = stats.maxHp; gold += 100; }
                  else if (choice === 3) { gold += 50; flags.merchantTax = true; }
                  break;

              case 'IDOL':
                  if (choice === 1) { gold -= 100; stats.attack += 5; }
                  else if (choice === 2) { stats.hp = Math.floor(stats.hp * 0.9); stats.attack = Math.floor(stats.attack * 1.25); }
                  else if (choice === 3) { 
                      gameStatus = 'COMBAT';
                      currentEnemy = { id: 'idol-boss', type: 'Colosso Ósseo', x:0, y:0, stats: { hp: 200, maxHp: 200, attack: 20, armor: 10, maxArmor: 10, speed: 8 }, isBoss: true };
                      npcs = prev.npcs;
                  }
                  break;

              case 'KNIGHT':
                  if (choice === 1) { flags.knightQuestActive = true; flags.knightQuestKills = 0; }
                  else if (choice === 3) {
                      gameStatus = 'COMBAT';
                      currentEnemy = { id: 'knight-boss', type: 'Cavaleiro Infernal', x:0, y:0, stats: { hp: 150, maxHp: 150, attack: 18, armor: 15, maxArmor: 15, speed: 10 }, isBoss: true };
                  }
                  break;

              case 'CHILD':
                  if (choice === 1) { flags.activeBuff = { type: 'ATTACK', value: 10, duration: 5, name: 'Esperança Pura' }; }
                  else if (choice === 3) {
                      gameStatus = 'COMBAT';
                      currentEnemy = { id: 'mimic-child', type: 'Aberração sem Forma', x:0, y:0, stats: { hp: 180, maxHp: 180, attack: 25, armor: 5, maxArmor: 5, speed: 12 }, isBoss: true };
                  }
                  break;

              case 'CARTOGRAPHER':
                  if (choice === 1) { 
                      gold -= 80; 
                      prev.traps.forEach(t => t.revealed = true);
                  }
                  else if (choice === 2) { flags.activeDebuff = { type: 'CURSE', name: 'Maldição do Mapa', duration: 5 }; }
                  break;

              case 'VOICE':
                  if (choice === 1) { stats.maxHp += 10; stats.hp += 10; }
                  else if (choice === 2) { gold += 50; }
                  break;

              case 'GUARD':
                  if (choice === 1) { removeAntidote(); stats.maxArmor += 12; stats.armor += 12; }
                  else if (choice === 2) { gold += 10; }
                  break;
          }

          return {
              ...prev,
              gold,
              playerStats: stats,
              inventory,
              npcFlags: flags,
              npcs,
              activeFollower,
              gameStatus,
              currentEnemy,
              activeNPC: undefined
          };
      });
  };

  const usePotionFromInventory = (idx: number) => {
    let used = false;
    setGameState(prev => {
      if (!prev || !prev.inventory[idx]) return prev;
      if (prev.activeAltarEffect?.id === 'denied_offering') {
        const newInv = [...prev.inventory]; newInv.splice(idx, 1);
        used = true; return { ...prev, activeAltarEffect: undefined, inventory: newInv } as GameState;
      }
      const item = prev.inventory[idx];
      const newInv = [...prev.inventory];
      if (item.type === 'ANTIDOTE') {
         newInv.splice(idx, 1);
         used = true;
         return { ...prev, inventory: newInv, poisonStatus: undefined, logs: [...prev.logs, t.cured] } as GameState;
      } else {
          const stats = { ...prev.playerStats };
          let boost = item.percent;
          
          // RELIC: Alchemical Residue (+5% Heal)
          if (prev.activeRelic?.id === 'alch') boost += 5;
          
          // RELIC: Distilled Memory (Double effect on first potion of run)
          let isFirstPotion = !prev.runFirstPotionUsed;
          if (prev.activeRelic?.id === 'memory' && isFirstPotion) {
              boost *= 2;
          }

          if (prev.activeAltarEffect?.id === 'profane_thirst') boost = Math.floor(boost * 0.8);
          
          const heal = Math.floor(stats.maxHp * (boost / 100));
          stats.hp = Math.min(stats.maxHp, stats.hp + heal);
          
          // RELIC: Unstable Flask (5% Chance not consumed)
          const isFlaskSaved = prev.activeRelic?.id === 'save' && Math.random() < 0.05;
          const isOfferingAccepted = prev.activeAltarEffect?.id === 'accepted_offering';
          
          const consumed = !isOfferingAccepted && !isFlaskSaved;
          if (consumed) newInv.splice(idx, 1);
          
          used = true;
          return { 
              ...prev, 
              playerStats: stats, 
              inventory: newInv, 
              activeAltarEffect: prev.activeAltarEffect?.id === 'accepted_offering' ? undefined : prev.activeAltarEffect,
              runFirstPotionUsed: true
          } as GameState;
      }
    });
    return used;
  };

  const handleShare = async () => {
    const heroName = gameState?.playerName || t.hero_default;
    const level = gameState?.level || 1;
    const atk = gameState?.playerStats.attack || 0;
    const armor = gameState?.playerStats.maxArmor || 0;
    const shareText = `🎮 ROGUEQUEST: The Eternal Descent\n🏆 ${t.share_hero}: ${heroName}\n📍 ${t.share_level}: ${level}\n⚔️ ${t.share_atk}: ${atk}\n🛡️ ${t.share_def}: ${armor}\n\n${t.share_msg} #RogueQuest\nhttps://t.me/RogueQuest_bot`;
    if (navigator.share) {
      try { await navigator.share({ title: 'ROGUEQUEST', text: shareText }); } catch (err) { await navigator.clipboard.writeText(shareText); alert(t.share_copied); }
    } else { await navigator.clipboard.writeText(shareText); alert(t.share_copied); }
  };

  const startRebirth = () => {
    const options = [...RELICS_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);
    setGameState(prev => {
        if(!prev) return null;
        const newState = { ...prev, gameStatus: 'RELIC_SELECTION' as const, relicOptions: options };
        saveGame(newState); 
        return newState;
    });
  };

  const handleRelicSelect = (relic: Relic) => {
    let inherited = { ...INITIAL_PLAYER_STATS };
    // RELIC: Echo of Deaths (Inherit 20%)
    if (relic.id === 'echo' && gameState?.lastStats) {
       inherited.attack += Math.floor(gameState.lastStats.attack * 0.2);
       inherited.maxHp += Math.floor(gameState.lastStats.maxHp * 0.2);
       inherited.maxArmor += Math.floor(gameState.lastStats.maxArmor * 0.2);
       inherited.speed += Math.floor(gameState.lastStats.speed * 0.2);
       inherited.hp = inherited.maxHp; inherited.armor = inherited.maxArmor;
    }
    initLevel(1, inherited, 0, nameInput, undefined, relic, []);
  };

  if (!gameState) return (
      <div className="bg-black min-h-screen flex items-center justify-center">
          <div className="text-zinc-500 font-mono animate-pulse">LOADING ABYSS...</div>
      </div>
  );

  return (
    <div className={`bg-black min-h-screen text-zinc-300 font-sans selection:bg-red-500/30 overflow-x-hidden transition-opacity duration-500 ${isTransitioning ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {gameState.gameStatus === 'START_SCREEN' ? (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-8 bg-black">
          <div className="max-w-md w-full text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
            <h1 className="text-6xl md:text-7xl font-sans font-black tracking-tighter flex items-center justify-center leading-none">
              <span className="text-white">ROGUE</span><span className="text-red-800">QUEST</span>
            </h1>
            <div className="bg-[#0f0f0f] border border-zinc-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
              {!isNewGameMode && gameState.playerName ? (
                <div className="space-y-4">
                  <button onClick={() => { startMusic(); setGameState({ ...gameState, gameStatus: 'PLAYING' as const }); }} className="w-full bg-red-800 hover:bg-red-700 py-5 rounded-2xl text-white font-mono font-bold text-xs uppercase tracking-widest shadow-xl transition-all transform active:scale-95">{t.continue_journey}</button>
                  <button onClick={() => setIsNewGameMode(true)} className="w-full bg-[#1e1e1e] hover:bg-[#2a2a2a] py-5 rounded-2xl text-zinc-500 font-mono font-bold text-[10px] uppercase tracking-widest transition-all">{t.new_game}</button>
                  <button onClick={() => window.open('https://t.me/ComunidadeRQ/27', '_blank')} className="w-full bg-zinc-900 border-2 border-zinc-800 text-zinc-500 rounded-2xl py-4 font-mono font-bold text-[9px] uppercase tracking-widest hover:text-white transition-all">{t.feedback}</button>
                  <div className="flex justify-center gap-3 pt-2">
                    <button onClick={() => changeLanguage('PT')} className={`p-3 rounded-xl border-2 transition-all ${currentLang === 'PT' ? 'border-green-600 bg-green-900/20 scale-110 shadow-lg shadow-green-900/20' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-600'}`} title="Português"><Icon.FlagBR /></button>
                    <button onClick={() => changeLanguage('EN')} className={`p-3 rounded-xl border-2 transition-all ${currentLang === 'EN' ? 'border-blue-600 bg-blue-900/20 scale-110 shadow-lg shadow-blue-900/20' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-600'}`} title="English"><Icon.FlagUS /></button>
                    <button onClick={() => changeLanguage('ES')} className={`p-3 rounded-xl border-2 transition-all ${currentLang === 'ES' ? 'border-yellow-600 bg-yellow-900/20 scale-110 shadow-lg shadow-yellow-900/20' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-600'}`} title="Español"><Icon.FlagES /></button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <input type="text" maxLength={12} placeholder={t.hero_placeholder} value={nameInput} onChange={e => setNameInput(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border-2 border-zinc-800 rounded-2xl py-5 px-6 text-center font-mono text-white focus:border-red-600 transition-all outline-none"/>
                  <button onClick={() => { if(!nameInput.trim()) return; startMusic(); initLevel(1, undefined, 0, nameInput); }} disabled={!nameInput.trim()} className="w-full bg-red-800 hover:bg-red-700 py-5 rounded-2xl text-white font-mono font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-30">{t.start_journey}</button>
                  <button onClick={() => window.open('https://t.me/ComunidadeRQ/27', '_blank')} className="w-full bg-zinc-900 border-2 border-zinc-800 text-zinc-500 rounded-2xl py-4 font-mono font-bold text-[9px] uppercase tracking-widest hover:text-white transition-all">{t.feedback}</button>
                  <div className="flex justify-center gap-3 pt-2">
                    <button onClick={() => changeLanguage('PT')} className={`p-3 rounded-xl border-2 transition-all ${currentLang === 'PT' ? 'border-green-600 bg-green-900/20 scale-110 shadow-lg shadow-green-900/20' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-600'}`} title="Português"><Icon.FlagBR /></button>
                    <button onClick={() => changeLanguage('EN')} className={`p-3 rounded-xl border-2 transition-all ${currentLang === 'EN' ? 'border-blue-600 bg-blue-900/20 scale-110 shadow-lg shadow-blue-900/20' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-600'}`} title="English"><Icon.FlagUS /></button>
                    <button onClick={() => changeLanguage('ES')} className={`p-3 rounded-xl border-2 transition-all ${currentLang === 'ES' ? 'border-yellow-600 bg-yellow-900/20 scale-110 shadow-lg shadow-yellow-900/20' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-600'}`} title="Español"><Icon.FlagES /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-[480px] mx-auto p-4 flex flex-col gap-4 min-h-screen">
          <header className="flex justify-between items-start py-4 px-1 border-b border-zinc-900 mb-2">
            <div className="flex flex-col">
              <h2 className="text-2xl font-black tracking-tighter uppercase flex leading-none">
                <span className="text-white">ROGUE</span><span className="text-red-800">QUEST</span>
              </h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1 leading-none">
                {t.level} {gameState.level} — {t[THEME_CONFIG[gameState.theme].nameKey]}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setGameState({...gameState, gameStatus: 'TUTORIAL'})} className="w-10 h-10 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors" title="Ajuda"><Icon.HelpCircle /></button>
              <button onClick={() => window.open('https://t.me/ComunidadeRQ', '_blank')} className="w-10 h-10 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors" title="Comunidade"><Icon.Users /></button>
              <button onClick={handleShare} className="w-10 h-10 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors" title="Compartilhar"><Icon.Share /></button>
              <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-10 h-10 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-center transition-colors ${soundEnabled ? 'text-red-800' : 'text-zinc-600'}`} title="Som">{soundEnabled ? <Icon.Volume2 /> : <Icon.VolumeX />}</button>
            </div>
          </header>

          {gameState.gameStatus !== 'WON' && gameState.gameStatus !== 'NEXT_LEVEL' && gameState.gameStatus !== 'RELIC_SELECTION' && gameState.gameStatus !== 'TUTORIAL' && gameState.map.length > 0 && (
            <div className="flex flex-col gap-4">
              <GameMap 
                map={gameState.map} theme={gameState.theme} playerPos={gameState.playerPos} enemies={gameState.enemies} chests={gameState.chests} potions={gameState.potions} items={gameState.items} keyPos={gameState.keyPos} merchantPos={gameState.merchantPos} altarPos={gameState.altarPos} eggPos={gameState.eggPos} hasKey={gameState.hasKey} stairsPos={gameState.stairsPos} activePet={gameState.activePet} isCrowUnlocked={gameState.isCrowUnlocked} crowPos={gameState.crowPos} keyPath={gameState.keyPath} onTileClick={handleTileClick} tronModeActive={gameState.tronModeActive} tronTrail={gameState.tronTrail} 
                ritualDarkness={gameState.activeAltarEffect?.id === 'ritual_darkness'}
                compassPath={gameState.compassPath} mapPath={gameState.mapPath}
                poisonStatus={gameState.poisonStatus}
                traps={gameState.traps}
                npcs={gameState.npcs}
                activeFollower={gameState.activeFollower}
              />
              <HUD level={gameState.level} stats={gameState.playerStats} logs={gameState.logs} hasKey={gameState.hasKey} kills={gameState.enemiesKilledInLevel} gold={gameState.gold} playerName={gameState.playerName} activePet={gameState.activePet} isCrowUnlocked={gameState.isCrowUnlocked} language={currentLang} inventory={gameState.inventory} inventorySize={gameState.inventorySize} activeRelic={gameState.activeRelic} activeAltarEffect={gameState.activeAltarEffect} poisonStatus={gameState.poisonStatus} onUsePotion={usePotionFromInventory} tronModeActive={gameState.tronModeActive} tronTimeLeft={gameState.tronTimeLeft}
                hasCompass={gameState.hasCompass} hasMap={gameState.hasMap} enemiesCount={gameState.enemies.length}
              />
            </div>
          )}
        </div>
      )}

      {(rewardMessage || rewardType) && (
        <RewardSuccessModal 
           type={rewardType || 'CROW'}
           language={currentLang}
           onClose={() => {
              setRewardMessage(null);
              setRewardType(null);
              setGameState(prev => prev ? { ...prev, gameStatus: 'START_SCREEN' } : null);
           }}
        />
      )}

      {inventoryFullAlert && (
          <InventoryFullModal language={currentLang} onClose={() => setInventoryFullAlert(false)} />
      )}

      {gameState.gameStatus === 'LOST' && (
        <div className="fixed inset-0 z-[120] bg-black/95 overflow-y-auto backdrop-blur-xl">
          <div className="min-h-full flex flex-col items-center justify-center p-4 py-8 space-y-6">
            <h2 className="text-5xl md:text-7xl font-black text-red-600 uppercase tracking-tighter drop-shadow-[0_0_25px_rgba(220,38,38,0.6)] animate-pulse">{t.death_title}</h2>
            <div className="w-full max-w-sm bg-[#0a0a0a] border border-zinc-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-900/20 blur-3xl rounded-full pointer-events-none" />
              <div className="relative z-10 space-y-6">
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] text-center border-b border-zinc-900 pb-2">{t.final_stats}</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                       <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800 flex flex-col items-center"><span className="text-[7px] font-bold text-zinc-500 uppercase">{t.share_level}</span><span className="text-lg font-black text-white">{gameState.level}</span></div>
                       <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800 flex flex-col items-center"><span className="text-[7px] font-bold text-zinc-500 uppercase">{t.hp}</span><span className="text-lg font-black text-red-500">{gameState.lastStats?.maxHp}</span></div>
                       <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800 flex flex-col items-center"><span className="text-[7px] font-bold text-zinc-500 uppercase">{t.atk}</span><span className="text-lg font-black text-yellow-500">{gameState.lastStats?.attack}</span></div>
                       <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800 flex flex-col items-center"><span className="text-[7px] font-bold text-zinc-500 uppercase">{t.armor}</span><span className="text-lg font-black text-blue-500">{gameState.lastStats?.maxArmor}</span></div>
                    </div>
                 </div>
                 {(gameState.activeAltarEffect || gameState.activeRelic) && (
                    <div className="flex flex-col gap-2 items-center bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50">
                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{t.relic_active}</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {gameState.activeRelic && <span className="px-2 py-1 bg-purple-900/20 border border-purple-500/30 rounded-md text-[8px] font-black text-purple-400 uppercase">{t[gameState.activeRelic.name]}</span>}
                            {gameState.activeAltarEffect && <span className={`px-2 py-1 border rounded-md text-[8px] font-black uppercase ${gameState.activeAltarEffect.type === 'BLESSING' ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>{t[gameState.activeAltarEffect.nameKey]}</span>}
                        </div>
                    </div>
                 )}
                 <button onClick={startRebirth} className="w-full py-4 bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white font-black rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-red-900/20 transform active:scale-95 transition-all flex items-center justify-center gap-2 group z-50 relative"><span>{t.rebirth}</span><Icon.Ghost className="w-4 h-4 group-hover:animate-bounce" /></button>
              </div>
            </div>
            <div className="w-full max-w-sm min-h-[250px] bg-black/20 rounded-xl overflow-hidden flex justify-center items-center shrink-0"><AdSense slot="SLOT_ID_AQUI" style={{width: '100%', maxWidth: '320px', maxHeight: '250px'}} /></div>
          </div>
        </div>
      )}

      {gameState.gameStatus === 'EGG_INTERACTION' && (
        <EggStoryModal language={currentLang} onAccept={() => {
             localStorage.setItem('rq_crow_unlocked', 'true');
             setGameState(prev => { if (!prev) return null; return { ...prev, isCrowUnlocked: true, eggPos: undefined, crowPos: prev.playerPos, gameStatus: 'PLAYING' }; });
          }}
        />
      )}

      {gameState.gameStatus === 'NPC_INTERACTION' && gameState.activeNPC && (
          <NPCInteractionModal 
             npc={gameState.activeNPC}
             language={currentLang}
             gold={gameState.gold}
             inventory={gameState.inventory}
             onChoice={handleNPCInteraction}
          />
      )}

      {gameState.gameStatus === 'COMBAT' && gameState.currentEnemy && (
        <CombatModal 
          playerStats={gameState.playerStats} enemy={gameState.currentEnemy} 
          activePet={gameState.activePet} activeFollower={gameState.activeFollower} language={currentLang} 
          altarEffect={gameState.activeAltarEffect} relic={gameState.activeRelic} 
          inventory={gameState.inventory} onAttackSound={playAttackSound} 
          onUsePotion={usePotionFromInventory} onFinish={onCombatFinish} 
          kills={gameState.enemiesKilledInLevel}
          isFirstAttackOfFloor={!gameState.floorFirstAttackUsed}
          onFirstAttackUsed={() => setGameState(prev => prev ? {...prev, floorFirstAttackUsed: true} : null)}
        />
      )}

      {gameState.gameStatus === 'PICKUP_CHOICE' && gameState.currentPotion && (
        <PotionPickupModal 
          potion={gameState.currentPotion} 
          language={currentLang} 
          onChoice={(choice) => {
            setGameState(prev => {
              if (!prev) return prev;
              const stats = { ...prev.playerStats };
              let inv = [...prev.inventory];
              const pot = prev.currentPotion!;
              
              if (choice === 'use') {
                  let boost = pot.percent;
                  if (prev.activeRelic?.id === 'alch') boost += 5;
                  
                  let isFirstPotion = !prev.runFirstPotionUsed;
                  if (prev.activeRelic?.id === 'memory' && isFirstPotion) {
                      boost *= 2;
                  }

                  if (prev.activeAltarEffect?.id === 'profane_thirst') boost = Math.floor(boost * 0.8);
                  const heal = Math.floor(stats.maxHp * (boost / 100));
                  stats.hp = Math.min(stats.maxHp, stats.hp + heal);
                  
                  const newPotions = prev.potions.filter(p => p.id !== pot.id);
                  return { ...prev, playerStats: stats, inventory: inv, potions: newPotions, gameStatus: 'PLAYING' as const, currentPotion: undefined, runFirstPotionUsed: true };
              } else {
                  if (inv.length >= prev.inventorySize) {
                      setInventoryFullAlert(true);
                      return { ...prev, gameStatus: 'PLAYING' as const, currentPotion: undefined };
                  }
                  
                  inv.push(pot);
                  const newPotions = prev.potions.filter(p => p.id !== pot.id);
                  return { ...prev, playerStats: stats, inventory: inv, potions: newPotions, gameStatus: 'PLAYING' as const, currentPotion: undefined };
              }
            });
            playCoinSound();
          }} 
        />
      )}
      
      {gameState.gameStatus === 'CHEST_OPEN' && (
        <ChestModal language={currentLang} onChoice={(choice, extra) => {
            setGameState(prev => {
              if (!prev) return prev;
              const stats = { ...prev.playerStats };
              const mult = prev.activeAltarEffect?.id === 'consecrated_chest' ? 2 : 1;
              if (choice === 'Ataque') stats.attack += 5 * mult;
              if (choice === 'Armadura') { stats.maxArmor += 3 * mult; stats.armor += 3 * mult; }
              if (choice === 'Velocidade') stats.speed += 2 * mult;
              
              let gold = prev.gold; 
              
              // Altar: Pilgrim's Luck
              if (extra === 'gold' || (prev.activeAltarEffect?.id === 'pilgrim_luck' && Math.random() < 0.05)) {
                  gold += 100;
              }

              let inv = [...prev.inventory];
              if (extra !== 'gold' && inv.length < prev.inventorySize) {
                const perc = [25, 50, 75][Math.floor(Math.random() * 3)];
                inv.push({ id: `c-pot-${Date.now()}`, percent: perc, x: 0, y: 0 });
              }
              return { ...prev, playerStats: stats, gold: gold, inventory: inv, gameStatus: 'PLAYING' as const, activeAltarEffect: mult === 2 ? undefined : prev.activeAltarEffect } as GameState;
            });
          }} 
        />
      )}

      {gameState.gameStatus === 'ALTAR_INTERACTION' && (
        <AltarInteractionModal language={currentLang} active={gameState.enemiesKilledInLevel > 0 && !gameState.hasUsedAltarInLevel} onPray={() => {
            const isLucky = Math.random() > 0.5;
            const pool = isLucky ? BLESSINGS_POOL : CURSES_POOL;
            const effect = pool[Math.floor(Math.random() * pool.length)];
            let keyPath: Position[] | undefined = undefined;
            if (effect.id === 'open_eyes' && gameState!.keyPos) {
              const path = findDungeonPath(gameState!.playerPos, gameState!.keyPos, gameState!.map, gameState!.enemies);
              if (path) keyPath = path;
            }
            setGameState({ ...gameState!, gameStatus: 'ALTAR_RESULT' as const, activeAltarEffect: effect, hasUsedAltarInLevel: true, keyPath: keyPath || gameState!.keyPath });
          }} onClose={() => setGameState({ ...gameState!, gameStatus: 'PLAYING' as const })} 
        />
      )}

      {gameState.gameStatus === 'ALTAR_RESULT' && gameState.activeAltarEffect && (
        <AltarResultModal effect={gameState.activeAltarEffect} language={currentLang} onClose={() => setGameState({ ...gameState!, gameStatus: 'PLAYING' as const })} />
      )}

      {gameState.gameStatus === 'RELIC_SELECTION' && gameState.relicOptions && (
        <RelicSelectionModal options={gameState.relicOptions} language={currentLang} onSelect={handleRelicSelect} />
      )}

      {gameState.gameStatus === 'MERCHANT_SHOP' && (
        <MerchantShopModal 
          gold={gameState.gold} level={gameState.level} hasPet={!!gameState.activePet} 
          language={currentLang} activeAltarEffect={gameState.activeAltarEffect} 
          hasCompass={gameState.hasCompass} hasMap={gameState.hasMap}
          inventorySize={gameState.inventorySize}
          onBuyItem={(item) => {
            setGameState(prev => {
              if(!prev) return prev;
              const stats = { ...prev.playerStats };
              stats[item.stat as keyof EntityStats] += item.value;
              return { ...prev, playerStats: stats, gold: prev.gold - (item.price || 0) };
            });
            playCoinSound();
          }}
          onBuyPotion={(pot, choice) => {
              setGameState(prev => {
                  if(!prev) return prev;
                  let newInv = [...prev.inventory];
                  let newStats = { ...prev.playerStats };
                  const actualPrice = prev.activeAltarEffect?.id === 'merchant_blessing' ? 40 : 50; 

                  if (choice === 'store') {
                      if (newInv.length < prev.inventorySize) newInv.push(pot);
                      else setInventoryFullAlert(true);
                  } else {
                      let boost = pot.percent;
                      if (prev.activeRelic?.id === 'alch') boost += 5;
                      
                      let isFirstPotion = !prev.runFirstPotionUsed;
                      if (prev.activeRelic?.id === 'memory' && isFirstPotion) {
                          boost *= 2;
                      }

                      if (prev.activeAltarEffect?.id === 'profane_thirst') boost = Math.floor(boost * 0.8);
                      const heal = Math.floor(newStats.maxHp * (boost / 100));
                      newStats.hp = Math.min(newStats.maxHp, newStats.hp + heal);
                  }
                  return { ...prev, gold: prev.gold - actualPrice, inventory: newInv, playerStats: newStats, runFirstPotionUsed: choice !== 'store' ? true : prev.runFirstPotionUsed };
              });
              playCoinSound();
          }}
          onBuyAntidote={(choice) => {
              setGameState(prev => {
                  if(!prev) return prev;
                  let newInv = [...prev.inventory];
                  let poison = prev.poisonStatus;
                  let logs = [...prev.logs];
                  const actualPrice = prev.activeAltarEffect?.id === 'merchant_blessing' ? 40 : 50;

                  if (choice === 'store') {
                      if (newInv.length < prev.inventorySize) newInv.push({ id: `anti-${Date.now()}`, percent: 0, type: 'ANTIDOTE', x:0, y:0 });
                      else setInventoryFullAlert(true);
                  } else {
                      poison = undefined;
                      logs.push(t.cured);
                  }
                  return { ...prev, gold: prev.gold - actualPrice, inventory: newInv, poisonStatus: poison, logs };
              });
              playCoinSound();
          }}
          onRentTron={() => {
              setGameState(prev => {
                  if(!prev) return prev;
                  const price = prev.activeAltarEffect?.id === 'merchant_blessing' ? 20 : 25;
                  return { ...prev, gold: prev.gold - price, tronModeActive: true, tronTimeLeft: 20 };
              });
              playCoinSound();
          }}
          onBuyCompass={() => {
              setGameState(prev => {
                  if(!prev) return prev;
                  const price = prev.activeAltarEffect?.id === 'merchant_blessing' ? 72 : 90;
                  return { ...prev, gold: prev.gold - price, hasCompass: true };
              });
              playCoinSound();
          }}
          onBuyMap={() => {
              setGameState(prev => {
                  if(!prev) return prev;
                  const price = prev.activeAltarEffect?.id === 'merchant_blessing' ? 72 : 90;
                  return { ...prev, gold: prev.gold - price, hasMap: true };
              });
              playCoinSound();
          }}
          onBuyInventorySlot={() => {
              setGameState(prev => {
                  if(!prev) return prev;
                  if (prev.inventorySize >= 50) return prev;
                  const price = prev.activeAltarEffect?.id === 'merchant_blessing' ? 200 : 250;
                  return { ...prev, gold: prev.gold - price, inventorySize: Math.min(50, prev.inventorySize + 5) };
              });
              playCoinSound();
          }}
          onBuyPet={(type) => {
              let price = type === 'CACHORRO' ? 10 : 15;
              if (gameState?.activeAltarEffect?.id === 'merchant_blessing') price = Math.floor(price * 0.8);
              const hp = type === 'CACHORRO' ? 50 : 80;
              setGameState(prev => {
                  if(!prev) return prev;
                  return { ...prev, gold: prev.gold - price, activePet: { type, name: type, hp, maxHp: hp, pos: prev.playerPos } };
              });
              playCoinSound();
          }}
          onClose={() => setGameState(prev => prev ? { ...prev, gameStatus: 'PLAYING' } : null)}
        />
      )}

      {gameState.gameStatus === 'TUTORIAL' && (
        <TutorialModal 
            language={currentLang} 
            onFinish={() => {
                localStorage.setItem('rq_tutorial_completed', 'true');
                setGameState(prev => prev ? { ...prev, gameStatus: 'PLAYING' } : null);
            }} 
        />
      )}

      {gameState.gameStatus === 'NEXT_LEVEL' && (
        <LevelCompleteModal 
            language={currentLang} 
            stats={{ kills: gameState.enemiesKilledInLevel, gold: gameState.gold }}
            onDescend={() => handleLevelTransition(false)}
        />
      )}
    </div>
  );
};

export default App;