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