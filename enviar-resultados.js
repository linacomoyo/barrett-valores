const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad request" }; }

  const { token, nombre, email, organizacion, fecha, patron, base_count, evolucion_count, proposito_count, niveles, reflexion } = body;

  if (!token) return { statusCode: 400, body: JSON.stringify({ error: "Token requerido" }) };

  // Verificar y marcar token como usado
  const store = getStore("tokens");
  const raw = await store.get(token);
  if (!raw) return { statusCode: 404, body: JSON.stringify({ error: "Token inválido" }) };

  const tokenData = JSON.parse(raw);
  if (tokenData.usado) return { statusCode: 410, body: JSON.stringify({ error: "Enlace ya utilizado" }) };

  // Marcar como usado
  await store.set(token, JSON.stringify({ ...tokenData, usado: true, usadoEn: new Date().toISOString() }));

  // Guardar respuesta
  const respuestaId = `respuesta_${Date.now()}`;
  const storeResp = getStore("respuestas");
  await storeResp.set(respuestaId, JSON.stringify({
    nombre, email, organizacion, fecha, patron,
    base_count, evolucion_count, proposito_count,
    niveles, reflexion,
    guardadoEn: new Date().toISOString()
  }));

  // Enviar email via Netlify (notificación interna)
  // Los resultados también quedan en el store para consultarlos desde el panel
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true })
  };
};
