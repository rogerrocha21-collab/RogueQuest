
import React, { useEffect, useState, useRef } from 'react';
import { Enemy, EntityStats, StatChoice, PotionEntity, ItemEntity, Pet, Language, Relic, AltarEffect, NPC } from '../types';
import { Icon } from './Icons';
import { ITEM_POOL, TRANSLATIONS, RELICS_POOL, POISONOUS_ENEMIES, NPC_COLORS } from '../constants';

interface CombatLogEntry {
  msg: string;
  type: 'player' | 'enemy' | 'pet' | 'info' | 'heal';
}

interface CombatModalProps {
  playerStats: EntityStats;
  enemy: Enemy;
  activePet?: Pet;
  activeFollower?: any;
  language?: Language;
  altarEffect?: AltarEffect;
  relic?: Relic;
  inventory?: PotionEntity[];
  onAttackSound?: (attacker: 'player' | 'enemy') => void;
  onUsePotion: (idx: number) => boolean;
  onFinish: (newPlayerStats: EntityStats, win: boolean, goldEarned: number, petHp?: number, isPoisoned?: boolean) => void;
  kills?: number; 
  isFirstAttackOfFloor?: boolean;
  onFirstAttackUsed?: () => void;
}

export const CombatModal: React.FC<CombatModalProps> = ({ 
  playerStats, enemy, activePet, activeFollower, language = 'PT', altarEffect, relic, inventory = [], onAttackSound, onUsePotion, onFinish, kills = 0, isFirstAttackOfFloor = false, onFirstAttackUsed
}) => {
  const [currentPStats, setCurrentPStats] = useState({ ...playerStats });
  const [currentEStats, setCurrentEStats] = useState({ ...enemy.stats });
  const [petHp, setPetHp] = useState(activePet?.hp || 0);
  const [isDone, setIsDone] = useState(false);
  const [isHealAnim, setIsHealAnim] = useState(false);
  const [isTakingDamage, setIsTakingDamage] = useState<'player' | 'enemy' | 'pet' | null>(null);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([]);
  const [isPoisonedInCombat, setIsPoisonedInCombat] = useState(false);
  
  // Relic Combat States
  const [enemyBleeding, setEnemyBleeding] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pRef = useRef({ ...playerStats }); 
  const t = TRANSLATIONS[language];

  const addLog = (msg: string, type: 'player' | 'enemy' | 'pet' | 'info' | 'heal') => { 
    setCombatLogs(prev => [...prev, { msg, type }]); 
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [combatLogs]);

  useEffect(() => {
    let e = { ...currentEStats };
    let curPetHp = petHp;
    let turnCount = 0;
    let lastPlayerAttackTurn = -1;
    let isFirstPlayerHitInCombat = true;
    let poisoned = false;
    let playerParalyzed = false;
    let localFirstAttackUsed = false;
    
    const resolveTurn = () => {
      if (pRef.current.hp <= 0 || e.hp <= 0) { 
          if (e.hp <= 0 && enemy.type === 'Larva Ígnea') {
              const explosionDmg = Math.floor(pRef.current.maxHp * 0.15);
              pRef.current.hp = Math.max(0, pRef.current.hp - explosionDmg);
              addLog(`Larva ${t.log_explode} -${explosionDmg} HP`, 'enemy');
              setCurrentPStats({ ...pRef.current });
          }
          setIsDone(true); 
          return; 
      }

      const executeSequence = async () => {
        turnCount++;
        const enemyHasInitiative = altarEffect?.id === 'slow_reflexes';

        if (!enemyHasInitiative && activePet && curPetHp > 0) {
            let petAtk = Math.max(1, Math.floor(pRef.current.attack / 2));
            if (relic?.id === 'collar') petAtk += 10;
            e.hp -= petAtk; if (e.hp < 0) e.hp = 0;
            addLog(`${t.combat_pet} ${t.combat_dealt} ${petAtk} ${t.combat_damage}`, 'pet');
            setCurrentEStats({ ...e });
            setIsTakingDamage('enemy');
            await new Promise(r => setTimeout(r, 400)); 
            setIsTakingDamage(null);
            if (e.hp <= 0) { setIsDone(true); return; }
        }

        if (!enemyHasInitiative && activeFollower) {
            let followerAtk = Math.max(1, Math.floor(pRef.current.attack * 0.25));
            e.hp -= followerAtk; if (e.hp < 0) e.hp = 0;
            const followerName = activeFollower.type === 'PRISONER' ? t.follower_prisoner : t.follower_knight;
            addLog(`${followerName} ${t.combat_dealt} ${followerAtk} ${t.combat_damage}`, 'pet');
            setCurrentEStats({ ...e });
            setIsTakingDamage('enemy');
            await new Promise(r => setTimeout(r, 400));
            setIsTakingDamage(null);
            if (e.hp <= 0) { setIsDone(true); return; }
        }

        const playersTurn = !enemyHasInitiative && (pRef.current.speed >= e.speed);
        const turnOrder = playersTurn ? ['player', 'enemy'] : ['enemy', 'player'];

        const processSide = async (side: 'player' | 'enemy') => {
            if (pRef.current.hp <= 0 || e.hp <= 0) return;
            
            if (side === 'player' && playerParalyzed) {
                addLog(t.log_paralyzed, 'enemy');
                playerParalyzed = false;
                return;
            }

            if (side === 'player' && altarEffect?.id === 'short_breath' && lastPlayerAttackTurn === turnCount - 1) {
                addLog(t.log_recover_breath, 'info');
                return;
            }
            if (side === 'player' && altarEffect?.id === 'trembling_hands' && Math.random() < 0.15) {
                addLog(t.log_miss, 'player');
                return;
            }

            let atkValue = side === 'player' ? pRef.current.attack : e.attack;
            if (side === 'player') {
                if (altarEffect?.id === 'sharp_blood' && kills > 0) {
                    atkValue = Math.floor(atkValue * 1.10);
                }
                if (altarEffect?.id === 'anxious_strike' && isFirstPlayerHitInCombat) {
                    atkValue *= 2;
                    addLog(t.log_anxious, 'player');
                }
                if (altarEffect?.id === 'contained_fury' && pRef.current.hp < (pRef.current.maxHp * 0.5)) {
                    atkValue = Math.floor(atkValue * 1.15);
                }
                
                // Relic: Punho Enrijecido (Power)
                if (relic?.id === 'power' && isFirstAttackOfFloor && !localFirstAttackUsed) {
                    atkValue = Math.floor(atkValue * 1.10);
                    localFirstAttackUsed = true;
                    if (onFirstAttackUsed) onFirstAttackUsed();
                }

                if (relic?.id === 'crit' && Math.random() < 0.01) {
                   atkValue = Math.floor(atkValue * 2);
                   addLog(t.log_crit, 'player');
                }
                isFirstPlayerHitInCombat = false;
            }

            if (onAttackSound) onAttackSound(side);
            let defender = side === 'player' ? e : pRef.current;
            let originalAtk = atkValue;
            if (side === 'enemy' && altarEffect?.id === 'fragile_blood') originalAtk = Math.floor(originalAtk * 1.1);
            if (side === 'enemy' && relic?.id === 'defense') originalAtk = Math.max(1, originalAtk - 1);

            let currentAtkForCalculation = originalAtk;
            const armorToConsider = (side === 'player' && altarEffect?.id === 'consecrated_fists') 
                ? Math.floor(defender.armor / 2) 
                : defender.armor;

            if (armorToConsider > 0) {
              let absorbed = Math.min(armorToConsider, currentAtkForCalculation);
              if (side === 'player') e.armor = Math.max(0, e.armor - absorbed);
              else pRef.current.armor = Math.max(0, pRef.current.armor - absorbed);
              currentAtkForCalculation -= absorbed;
              addLog(`${side === 'player' ? t.combat_enemy : t.combat_player} ${t.log_absorbed} ${absorbed} ${t.combat_damage}`, 'info');
            }

            if (currentAtkForCalculation > 0) {
                defender.hp -= currentAtkForCalculation;
                // Relic: Dente Serrilhado (Bleed)
                if (side === 'player' && relic?.id === 'bleed' && Math.random() < 0.01 && !enemyBleeding) {
                    setEnemyBleeding(true);
                    addLog(`${t.log_bleed} (Inimigo)`, 'player');
                }
            }
            if (defender.hp < 0) defender.hp = 0;
            
            if (side === 'enemy') {
                if (enemy.type === 'Súcubo Incandescente' && currentAtkForCalculation > 0) {
                    const heal = Math.floor(currentAtkForCalculation * 0.05);
                    e.hp = Math.min(e.maxHp, e.hp + heal);
                    addLog(`${t[enemy.type]} ${t.log_drain} ${heal} HP!`, 'enemy');
                }
                if (enemy.type === 'Aranha Tecelã' && Math.random() < 0.25) {
                    playerParalyzed = true;
                }
                if (POISONOUS_ENEMIES.includes(enemy.type) && !poisoned) {
                    if (enemy.type === 'Aberração Putrefata') {
                        poisoned = true;
                        setIsPoisonedInCombat(true);
                        addLog(`${t.poisoned}!!!`, 'enemy');
                    } else if (Math.random() < 0.3) {
                        poisoned = true;
                        setIsPoisonedInCombat(true);
                        addLog(`${t.poisoned}!`, 'enemy');
                    }
                }
                if (altarEffect?.id === 'mark_of_prey') {
                    pRef.current.hp = Math.max(1, pRef.current.hp - 2);
                    addLog(`${t.log_bleed} (-2 HP)`, 'enemy');
                }
            }

            // Apply Bleed Damage if active
            if (enemyBleeding && side === 'player' && e.hp > 0) {
                 const bleedDmg = Math.max(1, Math.floor(e.maxHp * 0.02)); // 2% per turn for permanent bleed
                 e.hp = Math.max(0, e.hp - bleedDmg);
                 addLog(`Sangramento: -${bleedDmg} HP`, 'info');
            }

            if (side === 'player') lastPlayerAttackTurn = turnCount;
            const msg = side === 'player' ? `${t.combat_player} ${t.combat_dealt} ${originalAtk} ${t.combat_damage}` : `${t.combat_enemy} ${t.combat_dealt} ${originalAtk} ${t.combat_damage}`;
            addLog(msg, side === 'player' ? 'player' : 'enemy');
            setCurrentPStats({ ...pRef.current }); setCurrentEStats({ ...e }); 
            setIsTakingDamage(side === 'player' ? 'enemy' : 'player');
            await new Promise(r => setTimeout(r, 650)); 
            setIsTakingDamage(null);
        };

        await processSide(turnOrder[0] as any);
        if (pRef.current.hp > 0 && e.hp > 0) {
            await new Promise(r => setTimeout(r, 200)); 
            await processSide(turnOrder[1] as any);
            
            if (enemyHasInitiative && pRef.current.hp > 0 && e.hp > 0) {
                 if(activePet && curPetHp > 0) {
                     let petAtk = Math.max(1, Math.floor(pRef.current.attack / 2));
                     if (relic?.id === 'collar') petAtk += 10;
                     e.hp -= petAtk; if (e.hp < 0) e.hp = 0;
                     addLog(`${t.combat_pet} ${t.combat_dealt} ${petAtk} ${t.combat_damage}`, 'pet');
                     setCurrentEStats({ ...e });
                     setIsTakingDamage('enemy');
                     await new Promise(r => setTimeout(r, 400)); 
                     setIsTakingDamage(null);
                 }
                 if(e.hp > 0 && activeFollower) {
                    let followerAtk = Math.max(1, Math.floor(pRef.current.attack * 0.25));
                    e.hp -= followerAtk; if (e.hp < 0) e.hp = 0;
                    const followerName = activeFollower.type === 'PRISONER' ? t.follower_prisoner : t.follower_knight;
                    addLog(`${followerName} ${t.combat_dealt} ${followerAtk} ${t.combat_damage}`, 'pet');
                    setCurrentEStats({ ...e });
                    setIsTakingDamage('enemy');
                    await new Promise(r => setTimeout(r, 400));
                    setIsTakingDamage(null);
                 }
            }

            if (pRef.current.hp > 0 && e.hp > 0) setTimeout(resolveTurn, 500);
            else setIsDone(true);
        } else { setIsDone(true); }
      };
      executeSequence();
    };
    setTimeout(resolveTurn, 600);
  }, [t]);

  const handleUsePotion = (idx: number) => {
    if (isDone) return;
    const pot = inventory![idx];
    if (onUsePotion(idx)) { 
      const stats = { ...pRef.current };
      const heal = Math.floor(stats.maxHp * (pot.percent / 100));
      stats.hp = Math.min(stats.maxHp, stats.hp + heal);
      pRef.current = stats;
      setCurrentPStats({ ...stats }); 
      addLog(`${t.potion_desc} ${pot.percent}${t.potion_desc_suffix}`, 'heal'); 
      setIsHealAnim(true);
      setTimeout(() => setIsHealAnim(false), 1200);
    }
  };

  const getPetIcon = (type: Pet['type']) => {
    switch(type) {
        case 'LOBO': return <Icon.Wolf width={30} height={30} />;
        case 'PUMA': return <Icon.Puma width={30} height={30} />;
        case 'CACHORRO': return <Icon.Dog width={30} height={30} />;
        case 'URSO': return <Icon.Panda width={30} height={30} />;
        case 'CORVO': return <Icon.Corvo width={30} height={30} />;
        default: return <Icon.Wolf width={30} height={30} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/98 flex items-center justify-center z-50 p-4 backdrop-blur-xl">
      <div className={`bg-[#0a0a0a] border max-w-lg w-full p-6 rounded-[2.5rem] shadow-2xl flex flex-col gap-6 ${isPoisonedInCombat ? 'border-green-900 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-[#222]'}`}>
        <div className="flex gap-4 items-stretch">
          <div className={`flex-1 flex flex-col items-center gap-4 p-5 rounded-[1.5rem] bg-[#111] border border-[#333] transition-all relative overflow-hidden ${isTakingDamage === 'player' ? 'animate-shake border-red-900' : ''} ${isHealAnim ? 'ring-4 ring-green-500/50 scale-105' : ''}`}>
             {isHealAnim && <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none" />}
             {isPoisonedInCombat && <div className="absolute inset-0 bg-green-900/10 pointer-events-none animate-pulse" />}
             <div className="flex items-center justify-center gap-4">
                <span className={`text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)] ${isHealAnim ? 'text-green-400' : ''} ${isPoisonedInCombat ? 'text-green-500' : ''}`}><Icon.Player width={40} height={40} /></span>
                {(activePet && petHp > 0) && (
                   <div className="flex flex-col items-center border-l border-[#333] pl-4">
                      <span className="text-orange-400 animate-pet-wiggle">
                        {getPetIcon(activePet.type)}
                      </span>
                   </div>
                )}
             </div>
             <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-[#222]">
                <div className={`h-full transition-all duration-[1000ms] ${isHealAnim ? 'bg-green-500' : 'bg-red-600'}`} style={{ width: `${(currentPStats.hp / currentPStats.maxHp) * 100}%` }} />
             </div>
             <span className={`text-[10px] font-black uppercase ${isHealAnim ? 'text-green-400 animate-bounce' : 'text-zinc-500'}`}>{currentPStats.hp} / {currentPStats.maxHp} HP</span>
          </div>
          <div className="flex items-center justify-center opacity-20 font-black">{t.vs}</div>
          <div className={`flex-1 flex flex-col items-center gap-4 p-5 rounded-[1.5rem] bg-[#111] border border-[#333] transition-all ${isTakingDamage === 'enemy' ? 'animate-shake border-red-900' : ''}`}>
             <span className={enemy.isBoss ? 'text-red-600' : 'text-zinc-500'}>
                 {enemy.isBoss ? <Icon.Ghost width={40} height={40} /> : <Icon.Enemy isBoss={enemy.isBoss} width={40} height={40} />}
             </span>
             <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-[#222]">
                <div className="h-full bg-zinc-700 transition-all duration-500" style={{ width: `${(currentEStats.hp / currentEStats.maxHp) * 100}%` }} />
             </div>
             <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">{t[enemy.type] || enemy.type}</span>
          </div>
        </div>
        <div className="bg-[#050505] border border-[#222] rounded-2xl p-5 h-44 overflow-hidden flex flex-col">
          <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-2 border-b border-[#111] pb-1">{t.turn_log_title}</p>
          <div ref={scrollRef} className="overflow-y-auto h-full space-y-2 no-scrollbar font-mono text-[11px] font-bold">
            {combatLogs.map((log, i) => (
              <p key={i} className={log.type === 'player' ? 'text-zinc-400' : log.type === 'enemy' ? 'text-red-500' : log.type === 'pet' ? 'text-purple-500' : log.type === 'heal' ? 'text-green-400' : 'text-yellow-600'}>
                {log.msg}
              </p>
            ))}
          </div>
        </div>
        {!isDone && inventory.length > 0 && (
          <div className="flex justify-center gap-2 p-3 bg-[#111] rounded-2xl border border-[#222]">
            {inventory.slice(0, 5).map((pot, i) => (
              <button key={i} onClick={() => handleUsePotion(i)} className={`flex items-center gap-2 px-3 py-1 ${pot.type === 'ANTIDOTE' ? 'bg-green-950/10 border-green-500/20 text-green-500' : 'bg-pink-950/10 border-pink-500/20 text-pink-500'} border rounded-xl hover:opacity-80 transition-all`}>
                {pot.type === 'ANTIDOTE' ? <Icon.Antidote width={14} height={14} /> : <Icon.Potion width={14} height={14} />} 
                <span className="text-[9px] font-black">{pot.type === 'ANTIDOTE' ? 'CURA' : `${pot.percent}%`}</span>
              </button>
            ))}
          </div>
        )}
        {isDone && (
          <button onClick={() => onFinish(currentPStats, currentPStats.hp > 0, Math.floor(Math.random() * 21) + 10, petHp, isPoisonedInCombat)} className={`w-full font-black py-5 rounded-2xl uppercase text-[12px] tracking-[0.2em] transition-all ${currentPStats.hp > 0 ? "bg-green-600 text-white hover:bg-green-500" : "bg-red-800 text-white hover:bg-red-700"}`}>
            {currentPStats.hp > 0 ? t.collect_reward : t.succumb}
          </button>
        )}
      </div>
    </div>
  );
};

// ... (Rest of Modal Components)
// Retaining original implementation for other modals to save space in output, ensuring they are not lost.
// Explicitly providing them below to match file replacement rules.

export const NPCInteractionModal: React.FC<{ npc: NPC, language: Language, gold: number, inventory: PotionEntity[], onChoice: (choice: 1|2|3|4) => void }> = ({ npc, language, gold, inventory, onChoice }) => {
    const t = TRANSLATIONS[language];
    const npcKey = `npc_${npc.type.toLowerCase()}`;
    const colorClass = NPC_COLORS[npc.type] || 'text-zinc-400';
    const hasPotion = inventory.some(p => p.type !== 'ANTIDOTE');
    const hasAntidote = inventory.some(p => p.type === 'ANTIDOTE');
    
    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[70] p-4 backdrop-blur-md">
            <div className="bg-[#0a0a0a] border border-zinc-800 p-8 rounded-[2.5rem] max-w-sm w-full text-center space-y-8 animate-in zoom-in-95 shadow-2xl">
                <div className={`${colorClass} flex justify-center scale-150 mb-4 animate-pulse drop-shadow-[0_0_15px_currentColor]`}>
                    <Icon.Player width={64} height={64} />
                </div>
                <div>
                   <h3 className={`text-xl font-black uppercase tracking-tighter mb-2 ${colorClass}`}>{t[`${npcKey}_name`]}</h3>
                   <p className="text-zinc-400 text-xs font-mono leading-relaxed px-2">
                       {t[`${npcKey}_desc`]}
                   </p>
                </div>
                
                <div className="space-y-3">
                   <button 
                     onClick={() => onChoice(1)} 
                     disabled={(npc.type === 'MERCHANT_WOUNDED' && !hasPotion) || (npc.type === 'ALCHEMIST' && !hasAntidote) || (npc.type === 'GUARD' && !hasAntidote) || (npc.type === 'CARTOGRAPHER' && gold < 80) || (npc.type === 'IDOL' && gold < 100)}
                     className="w-full py-4 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-[0.1em] text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
                   >
                      <span>{t[`${npcKey}_c1`]}</span>
                      {(npc.type === 'MERCHANT_WOUNDED' && !hasPotion) && <span className="absolute right-4 text-[8px] text-red-500">{t.no_potion}</span>}
                      {(npc.type === 'ALCHEMIST' && !hasAntidote) && <span className="absolute right-4 text-[8px] text-red-500">{t.no_antidote}</span>}
                      {(npc.type === 'GUARD' && !hasAntidote) && <span className="absolute right-4 text-[8px] text-red-500">{t.no_antidote}</span>}
                      {(npc.type === 'CARTOGRAPHER' && gold < 80) && <span className="absolute right-4 text-[8px] text-red-500">{t.no_gold}</span>}
                      {(npc.type === 'IDOL' && gold < 100) && <span className="absolute right-4 text-[8px] text-red-500">{t.no_gold}</span>}
                   </button>
                   <button 
                     onClick={() => onChoice(2)} 
                     disabled={(npc.type === 'MERCHANT_WOUNDED' && gold < 50) || (npc.type === 'VOICE' && gold < 50)}
                     className="w-full py-4 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-[0.1em] text-xs transition-all disabled:opacity-30"
                   >
                      <span>{t[`${npcKey}_c2`]}</span>
                      {(npc.type === 'MERCHANT_WOUNDED' && gold < 50) && <span className="absolute right-4 text-[8px] text-red-500">{t.no_gold}</span>}
                      {(npc.type === 'VOICE' && gold < 50) && <span className="absolute right-4 text-[8px] text-red-500">{t.no_gold}</span>}
                   </button>
                   <button onClick={() => onChoice(3)} className="w-full py-4 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-400 font-black rounded-2xl uppercase tracking-[0.1em] text-xs transition-all">
                      {t[`${npcKey}_c3`]}
                   </button>
                   {npc.type === 'MERCHANT_WOUNDED' && (
                       <button onClick={() => onChoice(4)} className="w-full py-4 bg-red-900/20 border border-red-900/50 hover:bg-red-900/40 text-red-400 font-black rounded-2xl uppercase tracking-[0.1em] text-xs transition-all">
                          {t[`${npcKey}_c4`]}
                       </button>
                   )}
                </div>
            </div>
        </div>
    );
};

export const ChestModal: React.FC<{ language: Language, onChoice: (choice: StatChoice, extra?: 'gold') => void }> = ({ language, onChoice }) => {
  const t = TRANSLATIONS[language];
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border-2 border-blue-500/50 p-6 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-[0_0_30px_rgba(59,130,246,0.2)] animate-in zoom-in-95">
        <div className="text-blue-400 flex justify-center scale-150 mb-4"><Icon.Chest width={48} height={48} /></div>
        <h3 className="text-xl font-black text-white uppercase tracking-widest">{t.chest_title}</h3>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => onChoice('Ataque')} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-center gap-3 group">
            <span className="text-yellow-500 group-hover:scale-110 transition-transform"><Icon.Sword /></span>
            <span className="font-bold text-zinc-300 uppercase text-xs tracking-wider">{t.stat_attack} (+5)</span>
          </button>
          <button onClick={() => onChoice('Armadura')} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-center gap-3 group">
            <span className="text-blue-500 group-hover:scale-110 transition-transform"><Icon.Shield /></span>
            <span className="font-bold text-zinc-300 uppercase text-xs tracking-wider">{t.stat_armor} (+3)</span>
          </button>
          <button onClick={() => onChoice('Velocidade')} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-center gap-3 group">
            <span className="text-green-500 group-hover:scale-110 transition-transform"><Icon.Zap /></span>
            <span className="font-bold text-zinc-300 uppercase text-xs tracking-wider">{t.stat_speed} (+2)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const MerchantShopModal: React.FC<{
  gold: number;
  level: number;
  hasPet: boolean;
  language: Language;
  activeAltarEffect?: AltarEffect;
  hasCompass?: boolean;
  hasMap?: boolean;
  inventorySize: number;
  onBuyItem: (item: ItemEntity) => void;
  onBuyPotion: (pot: PotionEntity, choice: 'use' | 'store') => void;
  onRentTron: () => void;
  onBuyCompass: () => void;
  onBuyMap: () => void;
  onBuyAntidote: (choice: 'use' | 'store') => void;
  onBuyInventorySlot: () => void;
  onBuyPet: (type: Pet['type']) => void;
  onClose: () => void;
}> = (props) => {
  const t = TRANSLATIONS[props.language];
  const [shopItems] = useState(() => {
    const pool = [...ITEM_POOL].sort(() => 0.5 - Math.random());
    return pool.slice(0, 3).map((item, i) => ({ ...item, id: `shop-item-${i}`, x: 0, y: 0 }));
  });

  const getPrice = (base: number) => {
      if (props.activeAltarEffect?.id === 'merchant_blessing') {
          return Math.floor(base * 0.8);
      }
      return base;
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-xl">
      <div className="bg-[#0f0f0f] border border-zinc-800 p-6 rounded-[2rem] max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl relative">
        <div className="flex items-center gap-4 mb-8">
            <div className="text-indigo-400"><Icon.Merchant width={40} height={40}/></div>
            <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t.merchant_title}</h3>
                <div className="flex items-center gap-2 text-yellow-500 font-bold bg-yellow-900/10 px-3 py-1 rounded-full w-fit mt-1"><Icon.Gold /> <span>{props.gold}</span></div>
            </div>
        </div>
        
        <div className="overflow-y-auto pr-2 space-y-8 flex-1">
             <section>
                 <h4 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-4 border-b border-zinc-800 pb-2">Equipamentos</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {shopItems.map(item => {
                         const price = getPrice(item.price || 0);
                         return (
                             <button key={item.id} disabled={props.gold < price} onClick={() => props.onBuyItem({...item, price})} className="bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl text-left transition-all disabled:opacity-30 flex flex-col gap-2 group">
                                 <div className="flex justify-between items-start">
                                     <span className={item.iconType === 'sword' ? 'text-yellow-500' : item.iconType === 'shield' ? 'text-blue-500' : item.iconType === 'zap' ? 'text-green-500' : 'text-red-500'}>
                                         {item.iconType === 'sword' ? <Icon.Sword /> : item.iconType === 'shield' ? <Icon.Shield /> : item.iconType === 'zap' ? <Icon.Zap /> : <Icon.Heart />}
                                     </span>
                                     <span className="text-yellow-500 font-bold text-xs">{price} G</span>
                                 </div>
                                 <div>
                                     <p className="font-bold text-zinc-300 text-sm group-hover:text-white">{t[item.name]}</p>
                                     <p className="text-[10px] text-zinc-500 uppercase font-bold">+{item.value} {t.shop_attribute}</p>
                                 </div>
                             </button>
                         )
                     })}
                 </div>
             </section>

             <section>
                 <h4 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-4 border-b border-zinc-800 pb-2">Consumíveis</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3">
                         <div className="flex justify-between"><span className="text-pink-400"><Icon.Potion /></span><span className="text-yellow-500 font-bold text-xs">{getPrice(50)} G</span></div>
                         <p className="text-xs font-bold text-zinc-400">Poção (50%)</p>
                         <div className="flex gap-2 mt-auto">
                             <button onClick={() => props.onBuyPotion({id:`p-${Date.now()}`, percent:50, x:0,y:0}, 'use')} disabled={props.gold < getPrice(50)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-30">{t.use}</button>
                             <button onClick={() => props.onBuyPotion({id:`p-${Date.now()}`, percent:50, x:0,y:0}, 'store')} disabled={props.gold < getPrice(50)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-30">{t.store}</button>
                         </div>
                     </div>
                     <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3">
                         <div className="flex justify-between"><span className="text-green-400"><Icon.Antidote /></span><span className="text-yellow-500 font-bold text-xs">{getPrice(50)} G</span></div>
                         <p className="text-xs font-bold text-zinc-400">Antídoto</p>
                         <div className="flex gap-2 mt-auto">
                             <button onClick={() => props.onBuyAntidote('use')} disabled={props.gold < getPrice(50)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-30">{t.use}</button>
                             <button onClick={() => props.onBuyAntidote('store')} disabled={props.gold < getPrice(50)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-30">{t.store}</button>
                         </div>
                     </div>
                 </div>
             </section>
             
             <section>
                 <h4 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-4 border-b border-zinc-800 pb-2">Especiais</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button disabled={props.hasCompass || props.gold < getPrice(90)} onClick={props.onBuyCompass} className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-cyan-500/50 disabled:opacity-30 text-left">
                         <div className="text-cyan-400 bg-cyan-900/20 p-3 rounded-lg"><Icon.Compass /></div>
                         <div>
                             <p className="font-bold text-zinc-200">Bússola</p>
                             <p className="text-[10px] text-zinc-500">Mostra caminho inimigos</p>
                             <p className="text-yellow-500 font-bold text-xs mt-1">{getPrice(90)} G</p>
                         </div>
                     </button>
                     <button disabled={props.hasMap || props.gold < getPrice(90)} onClick={props.onBuyMap} className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-emerald-500/50 disabled:opacity-30 text-left">
                         <div className="text-emerald-500 bg-emerald-900/20 p-3 rounded-lg"><Icon.Map /></div>
                         <div>
                             <p className="font-bold text-zinc-200">Mapa</p>
                             <p className="text-[10px] text-zinc-500">Mostra caminho saída</p>
                             <p className="text-yellow-500 font-bold text-xs mt-1">{getPrice(90)} G</p>
                         </div>
                     </button>
                     <button disabled={props.inventorySize >= 50 || props.gold < getPrice(250)} onClick={props.onBuyInventorySlot} className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-500 disabled:opacity-30 text-left">
                         <div className="text-zinc-400 bg-zinc-800 p-3 rounded-lg"><Icon.Backpack /></div>
                         <div>
                             <p className="font-bold text-zinc-200">{props.inventorySize >= 50 ? t.shop_max : t.shop_bag}</p>
                             <p className="text-[10px] text-zinc-500">{t.shop_bag_desc}</p>
                             <p className="text-yellow-500 font-bold text-xs mt-1">{getPrice(250)} G</p>
                         </div>
                     </button>
                     <button onClick={props.onRentTron} disabled={props.gold < getPrice(25)} className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-cyan-400 disabled:opacity-30 text-left">
                         <div className="text-cyan-400 bg-cyan-900/20 p-3 rounded-lg"><Icon.Horse /></div>
                         <div>
                             <p className="font-bold text-zinc-200">{t.shop_ghost_horse}</p>
                             <p className="text-[10px] text-zinc-500">{t.shop_ghost_desc}</p>
                             <p className="text-yellow-500 font-bold text-xs mt-1">{getPrice(25)} G</p>
                         </div>
                     </button>
                 </div>
             </section>

             {!props.hasPet && (
                 <section>
                     <h4 className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-4 border-b border-zinc-800 pb-2">Companheiros</h4>
                     <div className="grid grid-cols-2 gap-4">
                         <button onClick={() => props.onBuyPet('CACHORRO')} disabled={props.gold < getPrice(10)} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-orange-500/50 disabled:opacity-30 flex flex-col items-center gap-2">
                             <Icon.Dog width={24} height={24} className="text-orange-400" />
                             <span className="font-bold text-xs text-zinc-300">{t.pet_cachorro}</span>
                             <span className="text-yellow-500 text-xs font-bold">{getPrice(10)} G</span>
                         </button>
                         <button onClick={() => props.onBuyPet('URSO')} disabled={props.gold < getPrice(15)} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-orange-500/50 disabled:opacity-30 flex flex-col items-center gap-2">
                             <Icon.Panda width={24} height={24} className="text-orange-400" />
                             <span className="font-bold text-xs text-zinc-300">{t.pet_urso}</span>
                             <span className="text-yellow-500 text-xs font-bold">{getPrice(15)} G</span>
                         </button>
                     </div>
                 </section>
             )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-zinc-800">
            <button onClick={props.onClose} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-xl uppercase tracking-widest text-xs">{t.exit}</button>
        </div>
      </div>
    </div>
  );
};

export const InventoryFullModal: React.FC<{ language: Language, onClose: () => void }> = ({ language, onClose }) => {
    const t = TRANSLATIONS[language];
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[150] p-6 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-zinc-900 border-2 border-red-500/50 p-8 rounded-[2rem] max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 shadow-[0_0_40px_rgba(239,68,68,0.2)]" onClick={e => e.stopPropagation()}>
                <div className="text-red-500 flex justify-center scale-150 mb-2 animate-pulse"><Icon.Backpack width={48} height={48} /></div>
                <div>
                   <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">{t.inventory_full_title}</h3>
                   <p className="text-zinc-400 font-mono text-xs">{t.inventory_full}</p>
                </div>
                <button onClick={onClose} className="w-full py-4 bg-red-900/80 hover:bg-red-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs">{t.inventory_full_btn}</button>
            </div>
        </div>
    );
};

export const TutorialModal: React.FC<{ language: Language, onFinish: () => void }> = ({ language, onFinish }) => {
    const t = TRANSLATIONS[language];
    const [step, setStep] = useState(0);

    const steps = [
        { icon: <Icon.Swords width={48} height={48} />, title: t.tut_prove_title, desc: t.tut_prove_desc },
        { icon: <Icon.Key width={48} height={48} />, title: t.tut_key_title, desc: t.tut_key_desc },
        { icon: <Icon.Ladder width={48} height={48} />, title: t.tut_stairs_title, desc: t.tut_stairs_desc },
        { icon: <Icon.Swords width={48} height={48} />, title: t.tut_battle_title, desc: t.tut_battle_desc },
        { icon: <Icon.Activity width={48} height={48} />, title: t.tut_attr_title, isAttr: true },
        { icon: <Icon.Activity width={48} height={48} />, title: t.tut_init_title, desc: t.tut_init_desc },
        { icon: <Icon.ShoppingBag width={48} height={48} />, title: t.tut_merchant_title, desc: t.tut_merchant_desc },
        { icon: <Icon.TriangleAlert width={48} height={48} />, title: t.tut_choice_title, desc: t.tut_choice_desc },
        { icon: <Icon.Play width={48} height={48} />, title: t.tut_end_title, desc: t.tut_end_desc },
    ];

    const currentStep = steps[step];
    const isLast = step === steps.length - 1;

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[80] p-6 backdrop-blur-md">
            <div className="bg-[#0f0f0f] border-2 border-zinc-800 p-8 rounded-[2.5rem] max-w-sm w-full text-center space-y-8 animate-in zoom-in-95 shadow-2xl relative">
                <div className="text-red-600 flex justify-center scale-110 mb-4 animate-pulse">
                    {currentStep.icon}
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-4">{currentStep.title}</h2>
                    {currentStep.isAttr ? (
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                                <div className="flex items-center gap-2 mb-1 text-red-500"><Icon.Heart width={14} height={14} /><span className="text-[9px] font-black uppercase">Vida</span></div>
                                <p className="text-[8px] text-zinc-400 font-mono leading-tight">{t.tut_attr_hp}</p>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                                <div className="flex items-center gap-2 mb-1 text-yellow-500"><Icon.Sword width={14} height={14} /><span className="text-[9px] font-black uppercase">Ataque</span></div>
                                <p className="text-[8px] text-zinc-400 font-mono leading-tight">{t.tut_attr_atk}</p>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                                <div className="flex items-center gap-2 mb-1 text-blue-500"><Icon.Shield width={14} height={14} /><span className="text-[9px] font-black uppercase">Armadura</span></div>
                                <p className="text-[8px] text-zinc-400 font-mono leading-tight">{t.tut_attr_def}</p>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                                <div className="flex items-center gap-2 mb-1 text-green-500"><Icon.Zap width={14} height={14} /><span className="text-[9px] font-black uppercase">Velocidade</span></div>
                                <p className="text-[8px] text-zinc-400 font-mono leading-tight">{t.tut_attr_spd}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-zinc-400 font-mono text-sm leading-relaxed px-2">
                            {currentStep.desc}
                        </p>
                    )}
                </div>
                
                <div className="flex gap-2 mt-4">
                    {step > 0 && (
                        <button onClick={() => setStep(step - 1)} className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-black rounded-2xl uppercase tracking-widest text-xs transition-all">
                            {t.back}
                        </button>
                    )}
                    <button onClick={() => isLast ? onFinish() : setStep(step + 1)} className={`flex-[2] py-4 font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg transform active:scale-95 transition-all ${isLast ? 'bg-red-800 hover:bg-red-700 text-white shadow-red-900/20' : 'bg-white text-black hover:bg-zinc-200'}`}>
                        {isLast ? t.start : t.next}
                    </button>
                </div>
                
                <div className="flex justify-center gap-1.5 mt-6">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-red-600' : 'w-2 bg-zinc-800'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export const LevelCompleteModal: React.FC<{ 
    language: Language, 
    stats: { kills: number, gold: number },
    onDescend: () => void 
}> = ({ language, stats, onDescend }) => {
    const t = TRANSLATIONS[language];
    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-6 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-green-900/30 p-8 rounded-[2.5rem] max-w-sm w-full text-center space-y-8 animate-in zoom-in-95 shadow-[0_0_50px_rgba(20,83,45,0.2)]">
                <div className="text-green-600 flex justify-center scale-150 mb-4 animate-bounce">
                    <Icon.Stairs width={48} height={48} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{t.level_complete}</h2>
                    <p className="text-zinc-400 font-mono text-xs leading-relaxed">{t.next_level_desc}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t.blood}</span>
                        <div className="flex items-center gap-2 text-red-500 font-black text-lg">
                            <Icon.Enemy width={16} height={16} /> <span>{stats.kills}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center border-l border-zinc-800">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t.shop_coins}</span>
                        <div className="flex items-center gap-2 text-yellow-500 font-black text-lg">
                            <Icon.Gold width={16} height={16} /> <span>{stats.gold}</span>
                        </div>
                    </div>
                </div>

                <button onClick={onDescend} className="w-full py-5 bg-green-900 hover:bg-green-800 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-lg shadow-green-900/20 transition-all transform active:scale-95">
                    {t.descend_btn}
                </button>
            </div>
        </div>
    );
};

export const PotionPickupModal: React.FC<{ potion: PotionEntity, language: Language, onChoice: (choice: 'use' | 'store') => void }> = ({ potion, language, onChoice }) => {
    const t = TRANSLATIONS[language];
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-pink-500/30 p-8 rounded-[2rem] max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 shadow-[0_0_40px_rgba(236,72,153,0.15)]">
                <div className="text-pink-400 flex justify-center scale-150 mb-2 animate-bounce"><Icon.Potion width={48} height={48} /></div>
                <div>
                   <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1">{t.potion_found}</h3>
                   <p className="text-pink-400 font-bold text-sm">{t.potion_desc} {potion.percent}{t.potion_desc_suffix}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onChoice('use')} className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-bold uppercase text-xs">{t.use}</button>
                    <button onClick={() => onChoice('store')} className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-bold uppercase text-xs">{t.store}</button>
                </div>
            </div>
        </div>
    );
};

export const RelicSelectionModal: React.FC<{ options: Relic[], language: Language, onSelect: (relic: Relic) => void }> = ({ options, language, onSelect }) => {
    const t = TRANSLATIONS[language];
    return (
        <div className="fixed inset-0 bg-black z-[100] overflow-y-auto">
            <div className="min-h-full flex flex-col items-center justify-center p-4 py-12">
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-12 animate-in fade-in slide-in-from-top-10 text-center">{t.relic_choice}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
                    {options.map((relic, i) => (
                        <button key={relic.id} onClick={() => onSelect(relic)} className="bg-zinc-900/50 border border-zinc-800 hover:border-purple-500 hover:bg-purple-900/10 p-8 rounded-3xl flex flex-col items-center gap-6 group transition-all duration-300 hover:-translate-y-2 relative overflow-hidden w-full">
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                            <div className="text-zinc-600 group-hover:text-purple-400 transition-colors scale-150 p-4 rounded-full bg-zinc-950 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                                 {React.createElement((Icon as any)[relic.icon], { width: 48, height: 48 })}
                            </div>
                            <div className="text-center z-10">
                                <h3 className="text-xl font-black text-white uppercase mb-3">{t[relic.name]}</h3>
                                <p className="text-zinc-400 text-xs font-mono leading-relaxed">{t[relic.description]}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const AltarInteractionModal: React.FC<{ language: Language, active: boolean, onPray: () => void, onClose: () => void }> = ({ language, active, onPray, onClose }) => {
    const t = TRANSLATIONS[language];
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#0f0f0f] border-2 border-purple-900/50 p-8 rounded-[2.5rem] max-w-sm w-full text-center space-y-8 shadow-[0_0_50px_rgba(88,28,135,0.3)] animate-in zoom-in-95">
                 <div className="text-purple-600 flex justify-center scale-[2] mb-4 animate-pulse"><Icon.Altar /></div>
                 <div>
                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{t.altar_title}</h3>
                     <p className="text-zinc-500 font-mono text-xs px-4">{active ? t.altar_prompt : t.altar_inactive}</p>
                 </div>
                 <div className="space-y-3">
                     {active ? (
                         <button onClick={onPray} className="w-full py-4 bg-purple-900 hover:bg-purple-800 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-lg shadow-purple-900/20">{t.altar_button}</button>
                     ) : (
                         <button onClick={onClose} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black rounded-2xl uppercase tracking-[0.2em] text-xs">{t.close}</button>
                     )}
                     {active && <button onClick={onClose} className="text-xs text-zinc-600 font-bold uppercase hover:text-white transition-colors">{t.close}</button>}
                 </div>
            </div>
        </div>
    );
};

export const AltarResultModal: React.FC<{ effect: AltarEffect, language: Language, onClose: () => void }> = ({ effect, language, onClose }) => {
    const t = TRANSLATIONS[language];
    const isBlessing = effect.type === 'BLESSING';
    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
            <div className={`bg-zinc-950 border-2 ${isBlessing ? 'border-yellow-600/50' : 'border-red-900/50'} p-8 rounded-[2.5rem] max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 shadow-2xl`}>
                <div className={`${isBlessing ? 'text-yellow-500' : 'text-red-600'} flex justify-center scale-[2] mb-6`}>
                    {isBlessing ? <Icon.Sparkles /> : <Icon.Skull />}
                </div>
                <div>
                    <h3 className={`text-xl font-black uppercase tracking-widest mb-2 ${isBlessing ? 'text-yellow-500' : 'text-red-500'}`}>{t[effect.nameKey]}</h3>
                    <p className="text-zinc-400 font-mono text-xs leading-relaxed">{t[effect.descKey]}</p>
                </div>
                <button onClick={onClose} className="w-full py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs">{t.close}</button>
            </div>
        </div>
    );
};

export const EggStoryModal: React.FC<{ language: Language, onAccept: () => void }> = ({ language, onAccept }) => {
    const t = TRANSLATIONS[language];
    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-6 backdrop-blur-xl">
             <div className="max-w-md w-full text-center space-y-8 animate-in slide-in-from-bottom-4">
                 <div className="text-indigo-400 flex justify-center scale-[3] mb-8 animate-bounce"><Icon.Egg /></div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter">O Ovo Misterioso</h2>
                 <p className="text-zinc-400 font-mono text-sm leading-relaxed">Você encontra um ovo pulsando com energia sombria. Ao tocá-lo, ele racha e um pequeno corvo de olhos violeta emerge, encarando sua alma.</p>
                 <button onClick={onAccept} className="w-full py-5 bg-indigo-900 hover:bg-indigo-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-2xl shadow-indigo-900/20">{t.inventory_full_btn}</button>
             </div>
        </div>
    );
};

export const RewardSuccessModal: React.FC<{ type: 'GOLD'|'OST'|'CROW', language: Language, onClose: () => void }> = ({ type, language, onClose }) => {
    const t = TRANSLATIONS[language];
    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] p-6 backdrop-blur-xl">
            <div className="bg-zinc-900 border-2 border-green-500/50 p-8 rounded-[2.5rem] max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                <div className="text-green-500 flex justify-center scale-[2] mb-4"><Icon.Sparkles /></div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t.gold_reward_title}</h3>
                <p className="text-zinc-400 font-mono text-xs">{type === 'GOLD' ? t.gold_reward_msg : type === 'CROW' ? t.unlock_success_desc : t.ost_desc}</p>
                <button onClick={onClose} className="w-full py-4 bg-green-900 hover:bg-green-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs">{t.close}</button>
            </div>
        </div>
    );
};
