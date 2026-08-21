const prisma = require("../config/db");

function toCode(name) {
  return (name || "").replace(/[^a-zA-Z]/g, "").toUpperCase().substring(0, 3).padEnd(3, "X");
}

async function genClientNumber(tenantId, clientName) {
  const prefix = `CLT-${toCode(clientName)}`;
  const count  = await prisma.client.count({ where: { tenantId, clientNumber: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

async function genPaymentNumber(tenantId, clientName) {
  const prefix = `PAY-${toCode(clientName)}`;
  const count  = await prisma.payment.count({ where: { tenantId, paymentNumber: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

async function genUserNumber(tenantId) {
  const count = await prisma.user.count({ where: { tenantId } });
  return `USR-${String(count + 1).padStart(4, "0")}`;
}

module.exports = { genClientNumber, genPaymentNumber, genUserNumber };
