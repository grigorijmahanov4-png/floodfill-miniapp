import React, { useState } from "react";
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

  const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#C7CEEA", "#FFDAB9"];

  const DIFFICULTY = {
    "Легкая": { size: 10, moves: 30 },
    "Средняя": { size: 14, moves: 35 },
    "Сложная": { size: 18, moves: 40 },
  };

  const ROOMS = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    name: `Комната ${i + 1}`,
    difficulty: ["Легкая", "Средняя", "Сложная"][i % 3],
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
  };

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

      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr, dc]) => {
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
    const percent = newFilled.size / total;

    if (percent === 1) {
      setGameState("won");
      return;
    }

    if (m >= maxMoves) {
      setGameState("lost");
      return;
    }
  };

  if (screen === "rooms") {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 pb-32">
        <h1 className="text-4xl font-bold mb-6">🎮 FLOOD FILL</h1>
        <p className="text-gray-300 mb-3">Выберите комнату</p>

        <div className="space-y-3 mb-4">
          {ROOMS.map((room) => (
            <button
              key={room.id}
              disabled={room.locked}
              onClick={() => {
                setSelectedRoom(room);
                setScreen("game");
                setTimeout(startGame, 50);
              }}
              className={`w-full p-4 rounded-lg border transition ${
                room.locked
                  ? "border-red-500 bg-slate-700 opacity-40"
                  : "border-cyan-400 bg-slate-800 hover:border-yellow-400"
              }`}
            >
              <div className="flex justify-between">
                <span className="font-bold">
                  {room.locked && <Lock size={18} className="inline mr-2" />}
                  {room.name}
                </span>
                <span className="text-gray-400">{room.difficulty}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-cyan-500 flex justify-around py-3">
          <NavIcon icon={Zap} label="Комнаты" active />
          <NavIcon icon={Plus} label="SOON" />
          <NavIcon icon={User} label="SOON" />
          <NavIcon icon={ShoppingBag} label="SOON" />
        </div>
      </div>
    );
  }

  if (screen === "game") {
    const size = field.length;
    const filledPercent = size ? (filledCells.size / (size * size)) * 100 : 0;

    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 pb-32">
        <div className="flex justify-between mb-4">
          <div>
            <div className="text-gray-400">{selectedRoom?.name}</div>
            <div className="font-bold text-lg">
              Ходы: <span className="text-cyan-400">{moves}/{maxMoves}</span>
            </div>
            <div className="text-green-400 text-sm">
              Закрашено: {filledPercent.toFixed(1)}%
            </div>
          </div>

          <button
            onClick={() => setScreen("rooms")}
            className="bg-red-600 px-4 py-2 rounded"
          >
            Выход
          </button>
        </div>

        <div className="flex justify-center mb-8">
          <div className="p-3 bg-slate-800 border-2 border-cyan-400 rounded-lg">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
              {field.map((row, r) =>
                row.map((col, c) => (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      width: 22,
                      height: 22,
                      backgroundColor: col,
                      border: filledCells.has(`${r}-${c}`)
                        ? "2px solid gold"
                        : "2px solid #1f2937",
                    }}
                    className="rounded"
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => handleColor(c)}
              className="h-14 rounded border-2"
              style={{
                backgroundColor: c,
                borderColor: selectedColor === c ? "#00FFFF" : "#1f2937",
              }}
            />
          ))}
        </div>

        {(gameState === "won" || gameState === "lost") && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="bg-slate-800 border-2 border-cyan-400 p-8 rounded-lg text-center">
              <div className="text-6xl mb-3">
                {gameState === "won" ? "🎉" : "😢"}
              </div>
              <h2 className="text-3xl font-bold mb-4">
                {gameState === "won" ? "ПОБЕДА" : "ПОРАЖЕНИЕ"}
              </h2>

              <button
                className="w-full bg-cyan-600 px-4 py-3 mt-4 rounded"
                onClick={startGame}
              >
                Играть ещё
              </button>

              <button
                className="w-full bg-gray-600 px-4 py-3 mt-2 rounded"
                onClick={() => setScreen("rooms")}
              >
                В меню
              </button>
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
    <div className={`flex flex-col items-center ${active ? "text-cyan-400" : "text-gray-400"}`}>
      <Icon size={24} />
      <span className="text-xs">{label}</span>
    </div>
  );
}
