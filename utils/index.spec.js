const {
  calculateTaxByDestination,
  calculateTaxByPackageType,
  calculateTaxByQuantity,
  calculateTaxByShipmentType,
  getPackageType,
  getProtectionType,
  getCostPreTax,
  packageMap,
  protectionMap,
  shippingMethodMap,
} = require("./index");

describe("utils", function () {
  describe("getPackageType", () => {
    it("should return PLASTIC for XSMALL", () => {
      expect(getPackageType("XSMALL")).toBe(packageMap.PLASTIC);
    });
    it("should return PLASTIC for SMALL", () => {
      expect(getPackageType("SMALL")).toBe(packageMap.PLASTIC);
    });
    it("should return CARDBOARD for MEDIUM", () => {
      expect(getPackageType("MEDIUM")).toBe(packageMap.CARDBOARD);
    });
    it("should return WOOD for LARGE", () => {
      expect(getPackageType("LARGE")).toBe(packageMap.WOOD);
    });
    it("should return WOOD for XLARGE", () => {
      expect(getPackageType("XLARGE")).toBe(packageMap.WOOD);
    });
  });
  describe("getProtectionType", () => {
    it("should return POLYSTYRENE_BALLS if package is WOOD and shippingMethod is AIR", () => {
      expect(
        getProtectionType({
          shippingMethod: shippingMethodMap.AIR,
          packageType: packageMap.WOOD,
        })
      ).toEqual([protectionMap.POLYSTYRENE_BALLS]);
    });
    it("should return POLYSTYRENE_BALLS if package is CARDBOARD and shippingMethod is AIR", () => {
      expect(
        getProtectionType({
          shippingMethod: shippingMethodMap.AIR,
          packageType: packageMap.CARDBOARD,
        })
      ).toEqual([protectionMap.POLYSTYRENE_BALLS]);
    });
    it("should return BUBBLE_WRAP_BAGS if package is PLASTIC and shippingMethod is AIR", () => {
      expect(
        getProtectionType({
          shippingMethod: shippingMethodMap.AIR,
          packageType: packageMap.PLASTIC,
        })
      ).toEqual([protectionMap.BUBBLE_WRAP_BAGS]);
    });
    it("should return POLYSTYRENE_BALLS if package is anythig and shippingMethod is LAND", () => {
      expect(
        getProtectionType({
          shippingMethod: shippingMethodMap.LAND,
          packageType: packageMap.PLASTIC,
        })
      ).toEqual([protectionMap.POLYSTYRENE_BALLS]);
      expect(
        getProtectionType({
          shippingMethod: shippingMethodMap.LAND,
          packageType: packageMap.CARDBOARD,
        })
      ).toEqual([protectionMap.POLYSTYRENE_BALLS]);
      expect(
        getProtectionType({
          shippingMethod: shippingMethodMap.LAND,
          packageType: packageMap.WOOD,
        })
      ).toEqual([protectionMap.POLYSTYRENE_BALLS]);
    });
    it("should return MOISTURE_ABSORBING_BEADS and BUBBLE_WRAP_BAGS if package is anything and shippingMethod is SEA", () => {
      const plasticResult = getProtectionType({
        shippingMethod: "SEA",
        packageType: packageMap.PLASTIC,
      });
      expect(plasticResult).toContain(protectionMap.MOISTURE_ABSORBING_BEADS);
      expect(plasticResult).toContain(protectionMap.BUBBLE_WRAP_BAGS);

      const carboardResult = getProtectionType({
        shippingMethod: "SEA",
        packageType: packageMap.CARDBOARD,
      });
      expect(carboardResult).toContain(protectionMap.MOISTURE_ABSORBING_BEADS);
      expect(carboardResult).toContain(protectionMap.BUBBLE_WRAP_BAGS);

      const woodResult = getProtectionType({
        shippingMethod: "SEA",
        packageType: packageMap.WOOD,
      });
      expect(woodResult).toContain(protectionMap.MOISTURE_ABSORBING_BEADS);
      expect(woodResult).toContain(protectionMap.BUBBLE_WRAP_BAGS);
    });
  });
  describe("getCostPreTax", () => {
    it("should multiply quantity by price accurately", () => {
      expect(getCostPreTax({ price: 1.39, quantity: 77 })).toEqual("107.03");
    });
  });
  describe("calculateTaxByQuantity", () => {
    it("should calculate 20% discount if the quantity is greater than 100", () => {
      const result = calculateTaxByQuantity({
        quantity: 101,
        details: { preTaxCost: "101" },
      });
      expect(result.details.quantityDiscount).toBe("-20.20");
    });
    it("should not change add 20% discount if quantity is less than or equal to 100 ", () => {
      const result = calculateTaxByQuantity({
        quantity: 100,
        details: { preTaxCost: "101" },
      });
      expect(result.details.quantityDiscount).toBeUndefined();
    });
  });
  describe("calculateTaxByPackageType", () => {
    it("should add 5% tax for wood packaging", () => {
      const result = calculateTaxByPackageType({
        packageType: packageMap.WOOD,
        details: { preTaxCost: "1" },
      });
      expect(result.details.packageTax).toBe("0.05");
    });
    it("should add 10% tax for plastic packaging", () => {
      const result = calculateTaxByPackageType({
        packageType: packageMap.PLASTIC,
        details: { preTaxCost: "5.10" },
      });
      expect(result.details.packageTax).toBe("0.51");
    });
    it("should discount 1% for cardboard", () => {
      const result = calculateTaxByPackageType({
        packageType: packageMap.CARDBOARD,
        details: { preTaxCost: "7.33" },
      });
      expect(result.details.packageTax).toBe("-0.07");
    });
  });
  describe("calculateTaxByDestination", () => {
    it("should add 18% tax for destination being USA", () => {
      const result = calculateTaxByDestination({
        destination: "USA",
        details: { preTaxCost: "100" },
      });
      expect(result.details.destinationTax).toBe("18.00");
    });
    it("should add 13% tax for destination being BOLIVIA", () => {
      const result = calculateTaxByDestination({
        destination: "BOL",
        details: { preTaxCost: "100" },
      });
      expect(result.details.destinationTax).toBe("13.00");
    });
    it("should add 19% tax for destination being INDIA ", () => {
      const result = calculateTaxByDestination({
        destination: "IND",
        details: { preTaxCost: "100" },
      });
      expect(result.details.destinationTax).toBe("19.00");
    });
    it("should add 15% tax for destination being anything other than BOL, IND, USA ", () => {
      const result = calculateTaxByDestination({
        destination: "UKR",
        details: { preTaxCost: "100" },
      });
      expect(result.details.destinationTax).toBe("15.00");
    });
  });
  describe("calculateTaxByShipmentType", () => {
    it("should add 400 dollars if shippingMethod is SEA", () => {
      const result = calculateTaxByShipmentType({
        shippingMethod: shippingMethodMap.SEA,
        quantity: 100,
      });
      expect(result.details.shippingTax).toBe("400.00");
    });
    it("should add 10 dollars per order quantity if shippingMethod is LAND", () => {
      const result = calculateTaxByShipmentType({
        shippingMethod: shippingMethodMap.LAND,
        quantity: 100,
      });
      expect(result.details.shippingTax).toBe("1000.00");
    });
    it("should add 30 dollars per order quantity if shippingMethod is AIR and quantity is under 1000", () => {
      const result = calculateTaxByShipmentType({
        shippingMethod: shippingMethodMap.AIR,
        quantity: 1000,
      });
      expect(result.details.shippingTax).toBe("30000.00");
    });
    it("should add 30 dollars per order quantity if shippingMethod is AIR and discount it if quantity is over 1000", () => {
      const result = calculateTaxByShipmentType({
        shippingMethod: shippingMethodMap.AIR,
        quantity: 1001,
      });
      expect(result.details.shippingTax).toBe("25525.50");
    });
  });
});
