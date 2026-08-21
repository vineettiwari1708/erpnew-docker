const express = require("express");
const prisma  = require("../config/db");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const { tenantId } = req.params;
  try {
    const roles = await prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: { include: { permission: true } },
        users: { where: { isDeleted: false }, select: { id: true } },
      },
      orderBy: { name: "asc" },
    });

    const result = roles.map((role) => ({
      id:             role.id,
      name:           role.name,
      tenantId:       role.tenantId,
      permissionCount: role.permissions.length,
      userCount:       role.users.length,
      permissions:    role.permissions.map((rp) => rp.permission.key),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch roles", error: err.message });
  }
});

router.get("/:name", async (req, res) => {
  const { tenantId, name } = req.params;
  try {
    const role = await prisma.role.findFirst({
      where: { tenantId, name: name.toUpperCase() },
      include: {
        permissions: { include: { permission: true } },
        users: {
          where:  { isDeleted: false },
          select: { id: true, name: true, email: true, status: true },
        },
      },
    });

    if (!role) return res.status(404).json({ message: "Role not found" });

    res.json({
      id:          role.id,
      name:        role.name,
      tenantId:    role.tenantId,
      permissions: role.permissions.map((rp) => ({
        id:          rp.permission.id,
        key:         rp.permission.key,
        description: rp.permission.description,
      })),
      users: role.users,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch role", error: err.message });
  }
});

router.put("/:name/permissions", async (req, res) => {
  const { tenantId, name } = req.params;
  const { permissionKeys } = req.body; // string[]

  if (!Array.isArray(permissionKeys))
    return res.status(400).json({ message: "permissionKeys must be an array" });

  try {
    const role = await prisma.role.findFirst({
      where: { tenantId, name: name.toUpperCase() },
    });

    if (!role) return res.status(404).json({ message: "Role not found" });

    const perms = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true, key: true },
    });

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      }),
    ]);

    res.json({
      message: `Permissions updated for ${role.name}`,
      permissionsSet: perms.map((p) => p.key),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update permissions", error: err.message });
  }
});

module.exports = router;
