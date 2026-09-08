export const fullClientName = (client) =>
  client?.prefix ? `${client.prefix} ${client.name}` : (client?.name || "");
