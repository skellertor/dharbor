const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { checkSchema, validationResult } = require("express-validator");

const { colors, sizes } = require("../utils");

// Get all the ducks
router.get("/", async (req, res) => {
  const allDucks = await prisma.duck.findMany({
    where: { deleted: false },
    select: {
      id: true,
      color: true,
      size: true,
      quantity: true,
      price: true,
      deleted: true,
    },
    orderBy: { quantity: "desc" },
  });
  res.send(allDucks);
});

// Add or update the ducks
router.post(
  "/",
  checkSchema({
    color: {
      isIn: { options: [colors] },
    },
    size: {
      isIn: { options: [sizes] },
    },
    price: {
      isDecimal: true,
    },
    quantity: {
      isInt: true,
    },
  }),
  async (req, res) => {
    try {
      const result = validationResult(req);

      if (result.isEmpty()) {
        const existing = await prisma.duck.findFirst({
          where: {
            price: parseFloat(req.body.price),
            color: req.body.color,
            size: req.body.size,
          },
        });
        let duck;
        if (existing) {
          duck = await prisma.duck.update({
            where: {
              id: existing.id,
            },
            data: {
              quantity: {
                increment: parseInt(req.body.quantity),
              },
            },
          });
        } else {
          duck = await prisma.duck.create({
            data: {
              color: req.body.color,
              size: req.body.size,
              price: parseFloat(req.body.price),
              quantity: parseInt(req.body.quantity),
            },
          });
        }
        return res.status(200).send(duck);
      } else {
        return res.status(400).send({ errors: result.array() });
      }
    } catch (e) {
      return res.status(500).send();
    }
  }
);

// Delete the duck
router.delete("/", checkSchema({ id: { isInt: true } }), async (req, res) => {
  try {
    const result = validationResult(req);

    if (result.isEmpty()) {
      const existing = await prisma.duck.findFirst({
        where: { id: parseInt(req.body.id) },
      });
      if (existing) {
        await prisma.duck.update({
          where: { id: parseInt(req.body.id) },
          data: { deleted: true },
        });
        return res.status(200).send();
      } else {
        return res.status(404).send({
          errors: [
            {
              type: "field",
              msg: "Not found",
              path: "id",
              location: "body",
            },
          ],
        });
      }
    } else {
      return res.status(400).send({ errors: result.array() });
    }
  } catch (e) {
    return res.status(500).send();
  }
});

// Edit the duck
router.put(
  "/",
  checkSchema({
    id: { isInt: true },
    quantity: { isInt: true, optional: true },
    price: {
      isDecimal: true,
      optional: true,
    },
  }),
  async (req, res) => {
    try {
      const result = validationResult(req);

      if (result.isEmpty()) {
        const existing = await prisma.duck.findFirst({
          where: { id: parseInt(req.body.id) },
        });
        if (existing) {
          await prisma.duck.update({
            where: { id: parseInt(req.body.id) },
            data: {
              ...(req.body.quantity && {
                quantity: parseInt(req.body.quantity),
              }),
              ...(req.body.price && { price: parseFloat(req.body.price) }),
            },
          });
          return res.status(200).send();
        } else {
          return res.status(404).send({
            errors: [
              {
                type: "field",
                msg: "Not found",
                path: "id",
                location: "body",
              },
            ],
          });
        }
      } else {
        return res.status(400).send({ errors: result.array() });
      }
    } catch (e) {
      return res.status(500).send();
    }
  }
);

module.exports = router;
