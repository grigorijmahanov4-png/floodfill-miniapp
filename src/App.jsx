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
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#C7CEEA", "#FFDAB9"];

  const DIFFICULTY = {
    "Легкая": { size: 10, moves: 20 },
    "Средняя": { size: 14, moves: 20 },
    "Сложная": { size: 18, moves: 20 },
  };

  const ROOMS = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    name: `Комната ${i + 1}`,
    difficulty: ["Легкая", "Средняя", "Сложная"][i % 3],
    price: 0.1 + i * 0.05,
    prizePool: 1 + i * 0.2,
    players: Math.floor(Math.random() * 10) + 1,
    maxPlayers: 16,
    locked: i > 0,
  }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get("userId");
    setUserId(urlUserId || "123456789");
    if (urlUserId) {
      loadUserData(urlUserId);
    }
  }, []);

  const loadUserData = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/${id}`);
      const data = await response.json();
      setBalance(data.balance || 10);
    } catch (error) {
      console.error("Error loading user:", error);
      setBalance(10);
    } finally {
      setLoading(false);
    }
  };

  const submitGameResult = async (won, finalScore) => {
    if (!userId) return;
    try {
      const response = await fetch("/api/game-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          score: finalScore,
          difficulty: selectedRoom?.difficulty,
          won,
          filledPercent: (filledCells.size / (field.length * field.length)) * 100,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setBalance(data.newBalance);
      }
    } catch (error) {
      console.error("Error submitting result:", error);
    }
  };

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
      setBalance(balance + winScore / 10000);
      setGameState("won");
      submitGameResult(true, winScore);
      return;
    }

    if (m >= maxMoves) {
      const loseScore = Math.floor(filledPercent * 100);
      setScore(loseScore);
      setBalance(balance + loseScore / 10000);
      setGameState("lost");
      submitGameResult(false, loseScore);
      return;
    }
  };

  if (loading) {
    return (<div>Загрузка...</div>);
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
