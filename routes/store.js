const { Decimal } = require("decimal.js");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { checkSchema, validationResult } = require("express-validator");

const {
  calculateTaxByDestination,
  calculateTaxByPackageType,
  calculateTaxByQuantity,
  calculateTaxByShipmentType,
  colors,
  getCostPreTax,
  getPackageType,
  getProtectionType,
  pipe,
  sizes,
  shippingMethods,
} = require("../utils");

// create order
router.post(
  "/",
  checkSchema({
    color: {
      isIn: { options: [colors] },
    },
    size: {
      isIn: { options: [sizes] },
    },
    id: {
      isNumeric: true,
    },
    quantity: {
      isInt: true,
    },
    destination: true,
    shippingMethod: {
      isIn: { options: [shippingMethods] },
    },
  }),
  async (req, res) => {
    try {
      const result = validationResult(req);

      if (result.isEmpty()) {
        const { size, shippingMethod, quantity, id } = req.body;
        const existing = await prisma.duck.findFirst({
          where: {
            id: parseInt(id),
            deleted: false,
          },
        });
        if (existing) {
          const packageType = getPackageType(size);
          const protectionType = getProtectionType({
            packageType,
            shippingMethod,
          });
          const preTaxCost = getCostPreTax({ price: existing.price, quantity });
          const order = pipe(
            calculateTaxByDestination,
            calculateTaxByPackageType,
            calculateTaxByQuantity,
            calculateTaxByShipmentType
          )({
            ...req.body,
            packageType,
            protectionType,
            details: { preTaxCost },
          });
          const total = Object.values(order.details).reduce(
            (acc, value) => Decimal(acc).plus(value),
            Decimal(0)
          );
          return res.status(200).send({
            total,
            packageType: order.packageType,
            protectionType: order.protectionType,
            costDetails: order.details,
          });
        } else {
          return res.status(404).send({
            errors: [
              { msg: `Duck id #${id} does not exist. Cannot complete order` },
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
