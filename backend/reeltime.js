const clients = new Set();

const send = (res, event, payload) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const addClient = (res, user = null) => {
  const client = { res, user, connectedAt: new Date() };
  clients.add(client);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  send(res, "connected", {
    ok: true,
    connectedAt: client.connectedAt.toISOString(),
  });

  const heartbeat = setInterval(() => {
    send(res, "ping", { at: new Date().toISOString() });
  }, 25000);

  res.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
};

const emitChange = ({
  resources = [],
  action = "changed",
  source = "api",
  user = null,
} = {}) => {
  const payload = {
    resources,
    action,
    source,
    user: user
      ? {
          user_id: user.user_id,
          username: user.username,
          role_id: user.role_id,
        }
      : null,
    at: new Date().toISOString(),
  };

  for (const client of clients) {
    send(client.res, "data-changed", payload);
  }
};

module.exports = { addClient, emitChange };