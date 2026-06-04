const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  const PANEL_PASSWORD = process.env.PANEL_PASSWORD || "barrett2024";
  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad request" }; }
  if (body.password !== PANEL_PASSWORD) return { statusCode: 401, body: JSON.stringify({ error: "No autorizado" }) };
  const store = getStore("respuestas");
  const { blobs } = await store.list();
  const respuestas = [];
  for (const blob of blobs) {
    const raw = await store.get(blob.key);
    if (raw) respuestas.push({ id: blob.key, ...JSON.parse(raw) });
  }
  respuestas.sort((a, b) => new Date(b.guardadoEn) - new Date(a.guardadoEn));
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ respuestas })
  };
};
