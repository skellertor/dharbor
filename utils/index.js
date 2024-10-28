const Decimal = require("decimal.js");
Decimal.set({ rounding: Decimal.ROUND_DOWN });

const colorMap = {
  RED: "RED",
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  BLACK: "BLACK",
};
const colors = Object.values(colorMap);

const sizeMap = {
  XLARGE: "XLARGE",
  LARGE: "LARGE",
  MEDIUM: "MEDIUM",
  SMALL: "SMALL",
  XSMALL: "XSMALL",
};
const sizes = Object.values(sizeMap);

const shippingMethodMap = { LAND: "LAND", AIR: "AIR", SEA: "SEA" };
const shippingMethods = Object.values(shippingMethodMap);

const packageMap = {
  WOOD: "WOOD",
  CARDBOARD: "CARDBOARD",
  PLASTIC: "PLASTIC",
};

const protectionMap = {
  BUBBLE_WRAP_BAGS: "BUBBLE_WRAP_BAGS",
  POLYSTYRENE_BALLS: "POLYSTYRENE_BALLS",
  MOISTURE_ABSORBING_BEADS: "MOISTURE_ABSORBING_BEADS",
};

const destinationTaxMap = {
  USA: 0.18,
  BOL: 0.13,
  IND: 0.19,
};
const destinationTaxProxy = new Proxy(destinationTaxMap, {
  get(target, prop) {
    return target[prop] ? target[prop] : 0.15;
  },
});

const packageTaxMap = {
  [packageMap.WOOD]: 0.05,
  [packageMap.PLASTIC]: 0.1,
  [packageMap.CARDBOARD]: -0.01,
};

const sizePackageTypeMap = {
  XLARGE: "WOOD",
  LARGE: "WOOD",
  MEDIUM: "CARDBOARD",
  SMALL: "PLASTIC",
  XSMALL: "PLASTIC",
};

function pipe(...functions) {
  return function (value) {
    return functions.reduce(
      (currentValue, currentFunction) => currentFunction(currentValue),
      value
    );
  };
}

function getPackageType(size) {
  return sizePackageTypeMap[size];
}

function getProtectionType({ shippingMethod, packageType }) {
  const protectionTypes = [];
  if (shippingMethod === shippingMethodMap.AIR) {
    packageType === packageMap.PLASTIC
      ? protectionTypes.push(protectionMap.BUBBLE_WRAP_BAGS)
      : protectionTypes.push(protectionMap.POLYSTYRENE_BALLS);
  } else if (shippingMethod === shippingMethodMap.SEA) {
    protectionTypes.push(
      protectionMap.BUBBLE_WRAP_BAGS,
      protectionMap.MOISTURE_ABSORBING_BEADS
    );
  } else if (shippingMethod === shippingMethodMap.LAND) {
    protectionTypes.push(protectionMap.POLYSTYRENE_BALLS);
  }
  return protectionTypes;
}

function getCostPreTax({ price, quantity }) {
  return Decimal(price).times(quantity).toFixed(2);
}

function calculateTaxByQuantity(order) {
  if (order.quantity > 100) {
    const quantityDiscount = Decimal("-.2")
      .times(order.details.preTaxCost)
      .toFixed(2);
    return { ...order, details: { ...order.details, quantityDiscount } };
  }
  return order;
}

function calculateTaxByPackageType(order) {
  const packageTaxPercentage = packageTaxMap[order.packageType];
  const packageTax = Decimal(order.details.preTaxCost)
    .times(packageTaxPercentage.toFixed(2))
    .toFixed(2);
  return { ...order, details: { ...order.details, packageTax } };
}

function calculateTaxByDestination(order) {
  const destinationTaxPercentage = destinationTaxProxy[order.destination];
  const destinationTax = Decimal(order.details.preTaxCost)
    .times(destinationTaxPercentage.toFixed(2))
    .toFixed(2);
  return { ...order, details: { ...order.details, destinationTax } };
}

function calculateTaxByShipmentType(order) {
  let shippingTax = 0;
  if (order.shippingMethod === shippingMethodMap.SEA) {
    shippingTax = Decimal(shippingTax).plus(400).toFixed(2);
  } else if (order.shippingMethod === shippingMethodMap.LAND) {
    shippingTax = Decimal(order.quantity).times(10).toFixed(2);
  } else if (order.shippingMethod === shippingMethodMap.AIR) {
    shippingTax = Decimal(order.quantity).times(30).toFixed(2);
    shippingTax =
      order.quantity > 1000
        ? Decimal(shippingTax)
            .minus(Decimal(shippingTax).times(0.15))
            .toFixed(2)
        : shippingTax;
  }

  return { ...order, details: { ...order.details, shippingTax } };
}

module.exports = {
  calculateTaxByDestination,
  calculateTaxByPackageType,
  calculateTaxByQuantity,
  calculateTaxByShipmentType,
  colors,
  getCostPreTax,
  getPackageType,
  getProtectionType,
  packageMap,
  protectionMap,
  shippingMethods,
  shippingMethodMap,
  sizes,
  pipe,
};
