export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  // В production - запрос в БД
  // Для демо - возвращаем пример
  const user = {
    id: parseInt(id),
    name: "Player",
    balance: 10.5,
    wins: 5,
    level: 2,
    joinedAt: new Date().toISOString(),
  };

  res.status(200).json(user);
}