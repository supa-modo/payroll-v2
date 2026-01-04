/**
 * Statutory Calculation Service
 * Handles PAYE, NSSF, NHIF calculations based on statutory rates
 */

import { StatutoryRate, Employee } from "../models";
import logger from "../utils/logger";

export interface StatutoryDeductions {
  paye: number;
  nssf: number;
  nhif: number;
}

/**
 * Calculate PAYE (Pay As You Earn) tax
 */
export async function calculatePAYE(
  taxableIncome: number,
  country: string = "Kenya"
): Promise<number> {
  try {
    // Get PAYE rates for the country
    const payeRates = await StatutoryRate.findAll({
      where: {
        country,
        rateType: "paye",
        isActive: true,
      },
      order: [["effectiveFrom", "DESC"]],
    });

    if (payeRates.length === 0) {
      logger.warn(`No PAYE rates found for country: ${country}`);
      return 0;
    }

    // Use the most recent rate
    const rate = payeRates[0];
    const config = rate.config || {};

    // Config structure: { brackets: [{ min: 0, max: 10000, rate: 10 }, ...] }
    const brackets = config.brackets || [];

    if (brackets.length === 0) {
      // Fallback: single rate
      const rateValue = config.rate ? parseFloat(config.rate.toString()) : 0;
      return Math.round((taxableIncome * rateValue) / 100 * 100) / 100;
    }

    let totalTax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of brackets) {
      const minAmount = bracket.min || 0;
      const maxAmount = bracket.max || Infinity;
      const rateValue = bracket.rate || 0;

      if (remainingIncome <= 0) break;

      if (taxableIncome > minAmount) {
        const taxableInThisBracket = Math.min(
          remainingIncome,
          maxAmount - minAmount,
          taxableIncome - minAmount
        );

        if (taxableInThisBracket > 0) {
          const taxInThisBracket = (taxableInThisBracket * rateValue) / 100;
          totalTax += taxInThisBracket;
          remainingIncome -= taxableInThisBracket;
        }
      }
    }

    return Math.round(totalTax * 100) / 100; // Round to 2 decimal places
  } catch (error: any) {
    logger.error("Error calculating PAYE:", error);
    return 0;
  }
}

/**
 * Calculate NSSF (National Social Security Fund) contribution
 */
export async function calculateNSSF(
  grossPay: number,
  country: string = "Kenya"
): Promise<number> {
  try {
    // Get NSSF rate
    const nssfRate = await StatutoryRate.findOne({
      where: {
        country,
        rateType: "nssf",
        isActive: true,
      },
      order: [["effectiveFrom", "DESC"]],
    });

    if (!nssfRate) {
      logger.warn(`No NSSF rate found for country: ${country}`);
      return 0;
    }

    const config = nssfRate.config || {};
    const rate = config.rate ? parseFloat(config.rate.toString()) : 0;
    const maxContribution = config.maxAmount
      ? parseFloat(config.maxAmount.toString())
      : Infinity;

    // NSSF is calculated on gross pay up to a maximum
    const contributionBase = Math.min(grossPay, maxContribution);
    const contribution = (contributionBase * rate) / 100;

    return Math.round(contribution * 100) / 100;
  } catch (error: any) {
    logger.error("Error calculating NSSF:", error);
    return 0;
  }
}

/**
 * Calculate NHIF (National Hospital Insurance Fund) contribution
 */
export async function calculateNHIF(
  grossPay: number,
  country: string = "Kenya"
): Promise<number> {
  try {
    // Get NHIF rates (usually tiered based on gross pay)
    const nhifRates = await StatutoryRate.findAll({
      where: {
        country,
        rateType: "nhif",
        isActive: true,
      },
      order: [["effectiveFrom", "DESC"]],
    });

    if (nhifRates.length === 0) {
      logger.warn(`No NHIF rates found for country: ${country}`);
      return 0;
    }

    // Use the most recent rate
    const rate = nhifRates[0];
    const config = rate.config || {};

    // Config structure: { tiers: [{ min: 0, max: 10000, amount: 150 }, ...] } or { rate: 1.5 }
    const tiers = config.tiers || [];

    if (tiers.length > 0) {
      // Find the applicable tier
      for (const tier of tiers) {
        const minAmount = tier.min || 0;
        const maxAmount = tier.max || Infinity;

        if (grossPay >= minAmount && grossPay <= maxAmount) {
          return tier.amount ? parseFloat(tier.amount.toString()) : 0;
        }
      }

      // If no tier matches, use the highest tier
      const highestTier = tiers[tiers.length - 1];
      return highestTier.amount ? parseFloat(highestTier.amount.toString()) : 0;
    } else {
      // Fallback: percentage or fixed amount
      if (config.amount) {
        return parseFloat(config.amount.toString());
      } else if (config.rate) {
        const rateValue = parseFloat(config.rate.toString());
        return Math.round((grossPay * rateValue) / 100 * 100) / 100;
      }
    }

    return 0;
  } catch (error: any) {
    logger.error("Error calculating NHIF:", error);
    return 0;
  }
}

/**
 * Calculate all statutory deductions
 */
export async function calculateAllStatutoryDeductions(
  grossPay: number,
  taxableIncome: number,
  employee: Employee
): Promise<StatutoryDeductions> {
  const country = employee.country || "Kenya";

  const [paye, nssf, nhif] = await Promise.all([
    calculatePAYE(taxableIncome, country),
    calculateNSSF(grossPay, country),
    calculateNHIF(grossPay, country),
  ]);

  return {
    paye,
    nssf,
    nhif,
  };
}

