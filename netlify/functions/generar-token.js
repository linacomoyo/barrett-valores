const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const PANEL_PASSWORD = process.env.PANEL_PASSWORD || "barrett2024";
  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad request" }; }

  if (body.password !== PANEL_PASSWORD) {
    return { statusCode: 401, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Contraseña incorrecta" }) };
  }

  const { nombre, email } = body;
  if (!nombre || !email) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Nombre y email requeridos" }) };
  }

  const token = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);

  try {
    const store = getStore({ name: "tokens", consistency: "strong" });
    await store.set(token, JSON.stringify({
      nombre, email,
      creado: new Date().toISOString(),
      usado: false
    }));

    const host = event.headers["host"] || event.headers["x-forwarded-host"] || "barrett-valores.netlify.app";
    const proto = event.headers["x-forwarded-proto"] || "https";
    const enlace = `${proto}://${host}/formulario.html?t=${token}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enlace, token })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Error interno: " + err.message })
    };
  }
};
