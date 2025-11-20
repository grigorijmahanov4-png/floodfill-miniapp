export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, score, won, difficulty } = req.body;

  // В production - сохраняем в БД
  // Для демо - просто обновляем баланс
  const newBalance = 10.5 + (score / 10000);
  const newLevel = Math.floor(Math.random() * 5) + 1;

  res.status(200).json({
    success: true,
    newBalance,
    newLevel,
    message: won ? "Победа!" : "Поражение, но вы получили опыт",
  });
}