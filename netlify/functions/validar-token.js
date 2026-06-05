const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };

  const token = event.queryStringParameters && event.queryStringParameters.token;
  if (!token) return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ valido: false, error: "Token requerido" }) };

  try {
    const store = getStore({ name: "tokens", consistency: "strong" });
    const raw = await store.get(token);
    if (!raw) return { statusCode: 404, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ valido: false, error: "Enlace inválido o expirado" }) };

    const data = JSON.parse(raw);
    if (data.usado) return { statusCode: 410, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ valido: false, error: "Este enlace ya fue utilizado" }) };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valido: true, nombre: data.nombre, email: data.email })
    };
  } catch (err) {
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ valido: false, error: "Error: " + err.message }) };
  }
};
