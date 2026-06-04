const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Verificar contraseña del panel
  const PANEL_PASSWORD = process.env.PANEL_PASSWORD || "barrett2024";
  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad request" }; }

  if (body.password !== PANEL_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "Contraseña incorrecta" }) };
  }

  const { nombre, email } = body;
  if (!nombre || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: "Nombre y email son requeridos" }) };
  }

  // Generar token único
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);

  // Guardar token en Netlify Blobs con datos del cliente
  const store = getStore("tokens");
  await store.set(token, JSON.stringify({
    nombre,
    email,
    creado: new Date().toISOString(),
    usado: false
  }), { ttl: 60 * 60 * 24 * 30 }); // expira en 30 días si no se usa

  const baseUrl = event.headers["origin"] || `https://${event.headers["host"]}`;
  const enlace = `${baseUrl}/formulario.html?t=${token}`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enlace, token })
  };
};
