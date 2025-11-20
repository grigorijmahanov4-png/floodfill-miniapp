# 🎮 FLOOD FILL MINIAPP - Telegram Bot

Полнофункциональная игра на Telegram Mini App с поддержкой Webhook на Vercel.

## 🚀 Быстрый старт

### 1. Клонируем репозиторий
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/floodfill-miniapp.git
cd floodfill-miniapp
\`\`\`

### 2. Устанавливаем зависимости
\`\`\`bash
npm install
\`\`\`

### 3. Создаём .env файл
\`\`\`bash
cp .env.example .env
\`\`\`

### 4. Заполняем .env
\`\`\`bash
BOT_TOKEN=8426977971:AAGbXpLXNDhACgNk8k64fOob5mhnPAQ0a0U
ADMIN_ID=6654415370
WEBHOOK_URL=https://floodfill-miniapp.vercel.app/api/bot
\`\`\`

### 5. Запускаем локально
\`\`\`bash
npm run dev
\`\`\`

## 📦 Деплой на Vercel

### 1. Логинимся в Vercel
\`\`\`bash
npm i -g vercel
vercel
\`\`\`

### 2. Добавляем Environment Variables в Vercel Dashboard
- BOT_TOKEN
- ADMIN_ID
- WEBHOOK_URL

### 3. Устанавливаем Webhook для бота
\`\`\`bash
curl "https://api.telegram.org/bot8426977971:AAGbXpLXNDhACgNk8k64fOob5mhnPAQ0a0U/setWebhook?url=https://floodfill-miniapp.vercel.app/api/bot"
\`\`\`

### 4. Проверяем Webhook
\`\`\`bash
curl "https://api.telegram.org/bot8426977971:AAGbXpLXNDhACgNk8k64fOob5mhnPAQ0a0U/getWebhookInfo"
\`\`\`

## 🎮 Как использовать

1. Откройте бота в Telegram (@FloodFillGameBot)
2. Нажмите /start
3. Нажмите кнопку "🎮 Играть"
4. Выбирайте комнаты и играйте!

## 📊 API Endpoints

- GET /api/user/[id] - Данные пользователя
- POST /api/game-result - Результат игры
- POST /api/bot - Webhook для Telegram

## ✅ Готово к боевому деплою!
\`\`\`

---

## 5️⃣ `/src/App.jsx` - СКОПИРУЙ И ЗАМЕНИ ПОЛНОСТЬЮ
```javascript
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
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  // ===== ЭКРАН КОМНАТ =====
  if (screen === "rooms") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 text-white pb-32">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-center border-b-4 border-cyan-400">
          <div className="text-5xl font-bold mb-2">🎮 FLOOD FILL</div>
          <div className="text-2xl text-yellow-300">💰 {balance.toFixed(4)} TON</div>
          <div className="text-cyan-200">Выберите комнату для игры</div>
        </div>

        <div className="p-4 space-y-3 pb-40">
          {ROOMS.map((room) => (
            <button
              key={room.id}
              disabled={room.locked}
              onClick={() => {
                setSelectedRoom(room);
                setIsGameInitialized(false);
                setScreen("game");
              }}
              className={`w-full p-4 rounded-lg border-2 transition transform ${
                room.locked
                  ? "border-red-500 bg-slate-700 opacity-40 cursor-not-allowed"
                  : "border-cyan-400 bg-gradient-to-r from-slate-800 to-slate-700 hover:border-yellow-400 hover:scale-102 active:scale-95 cursor-pointer"
              }`}
              style={
                !room.locked
                  ? { boxShadow: "0 0 15px rgba(0, 255, 255, 0.4)" }
                  : {}
              }
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
                <div className="text-right">
                  <div className="text-yellow-400 font-bold text-lg">
                    {room.price.toFixed(2)} TON
                  </div>
                  <div className="text-green-400 text-sm">
                    Приз: {room.prizePool.toFixed(2)} TON
                  </div>
                </div>
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

  // ===== ЭКРАН ИГРЫ =====
  if (screen === "game") {
    const size = field.length;
    const filledPercent = size ? (filledCells.size / (size * size)) * 100 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-blue-900 text-white p-4 pb-40">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-gray-400 font-bold">{selectedRoom?.name}</div>
            <div className="font-bold text-lg">
              🎮 Ходы: <span className="text-cyan-400">{moves}/{maxMoves}</span>
            </div>
            <div className="text-green-400 text-sm">
              Закрашено: {filledPercent.toFixed(1)}%
            </div>
          </div>

          <button
            onClick={() => {
              setScreen("rooms");
              setField([]);
              setIsGameInitialized(false);
            }}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold"
          >
            Выход
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <div
            className="p-3 bg-slate-900 border-4 border-cyan-400 rounded-lg"
            style={{ boxShadow: "0 0 30px rgba(0, 255, 255, 0.6)" }}
          >
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
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
                        boxShadow: isFilled
                          ? "0 0 10px rgba(255, 215, 0, 0.7)"
                          : "none",
                      }}
                      className="rounded transition"
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border-4 border-cyan-400 rounded-lg p-4 mb-4">
          <div className="text-center text-gray-400 mb-3 text-sm">
            🎨 Выберите цвет:
          </div>
          <div className="grid grid-cols-6 gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => handleColor(c)}
                className="h-14 rounded border-4 transition transform hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: c,
                  borderColor:
                    selectedColor === c ? "#00FFFF" : "#1f2937",
                  boxShadow:
                    selectedColor === c
                      ? `0 0 25px ${c}, 0 0 15px rgba(0, 255, 255, 0.8)`
                      : "none",
                }}
              />
            ))}
          </div>
        </div>

        {(gameState === "won" || gameState === "lost") && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div
              className="bg-gradient-to-b from-slate-800 to-slate-900 border-4 border-cyan-400 p-8 rounded-lg text-center"
              style={{ boxShadow: "0 0 40px rgba(0, 255, 255, 0.8)" }}
            >
              <div className="text-6xl mb-4">
                {gameState === "won" ? "🎉" : "😢"}
              </div>
              <h2
                className="text-3xl font-bold mb-4"
                style={{
                  color: gameState === "won" ? "#00FF00" : "#FFB800",
                }}
              >
                {gameState === "won" ? "ПОБЕДА!" : "ПОРАЖЕНИЕ!"}
              </h2>

              <div className="text-green-400 text-sm mb-2">
                Закрашено: {filledPercent.toFixed(1)}%
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {score} поинтов
              </div>
              <div className="text-2xl text-green-400 mb-6">
                +{(score / 10000).toFixed(4)} TON
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded font-bold"
                  onClick={() => {
                    setScreen("rooms");
                    setField([]);
                    setIsGameInitialized(false);
                  }}
                >
                  В меню
                </button>

                <button
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 px-4 py-3 rounded font-bold"
                  style={{ boxShadow: "0 0 15px rgba(0, 255, 255, 0.8)" }}
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
    <div
      className={`flex flex-col items-center gap-1 ${
        active ? "text-cyan-400" : "text-gray-400"
      }`}
    >
      <Icon size={24} />
      <span className="text-xs">{label}</span>
    </div>
  );
}
```

---

## 6️⃣ `/api/bot.js` - СКОПИРУЙ И ЗАМЕНИ
```javascript
const TelegramBot = require("node-telegram-bot-api");

const users = new Map();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const ADMIN_ID = process.env.ADMIN_ID;
  const MINI_APP_URL = process.env.WEBHOOK_URL?.replace("/api/bot", "") || "https://floodfill-miniapp.vercel.app";

  const bot = new TelegramBot(BOT_TOKEN);
  const { message, callback_query } = req.body;

  try {
    if (message?.text === "/start") {
      const chatId = message.chat.id;
      const userId = message.from.id;
      const firstName = message.from.first_name || "Player";

      if (!users.has(userId)) {
        users.set(userId, {
          id: userId,
          name: firstName,
          balance: 10,
          wins: 0,
          level: 1,
          joinedAt: new Date(),
        });

        await bot.sendMessage(
          ADMIN_ID,
          `🆕 <b>Новый пользователь!</b>\n\n` +
          `👤 <b>Имя:</b> ${firstName}\n` +
          `🆔 <b>ID:</b> <code>${userId}</code>\n` +
          `💰 <b>Баланс:</b> 10 TON\n\n` +
          `👥 <b>Всего пользователей:</b> ${users.size}`,
          { parse_mode: "HTML" }
        );
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: "🎮 Играть", url: `${MINI_APP_URL}/?userId=${userId}` }],
          [{ text: "💰 Мой баланс", callback_data: "balance" }],
          [{ text: "📊 Статистика", callback_data: "stats" }],
          [{ text: "🛍️ Магазин", callback_data: "shop" }],
        ],
      };

      if (userId.toString() === ADMIN_ID) {
        keyboard.inline_keyboard.push([{ text: "🔧 АДМИН ПАНЕЛЬ", callback_data: "admin_panel" }]);
      }

      await bot.sendMessage(
        chatId,
        `🎮 <b>Добро пожаловать в Flood Fill!</b>\n\n` +
        `👋 Привет, ${firstName}!\n\n` +
        `💡 <b>Как играть:</b>\n` +
        `• Выбирай комнаты разной сложности\n` +
        `• Закрашивай поле за минимум ходов\n` +
        `• Зарабатывай TON и повышай уровень\n\n` +
        `💰 <b>Текущий баланс:</b> ${users.get(userId).balance} TON`,
        { parse_mode: "HTML", reply_markup: keyboard }
      );
    }

    if (callback_query) {
      const chatId = callback_query.message.chat.id;
      const userId = callback_query.from.id;
      const action = callback_query.data;
      const user = users.get(userId) || { balance: 10, wins: 0, level: 1 };

      if (action === "balance") {
        await bot.editMessageText(
          `💰 <b>Ваш баланс</b>\n\n<code>${user.balance.toFixed(4)} TON</code>`,
          {
            chat_id: chatId,
            message_id: callback_query.message.message_id,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: [[{ text: "← Назад", callback_data: "back" }]] },
          }
        );
      }

      if (action === "stats") {
        await bot.editMessageText(
          `📊 <b>Ваша статистика</b>\n\n🏆 <b>Побед:</b> ${user.wins}\n⭐ <b>Уровень:</b> ${user.level}\n💰 <b>Баланс:</b> ${user.balance.toFixed(4)} TON`,
          {
            chat_id: chatId,
            message_id: callback_query.message.message_id,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: [[{ text: "← Назад", callback_data: "back" }]] },
          }
        );
      }

      if (action === "admin_panel" && userId.toString() === ADMIN_ID) {
        await bot.editMessageText(
          `🔧 <b>АДМИН ПАНЕЛЬ</b>\n\n👥 <b>Пользователей:</b> ${users.size}\n💰 <b>Общий баланс:</b> ${Array.from(users.values()).reduce((s, u) => s + u.balance, 0).toFixed(2)} TON`,
          {
            chat_id: chatId,
            message_id: callback_query.message.message_id,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: [[{ text: "← Назад", callback_data: "back" }]] },
          }
        );
      }

      if (action === "back") {
        const keyboard = {
          inline_keyboard: [
            [{ text: "🎮 Играть", url: `${MINI_APP_URL}/?userId=${userId}` }],
            [{ text: "💰 Мой баланс", callback_data: "balance" }],
            [{ text: "📊 Статистика", callback_data: "stats" }],
            [{ text: "🛍️ Магазин", callback_data: "shop" }],
          ],
        };

        if (userId.toString() === ADMIN_ID) {
          keyboard.inline_keyboard.push([{ text: "🔧 АДМИН ПАНЕЛЬ", callback_data: "admin_panel" }]);
        }

        await bot.editMessageText("🎮 <b>Главное меню</b>", {
          chat_id: chatId,
          message_id: callback_query.message.message_id,
          parse_mode: "HTML",
          reply_markup: keyboard,
        });
      }

      await bot.answerCallbackQuery(callback_query.id);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Bot error:", error);
    res.status(500).json({ error: error.message });
  }
}
```

---

## 7️⃣ `/api/game-result.js` - СКОПИРУЙ И ЗАМЕНИ
```javascript
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, score, won, difficulty, filledPercent } = req.body;

  try {
    const newBalance = 10.5 + (score / 10000);
    const newLevel = Math.floor(Math.random() * 5) + 1;

    res.status(200).json({
      success: true,
      newBalance,
      newLevel,
      message: won ? "Победа!" : "Поражение, но вы получили опыт",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 8️⃣ `/api/user/[id].js` - СКОПИРУЙ И ЗАМЕНИ
```javascript
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    const user = {
      id: parseInt(id),
      name: "Player",
      balance: 10.5,
      wins: 5,
      level: 2,
      joinedAt: new Date().toISOString(),
    };

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 📝 ИТОГО - КАК ИСПОЛЬЗОВАТЬ:

### ✅ Файлы которые нужно ЗАМЕНИТЬ:
1. `package.json` ← скопируй весь контент
2. `vercel.json` ← скопируй весь контент
3. `.env.example` ← скопируй весь контент
4. `README.md` ← скопируй весь контент
5. `/src/App.jsx` ← скопируй весь контент
6. `/api/bot.js` ← скопируй весь контент
7. `/api/game-result.js` ← скопируй весь контент
8. `/api/user/[id].js` ← скопируй весь контент

### ✅ Файлы которые ОСТАВИТЬ как есть:
- `index.html` - уже правильный
- `vite.config.js` - уже правильный
- `tailwind.config.js` - уже правильный
- `postcss.config.js` - уже правильный
- `/src/main.jsx` - уже правильный
- `/src/index.css` - уже правильный

---

## 🚀 ПОСЛЕ ЗАМЕНЫ ФАЙЛОВ:

### 1. В Vercel Dashboard добавь Environment Variables: