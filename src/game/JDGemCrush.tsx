import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameScreen, SaveData, BoosterType, Pos, Cell, LevelDef } from './engine/types';
import { loadSave, writeSave } from './engine/save';
import { LEVELS } from './data/levels';
import { sfx } from './audio/sfx';
import { buildGrid, cloneGrid, swapInGrid, isAdj, collapseAndFill } from './engine/grid';
import { findMatchLines, hasAnyMatch, anyValidMove, findHintMove } from './engine/match';
import { analyzeMatches, activateSpecials, handleSpecialCombo, SpecialCreation } from './engine/specials';
import { updateObjectives, allObjectivesComplete } from './engine/objectives';
import { damageObstacle, getAdjacentObstacles } from './engine/obstacles';
import { MAX_GEMS, COLS, ROWS } from './engine/constants';
import { MainMenu } from './components/MainMenu';
import { WorldMap } from './components/WorldMap';
import { GameHUD } from './components/GameHUD';
import { GameBoard } from './components/GameBoard';
import { StorePanel } from './components/StorePanel';
import { StatsPanel } from './components/StatsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { GEM_STYLES } from './components/GemVisual';

const GAME_CSS = `
@keyframes gc-float { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-50px) scale(1.4);opacity:0} }
@keyframes gc-pop { 0%{transform:scale(1);opacity:1} 40%{transform:scale(1.4);opacity:.6} 100%{transform:scale(0);opacity:0} }
@keyframes gc-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
@keyframes gc-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
@keyframes gc-drop { 0%{transform:translateY(-130%);opacity:0} 50%{opacity:1} 70%{transform:translateY(8%)} 100%{transform:translateY(0)} }
@keyframes gc-overlay { 0%{transform:scale(.7);opacity:0} 60%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
@keyframes gc-shine { 0%{left:-100%} 100%{left:200%} }
@keyframes gc-bomb-spin { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
@keyframes gc-stripe-move { 0%{background-position:0 0} 100%{background-position:10px 0} }
@keyframes gc-wrapped-glow { 0%,100%{box-shadow:0 0 4px var(--glow)} 50%{box-shadow:0 0 14px var(--glow), 0 0 24px var(--glow)} }
@keyframes gc-hint-shake { 0%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(-15deg) scale(1.1)} 50%{transform:rotate(15deg) scale(1.1)} 75%{transform:rotate(-15deg) scale(1.1)} 100%{transform:rotate(0deg) scale(1)} }
@keyframes gc-combo-bounce { 0%{transform:scale(0)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
@keyframes bg-gradient-flow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes gc-fade-in { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes gc-glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(255,255,255,0.2)} 50%{box-shadow:0 0 40px rgba(255,255,255,0.5)} }
@keyframes gc-float-particle { 0%{transform:translateY(100vh) scale(0);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(-10vh) scale(1);opacity:0} }
@keyframes gc-crystal-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes gc-crystal-glow { 0%,100%{filter:drop-shadow(0 0 10px rgba(255,255,255,0.3))} 50%{filter:drop-shadow(0 0 25px rgba(255,255,255,0.8))} }
`;

function GameScreenComponent({ levelNum, levelDef, save, onSave, onBack, onNextLevel }: {
  levelNum: number | 'daily'; levelDef: LevelDef; save: SaveData; onSave: (s: SaveData) => void; onBack: () => void; onNextLevel: () => void;
}) {
  const gemCount = levelDef.gemCount || MAX_GEMS;

  const [grid, setGrid] = useState<Cell[][]>(() => buildGrid(gemCount));
  const [sel, setSel] = useState<Pos | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(levelDef.moves);
  const [combo, setCombo] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'none' | 'win' | 'lose'>('none');
  const [matchedSet, setMatchedSet] = useState<Set<string>>(new Set());
  const [shaking, setShaking] = useState<string | null>(null);
  const [floats, setFloats] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);
  const [flashRows, setFlashRows] = useState<Set<number>>(new Set());
  const [flashCols, setFlashCols] = useState<Set<number>>(new Set());
  const [activeBooster, setActiveBooster] = useState<BoosterType | null>(null);
  
  // Hint system
  useEffect(() => {
    if (busy || result !== 'none' || save.settings?.reducedMotion) return;
    
    const timer = setTimeout(() => {
      const hint = findHintMove(grid);
      if (hint) {
        setShaking(`${hint[0].r},${hint[0].c}|${hint[1].r},${hint[1].c}`);
        setTimeout(() => setShaking(null), 1500); // Shake for 1.5s
      }
    }, 5000);
    
    return () => {
      clearTimeout(timer);
      // Don't clear shaking on unmount here to avoid jarring cuts, it clears via its own timeout or user tap
    };
  }, [grid, busy, result, save.settings?.reducedMotion]);

  // V3 Features
  const [objectives, setObjectives] = useState<import('./engine/objectives').ObjectiveProgress[]>(() => {
    const { initializeObjectives } = require('./engine/objectives');
    return initializeObjectives(levelDef.objectives || []);
  });
  const [obstacles, setObstacles] = useState<import('./engine/obstacles').Obstacle[]>(() => {
    const { createObstacle } = require('./engine/obstacles');
    return (levelDef.initialObstacles || []).map(o => createObstacle(o.type, o.pos, o.layers));
  });

  sfx.enabled = save.soundOn;

  const flashEffect = useCallback((removed: Set<string>) => {
    const rows = new Set<number>();
    const cols = new Set<number>();
    for (const key of removed) {
      const [r, c] = key.split(',').map(Number);
      let rowCount = 0, colCount = 0;
      for (const k of removed) {
        const [kr, kc] = k.split(',').map(Number);
        if (kr === r) rowCount++;
        if (kc === c) colCount++;
      }
      if (rowCount >= COLS - 1) rows.add(r);
      if (colCount >= ROWS - 1) cols.add(c);
    }
    if (rows.size > 0 || cols.size > 0) {
      setFlashRows(rows);
      setFlashCols(cols);
      setTimeout(() => { setFlashRows(new Set()); setFlashCols(new Set()); }, 400);
    }
  }, []);

  const cascade = useCallback(async (g: Cell[][], startCombo: number, swapPos?: Pos) => {
    let cur = cloneGrid(g);
    let c = startCombo;
    let floatId = Date.now();

    while (true) {
      const { toRemove, specials } = analyzeMatches(cur, c === 0 ? swapPos : undefined);
      if (toRemove.size === 0) break;

      c++;
      const fullRemove = activateSpecials(cur, toRemove);
      flashEffect(fullRemove);

      setMatchedSet(new Set(fullRemove));
      setGrid(cloneGrid(cur));
      if (c > 1) sfx.cascade(); else sfx.match(c);

      let hadSpecialActivation = false;
      let objEvents: any[] = [];
      
      setObstacles(prevObs => {
        let newObs = [...prevObs];
        for (const key of fullRemove) {
          const [r, cc] = key.split(',').map(Number);
          const cell = cur[r][cc];
          
          if (cell.special !== 'none') hadSpecialActivation = true;
          objEvents.push({ type: 'collect', amount: 1, color: cell.color });

          // Damage adjacent obstacles
          const adjObs = getAdjacentObstacles({ r, c: cc }, newObs);
          for (const obs of adjObs) {
            const damaged = damageObstacle(obs);
            if (!damaged) {
              objEvents.push({ type: 'clear_obstacle', amount: 1, obstacleType: obs.type });
              newObs = newObs.filter(o => o.id !== obs.id);
            } else {
              const idx = newObs.findIndex(o => o.id === obs.id);
              if (idx >= 0) newObs[idx] = damaged;
            }
          }
        }
        return newObs;
      });

      if (hadSpecialActivation) sfx.special();

      const pts = fullRemove.size * 50 * c;
      objEvents.push({ type: 'score', amount: pts });
      
      setScore(s => s + pts);
      setCombo(c);
      setObjectives(prev => updateObjectives(prev, objEvents));

      // Update stats
      onSave({
        ...save,
        stats: {
          ...save.stats,
          gemsDestroyed: save.stats.gemsDestroyed + fullRemove.size,
          obstaclesCleared: save.stats.obstaclesCleared + objEvents.filter(e => e.type === 'clear_obstacle').length
        }
      });

      const positions = Array.from(fullRemove).map(s => { const [r, cc] = s.split(',').map(Number); return { r, c: cc }; });
      const cr = positions.reduce((a, p) => a + p.r, 0) / positions.length;
      const cc2 = positions.reduce((a, p) => a + p.c, 0) / positions.length;
      const GEM_COLORS = ['#ff4d4d', '#4da6ff', '#5cd65c', '#ffdb4d', '#d24dff', '#ff9933'];
      const mainColor = GEM_COLORS[cur[positions[0].r][positions[0].c].color] || '#fff';
      
      const cp = 40; // Approx px, relative floating is ok
      setFloats(prev => [...prev, {
        id: floatId++, x: cc2 * cp + cp / 2, y: cr * cp + cp / 2,
        text: c > 1 ? `🔥${c}x +${pts}` : `+${pts}`, color: mainColor,
      }]);
      setTimeout(() => setFloats(prev => prev.slice(1)), 900);

      await new Promise(r => setTimeout(r, 350));

      for (const sp of specials) {
        if (!fullRemove.has(`${sp.pos.r},${sp.pos.c}`) || specials.some(s => s.pos.r === sp.pos.r && s.pos.c === sp.pos.c)) {
          cur[sp.pos.r][sp.pos.c] = { ...cur[sp.pos.r][sp.pos.c], special: sp.special, matched: false };
          fullRemove.delete(`${sp.pos.r},${sp.pos.c}`);
        }
      }

      cur = collapseAndFill(cur, fullRemove, gemCount);
      setMatchedSet(new Set());
      setGrid(cloneGrid(cur));
      await new Promise(r => setTimeout(r, 300));
    }

    setCombo(0);
    return cur;
  }, [flashEffect, gemCount]);

  const doSwap = useCallback(async (a: Pos, b: Pos) => {
    if (busy || result !== 'none') return;
    if (!isAdj(a, b)) return;

    // Obstacle block check
    const obsA = obstacles.find(o => o.pos.r === a.r && o.pos.c === a.c);
    const obsB = obstacles.find(o => o.pos.r === b.r && o.pos.c === b.c);
    if ((obsA && (obsA.type === 'chain' || obsA.type === 'crate')) || 
        (obsB && (obsB.type === 'chain' || obsB.type === 'crate'))) {
      sfx.fail();
      setShaking(`${a.r},${a.c}|${b.r},${b.c}`);
      setTimeout(() => setShaking(null), 350);
      return;
    }

    setShaking(null); // Clear hint if active
    setBusy(true);
    sfx.swap();

    const swapped = swapInGrid(grid, a, b);
    setGrid(swapped);
    await new Promise(r => setTimeout(r, 200));

    const comboResult = handleSpecialCombo(swapped, a, b);
    if (comboResult) {
      sfx.bomb();
      setMoves(m => m - 1);
      setSel(null);
      flashEffect(comboResult);
      setMatchedSet(comboResult);
      const pts = comboResult.size * 100;
      
      let objEvents: any[] = [{ type: 'score', amount: pts }];
      setObstacles(prevObs => {
        let newObs = [...prevObs];
        for (const key of comboResult) {
          const [r, c] = key.split(',').map(Number);
          const cell = swapped[r][c];
          objEvents.push({ type: 'collect', amount: 1, color: cell.color });
          
          const adjObs = getAdjacentObstacles({ r, c }, newObs);
          for (const obs of adjObs) {
            const damaged = damageObstacle(obs);
            if (!damaged) {
              objEvents.push({ type: 'clear_obstacle', amount: 1, obstacleType: obs.type });
              newObs = newObs.filter(o => o.id !== obs.id);
            } else {
              const idx = newObs.findIndex(o => o.id === obs.id);
              if (idx >= 0) newObs[idx] = damaged;
            }
          }
        }
        return newObs;
      });
      setScore(s => s + pts);
      setObjectives(prev => updateObjectives(prev, objEvents));
      
      // Update stats
      onSave({
        ...save,
        stats: {
          ...save.stats,
          gemsDestroyed: save.stats.gemsDestroyed + comboResult.size,
          obstaclesCleared: save.stats.obstaclesCleared + objEvents.filter(e => e.type === 'clear_obstacle').length
        }
      });
      
      const cp = 40;
      setFloats(prev => [...prev, { id: Date.now(), x: a.c * cp + cp / 2, y: a.r * cp + cp / 2, text: `💥 +${pts}`, color: '#ffd700' }]);
      setTimeout(() => setFloats(prev => prev.slice(1)), 900);
      await new Promise(r => setTimeout(r, 400));

      const filled = collapseAndFill(swapped, comboResult, gemCount);
      setMatchedSet(new Set());
      setGrid(filled);
      await new Promise(r => setTimeout(r, 300));

      const final = await cascade(filled, 1);
      setGrid(final);
      setBusy(false);
      return;
    }

    const matches = findMatchLines(swapped);
    if (matches.length === 0) {
      sfx.fail();
      setShaking(`${a.r},${a.c}|${b.r},${b.c}`);
      await new Promise(r => setTimeout(r, 350));
      setShaking(null);
      setGrid(cloneGrid(grid));
      setBusy(false);
      return;
    }

    setMoves(m => m - 1);
    setSel(null);
    const final = await cascade(swapped, 0, a);
    setGrid(final);
    setBusy(false);
  }, [grid, busy, result, cascade, flashEffect, gemCount, obstacles, onSave, save]);

  const tapCell = useCallback((r: number, c: number) => {
    if (result !== 'none') return;

    const obs = obstacles.find(o => o.pos.r === r && o.pos.c === c);

    if (activeBooster === 'hammer') {
      const ng = cloneGrid(grid);
      const cell = ng[r][c];
      
      let objEvents: any[] = [];
      let full = new Set<string>();
      
      setObstacles(prevObs => {
        let newObs = [...prevObs];
        
        if (obs) {
          sfx.special();
          const damaged = damageObstacle(obs);
          if (!damaged) {
            objEvents.push({ type: 'clear_obstacle', amount: 1, obstacleType: obs.type });
            newObs = newObs.filter(o => o.id !== obs.id);
          } else {
            const idx = newObs.findIndex(o => o.id === obs.id);
            if (idx >= 0) newObs[idx] = damaged;
          }
          // Only damage the obstacle, don't clear the gem if it was a crate/chain
          if (obs.type === 'ice') {
             full = activateSpecials(ng, new Set<string>([`${r},${c}`]));
          }
        } else {
          if (cell.special !== 'none') sfx.special(); else sfx.booster();
          full = activateSpecials(ng, new Set<string>([`${r},${c}`]));
        }

        for (const key of full) {
          const [fr, fc] = key.split(',').map(Number);
          objEvents.push({ type: 'collect', amount: 1, color: ng[fr][fc].color });
          
          const adjObs = getAdjacentObstacles({ r: fr, c: fc }, newObs);
          for (const aObs of adjObs) {
            const damaged = damageObstacle(aObs);
            if (!damaged) {
              objEvents.push({ type: 'clear_obstacle', amount: 1, obstacleType: aObs.type });
              newObs = newObs.filter(o => o.id !== aObs.id);
            } else {
              const idx = newObs.findIndex(o => o.id === aObs.id);
              if (idx >= 0) newObs[idx] = damaged;
            }
          }
        }
        return newObs;
      });

      setObjectives(prev => updateObjectives(prev, objEvents));
      setMatchedSet(full);
      setActiveBooster(null);
      const ns = { ...save, boosters: { ...save.boosters, hammer: save.boosters.hammer - 1 }, stats: {
        ...save.stats,
        gemsDestroyed: save.stats.gemsDestroyed + full.size,
        obstaclesCleared: save.stats.obstaclesCleared + objEvents.filter(e => e.type === 'clear_obstacle').length
      } };
      onSave(ns);
      
      setTimeout(async () => {
        const filled = collapseAndFill(ng, full, gemCount);
        setMatchedSet(new Set());
        setGrid(filled);
        await new Promise(res => setTimeout(res, 250));
        const final = await cascade(filled, 0);
        setGrid(final);
      }, 300);
      return;
    }

    setShaking(null); // Clear hint if active
    if (busy) return;
    if (obs && (obs.type === 'chain' || obs.type === 'crate')) {
      // Cannot select
      sfx.fail();
      setShaking(`${r},${c}`);
      setTimeout(() => setShaking(null), 350);
      return;
    }
    
    const pos: Pos = { r, c };
    if (!sel) { setSel(pos); sfx.tap(); return; }
    if (sel.r === r && sel.c === c) { setSel(null); return; }
    if (isAdj(sel, pos)) {
      doSwap(sel, pos);
      setSel(null);
    } else {
      setSel(pos);
      sfx.tap();
    }
  }, [sel, busy, result, doSwap, activeBooster, grid, save, onSave, cascade, gemCount, obstacles]);

  useEffect(() => {
    if (busy || result !== 'none') return;
    
    // Check win condition (objectives)
    const won = levelDef.objectives && levelDef.objectives.length > 0 
      ? allObjectivesComplete(objectives)
      : score >= levelDef.target;

    if (won) {
      setResult('win');
      sfx.win();
      const stars = score >= levelDef.star3 ? 3 : score >= levelDef.star2 ? 2 : 1;
      
      const ns = { ...save };
      
      if (levelNum !== 'daily') {
        const ln = levelNum as number;
        ns.levelStars[ln] = Math.max(ns.levelStars[ln] || 0, stars);
        ns.levelBest[ln] = Math.max(ns.levelBest[ln] || 0, score);
        ns.unlockedLevel = Math.max(ns.unlockedLevel, Math.min(ln + 1, LEVELS.length));
      } else {
        // Track daily challenge completion in achievements or stats if needed
        const todayStr = new Date().toDateString();
        ns.achievements = { ...ns.achievements, [`daily_${todayStr}`]: true };
      }
      
      ns.totalScore += score;
      
      const coinsEarned = stars * 10 + (moves * 2);
      ns.coins = (ns.coins || 0) + coinsEarned;
      ns.stats = { ...ns.stats, levelsPlayed: ns.stats.levelsPlayed + 1 };
      
      if (stars === 3) {
        const types: BoosterType[] = ['hammer', 'shuffle', 'extraMoves'];
        const bonus = types[Math.floor(Math.random() * types.length)];
        ns.boosters[bonus]++;
      }
      onSave(ns);
    } else if (moves <= 0) {
      setResult('lose');
      sfx.lose();
      onSave({ ...save, stats: { ...save.stats, levelsPlayed: save.stats.levelsPlayed + 1 } });
    } else if (!anyValidMove(grid)) {
      setGrid(buildGrid(gemCount));
    }
  }, [score, moves, grid, busy, result, levelDef, levelNum, save, onSave, gemCount, objectives]);

  const earnedStars = score >= levelDef.star3 ? 3 : score >= levelDef.star2 ? 2 : score >= levelDef.target ? 1 : 0;
  const restart = () => { setScore(0); setMoves(levelDef.moves); setGrid(buildGrid(gemCount)); setResult('none'); setSel(null); setCombo(0); };

  return (
    <div className="w-full max-w-[420px] mx-auto select-none" style={{ touchAction: 'none' }}>
      <GameHUD
        levelNum={levelNum}
        levelDef={levelDef}
        save={save}
        score={score}
        moves={moves}
        combo={combo}
        earnedStars={earnedStars}
        objectives={objectives}
        activeBooster={activeBooster}
        busy={busy}
        result={result}
        onBack={onBack}
        onToggleSound={() => { const ns = { ...save, soundOn: !save.soundOn }; sfx.enabled = !save.soundOn; onSave(ns); }}
        onBoosterClick={(type) => {
          if (type === 'hammer') setActiveBooster(activeBooster === 'hammer' ? null : 'hammer');
          else if (type === 'shuffle') {
            sfx.booster();
            setGrid(buildGrid(gemCount));
            onSave({ ...save, boosters: { ...save.boosters, shuffle: save.boosters.shuffle - 1 } });
          }
          else if (type === 'extraMoves') {
            sfx.booster();
            setMoves(m => m + 5);
            onSave({ ...save, boosters: { ...save.boosters, extraMoves: save.boosters.extraMoves - 1 } });
          }
        }}
      />
      
      <GameBoard
        grid={grid}
        sel={sel}
        busy={busy}
        result={result}
        matchedSet={matchedSet}
        shaking={shaking}
        flashRows={flashRows}
        flashCols={flashCols}
        activeBooster={activeBooster}
        colorBlind={save.settings?.colorBlind || false}
        onTapCell={tapCell}
        onSwap={doSwap}
        floats={floats}
        obstacles={obstacles}
      />

      <p className="text-center text-white/15 text-[9px] mt-2 font-medium tracking-wider">
        TAP or SWIPE · Match 4 = Striped · L/T = Wrapped · Match 5 = 💫 Bomb
      </p>

      {result === 'win' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50">
          <div className="text-center p-5" style={{ animation: 'gc-overlay .5s ease-out forwards' }}>
            <div className="flex items-center justify-center gap-1.5 mb-3">
              {[1, 2, 3].map(s => (
                <span key={s} className="text-3xl" style={{
                  animation: earnedStars >= s ? `gc-star-pop .4s ease-out ${s * 0.15}s backwards` : undefined,
                  opacity: earnedStars >= s ? 1 : 0.15,
                }}>⭐</span>
              ))}
            </div>
            <h3 className="text-white font-extrabold text-xl mb-1">
              {levelNum === 'daily' ? 'Daily Challenge Complete!' : `Level ${levelNum} Complete!`}
            </h3>
            <p className="text-sm mb-0.5" style={{ color: '#fff' }}>Score: <strong>{score.toLocaleString()}</strong></p>
            {levelNum !== 'daily' && (
              <p className="text-white/80 text-xs mb-1">{moves} moves remaining · Best: {(save.levelBest[levelNum as number] || 0).toLocaleString()}</p>
            )}
            <p className="text-sm mb-4 font-bold text-white shadow-sm">+{earnedStars * 10 + moves * 2} Coins 🪙</p>
            <div className="flex items-center justify-center gap-2">
              <button onClick={onBack}
                className="px-4 py-2.5 rounded-full text-xs font-bold border border-white/30 text-white hover:bg-white/20 backdrop-blur-md transition-all">
                🗺️ Levels
              </button>
              {levelNum !== 'daily' && (levelNum as number) < LEVELS.length && (
                <button onClick={onNextLevel}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-black bg-white/90 backdrop-blur-md active:scale-95 transition-transform hover:bg-white shadow-[0_4px_16px_rgba(255,255,255,0.4)]">
                  Next Level ✨
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {result === 'lose' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50">
          <div className="text-center p-5" style={{ animation: 'gc-overlay .5s ease-out forwards' }}>
            <div className="text-4xl mb-2">😢</div>
            <h3 className="text-white font-extrabold text-xl mb-2">Out of Moves!</h3>
            <p className="text-white/50 text-sm mb-6">You needed {levelDef.target - score} more points.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={onBack}
                className="px-4 py-2.5 rounded-full text-xs font-bold border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all">
                Main Menu
              </button>
              {levelNum !== 'daily' && (
                <button onClick={restart}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  Retry Level
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateDailyLevel() {
  return {
    target: 5000,
    moves: 25,
    star1: 2000,
    star2: 4000,
    star3: 6000,
    gemCount: 6,
    objectives: []
  };
}

export function JDGemCrush() {
  const [save, setSave] = useState<SaveData>(loadSave());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [currentLevel, setCurrentLevel] = useState<number | 'daily'>(1);

  const levelDef = currentLevel === 'daily' 
    ? generateDailyLevel() 
    : LEVELS[Math.min((currentLevel as number) - 1, LEVELS.length - 1)] || LEVELS[0];

  const handleSave = useCallback((s: SaveData) => {
    setSave(s);
    writeSave(s);
  }, []);

  return (
    <div className="fixed inset-0 text-white overflow-hidden flex flex-col font-sans select-none bg-gradient-to-br from-[#FF0080] via-[#7928CA] to-[#0070F3]"
         style={{ backgroundSize: '400% 400%', animation: save.settings?.reducedMotion ? 'none' : 'bg-gradient-flow 15s ease infinite' }}>
      <style>{GAME_CSS}</style>
      {save.settings?.reducedMotion && (
        <style>{`
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        `}</style>
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({length: 15}).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white/20" style={{
            width: 3 + (i % 4) * 2,
            height: 3 + (i % 4) * 2,
            left: `${(i * 7.3) % 100}%`,
            animation: `gc-float-particle ${8 + (i % 5) * 3}s linear infinite`,
            animationDelay: `${i * 0.7}s`,
          }} />
        ))}
      </div>
      
      <div className="relative w-full max-w-[440px] mx-auto flex flex-col flex-1 overflow-hidden px-3 py-2 z-10">
        {screen === 'menu' && (
        <MainMenu
          save={save}
          onPlay={() => setScreen('levels')}
          onContinue={() => {
            setCurrentLevel(save.unlockedLevel);
            setScreen('game');
          }}
          onStore={() => setScreen('store')}
          onStats={() => setScreen('stats')}
          onDaily={() => {
            const todayStr = new Date().toDateString();
            if (save.achievements[`daily_${todayStr}`]) {
              alert("You already completed today's challenge!");
              return;
            }
            setCurrentLevel('daily');
            setScreen('game');
          }}
          onSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'settings' && (
        <SettingsPanel save={save} onSave={handleSave} onBack={() => setScreen('menu')} />
      )}

      {screen === 'store' && (
        <StorePanel save={save} onSave={handleSave} onBack={() => setScreen('menu')} />
      )}

      {screen === 'stats' && (
        <StatsPanel save={save} onBack={() => setScreen('menu')} />
      )}

      {screen === 'levels' && (
        <WorldMap
          save={save}
          onSelect={(lvl) => { setCurrentLevel(lvl); setScreen('game'); }}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'game' && (
        <GameScreenComponent
          key={currentLevel}
          levelNum={currentLevel}
          levelDef={levelDef}
          save={save}
          onSave={handleSave}
          onBack={() => setScreen('levels')}
          onNextLevel={() => setCurrentLevel(prev => prev === 'daily' ? 'daily' : Math.min(prev + 1, LEVELS.length))}
        />
      )}
      
      <div className="text-white/30 text-[9px] py-3 text-center mt-auto">
        Need help?{' '}
        <a href="https://wa.me/919360490974" target="_blank" rel="noopener noreferrer" className="text-[#fff] font-medium">WhatsApp Us</a>
      </div>
      </div>
    </div>
  );
}
