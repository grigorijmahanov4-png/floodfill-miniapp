import React, { useState, useEffect } from "react";
import { Zap, Plus, User, ShoppingBag, Lock } from "lucide-react";

export default function TelegramMiniApp() {
  const [screen, setScreen] = useState("rooms");
  const [field, setField] = useState([]);
  const [filledCells, setFilledCells] = useState(new Set());
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [moves, setMoves] = useState(0);
  const [maxMoves, setMaxMoves] = useState(25);
  const [score, setScore] = useState(0);
  const [balance, setBalance] = useState(10);
  const [isGameInitialized, setIsGameInitialized] = useState(false);

  const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#C7CEEA", "#FFDAB9"];

  const DIFFICULTY = {
    "Лёгкая": { size: 10, moves: 20 },
    "Средняя": { size: 14, moves: 20 },
    "Сложная": { size: 18, moves: 20 },
  };

  const ROOMS = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    name: `Комната ${i + 1}`,
    difficulty: ["Лёгкая", "Средняя", "Сложная"][i % 3],
    players: Math.floor(Math.random() * 10) + 1,
    maxPlayers: 16,
    locked: i > 0,
  }));

  const fillCells = (grid, row, col, target, visited = new Set()) => {
    if (row < 0 || col < 0 || row >= grid.length || col >= grid.length) return;
    const key = `${row}-${col}`;
    if (visited.has(key) || grid[row][col] !== target) return;

    visited.add(key);

    fillCells(grid, row + 1, col, target, visited);
    fillCells(grid, row - 1, col, target, visited);
    fillCells(grid, row, col + 1, target, visited);
    fillCells(grid, row, col - 1, target, visited);

    return visited;
  };

  const startGame = () => {
    if (!selectedRoom) return;

    const cfg = DIFFICULTY[selectedRoom.difficulty];
    const size = cfg.size;

    const genField = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => COLORS[Math.floor(Math.random() * COLORS.length)])
    );

    const startColor = genField[0][0];
    const initialFill = fillCells(genField, 0, 0, startColor);

    setField(genField);
    setFilledCells(initialFill);
    setSelectedColor(startColor);
    setMoves(0);
    setMaxMoves(cfg.moves);
    setGameState("playing");
    setScore(0);
    setIsGameInitialized(true);
  };

  useEffect(() => {
    if (screen === "game" && !isGameInitialized && selectedRoom) {
      startGame();
    }
  }, [screen, selectedRoom]);

  const handleColor = (newColor) => {
    if (gameState !== "playing" || !field.length) return;

    const newField = field.map((row) => [...row]);
    const oldColor = newField[0][0];

    if (oldColor === newColor) return;

    filledCells.forEach((key) => {
      const [r, c] = key.split("-").map(Number);
      newField[r][c] = newColor;
    });

    const newFilled = new Set(filledCells);
    const queue = [...filledCells];

    while (queue.length) {
      const [row, col] = queue.pop().split("-").map(Number);

      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
        const nr = row + dr;
        const nc = col + dc;
        const key = `${nr}-${nc}`;

        if (
          nr >= 0 && nr < newField.length &&
          nc >= 0 && nc < newField.length &&
          !newFilled.has(key) &&
          newField[nr][nc] === newColor
        ) {
          newFilled.add(key);
          queue.push(key);
        }
      });
    }

    setField(newField);
    setFilledCells(newFilled);
    setSelectedColor(newColor);

    const m = moves + 1;
    setMoves(m);

    const total = newField.length * newField.length;
    const filledPercent = newFilled.size / total;

    if (filledPercent === 1) {
      const winScore = 1000 + (maxMoves - m) * 10;
      setScore(winScore);
      setGameState("won");
      return;
    }

    if (m >= maxMoves) {
      const loseScore = Math.floor(filledPercent * 100);
      setScore(loseScore);
      setGameState("lost");
      return;
    }
  };

  if (screen === "rooms") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 text-white pb-32 relative overflow-hidden">
        {/* Фоновые светящиеся элементы */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-cyan-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-blue-500 rounded-full opacity-5 blur-3xl"></div>

        {/* Логотип */}
        <div className="relative z-10 flex justify-center pt-8 pb-12">
          <div className="text-center">
            <div className="inline-block relative">
              {/* Внешняя светящаяся граница */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 rounded-full blur-xl opacity-60" style={{ transform: 'scale(1.15)' }}></div>
              
              {/* Логотип с фоном */}
              <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center border-4 border-cyan-300 shadow-2xl" style={{ boxShadow: "0 0 40px rgba(34, 211, 238, 0.8)" }}>
                <svg viewBox="0 0 200 200" className="w-32 h-32 drop-shadow-lg">
                  {/* FLOOD */}
                  <text x="100" y="50" fontSize="24" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif">FLOOD!</text>
                  {/* FILL */}
                  <text x="100" y="80" fontSize="24" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif">FILL!</text>
                  
                  {/* Контроллер */}
                  {/* D-pad */}
                  <rect x="45" y="100" width="12" height="35" rx="2" fill="#FFE66D"/>
                  <rect x="32" y="113" width="35" height="12" rx="2" fill="#FFE66D"/>
                  
                  {/* Кнопки справа */}
                  <circle cx="130" cy="115" r="6" fill="#FF6B6B"/>
                  <circle cx="130" cy="135" r="6" fill="#FF6B6B"/>
                  <circle cx="120" cy="125" r="6" fill="#4ECDC4"/>
                  <circle cx="140" cy="125" r="6" fill="#4ECDC4"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3 pb-40 relative z-10">
          {ROOMS.map((room) => (
            <button
              key={room.id}
              disabled={room.locked}
              onClick={() => {
                setSelectedRoom(room);
                setIsGameInitialized(false);
                setScreen("game");
              }}
              className={`w-full p-4 rounded-lg border-2 transition ${
                room.locked
                  ? "border-red-500 bg-slate-700 opacity-40 cursor-not-allowed"
                  : "border-cyan-400 bg-slate-800 hover:border-yellow-400 cursor-pointer"
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="font-bold text-lg flex items-center gap-2">
                    {room.locked && <Lock size={18} />}
                    {room.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {room.difficulty} • {room.players}/{room.maxPlayers} игроков
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-cyan-500 flex justify-around py-3 z-20">
          <NavIcon icon={Zap} label="Игры" active />
          <NavIcon icon={Plus} label="Скоро" />
          <NavIcon icon={User} label="Скоро" />
          <NavIcon icon={ShoppingBag} label="Скоро" />
        </div>
      </div>
    );
  }

  if (screen === "game") {
    const size = field.length;
    const filledPercent = size ? (filledCells.size / (size * size)) * 100 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-blue-900 text-white p-4 pb-40">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-gray-400">{selectedRoom?.name}</div>
            <div className="font-bold">🎮 {moves}/{maxMoves} | {filledPercent.toFixed(1)}%</div>
          </div>
          <button
            onClick={() => {
              setScreen("rooms");
              setField([]);
              setIsGameInitialized(false);
            }}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Выход
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <div className="p-3 bg-slate-900 border-4 border-cyan-400 rounded-lg" style={{ boxShadow: "0 0 30px rgba(0, 255, 255, 0.6)" }}>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
              {field.map((row, r) =>
                row.map((col, c) => {
                  const isFilled = filledCells.has(`${r}-${c}`);
                  const cellSize = Math.max(16, Math.min(50, 280 / size));
                  return (
                    <div
                      key={`${r}-${c}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: col,
                        border: isFilled ? "2px solid #FFD700" : "2px solid #1f2937",
                        boxShadow: isFilled ? "0 0 10px rgba(255, 215, 0, 0.7)" : "none",
                      }}
                      className="rounded"
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border-4 border-cyan-400 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-6 gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => handleColor(c)}
                className="h-14 rounded border-4"
                style={{
                  backgroundColor: c,
                  borderColor: selectedColor === c ? "#00FFFF" : "#1f2937",
                  boxShadow: selectedColor === c ? `0 0 25px ${c}` : "none",
                }}
              />
            ))}
          </div>
        </div>

        {(gameState === "won" || gameState === "lost") && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 border-4 border-cyan-400 p-8 rounded-lg text-center">
              <div className="text-6xl mb-4">{gameState === "won" ? "🎉" : "😢"}</div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: gameState === "won" ? "#00FF00" : "#FFB800" }}>
                {gameState === "won" ? "ПОБЕДА!" : "ПОРАЖЕНИЕ!"}
              </h2>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{score}</div>
              <div className="text-2xl text-green-400 mb-6">+{(score / 10000).toFixed(4)}</div>

              <div className="flex gap-3">
                <button
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded"
                  onClick={() => {
                    setScreen("rooms");
                    setField([]);
                    setIsGameInitialized(false);
                  }}
                >
                  В меню
                </button>
                <button
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 px-4 py-3 rounded"
                  onClick={() => {
                    setIsGameInitialized(false);
                    startGame();
                  }}
                >
                  Ещё раз
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function NavIcon({ icon: Icon, label, active }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? "text-cyan-400" : "text-gray-400"}`}>
      <Icon size={24} />
      <span className="text-xs">{label}</span>
    </div>
  );
}
