/**
 * Statutory Calculation Service
 * Handles PAYE, NSSF, SHIF and Housing Levy calculations.
 */

import { Employee, EmployeeSalaryRelief, SalaryRelief, StatutoryRate } from "../models";
import logger from "../utils/logger";
import { Op } from "sequelize";

export interface StatutoryDeductions {
  paye: number;
  payeGross: number;
  nssf: number;
  employerNssf: number;
  shif: number;
  housingLevy: number;
  employerHousingLevy: number;
  personalRelief: number;
  insuranceRelief: number;
  taxableIncomeAfterNssf: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function getLatestRate(country: string, rateType: string): Promise<StatutoryRate | null> {
  return StatutoryRate.findOne({
    where: {
      country,
      rateType,
      isActive: true,
    },
    order: [["effectiveFrom", "DESC"]],
  });
}

function getConfigNumber(config: Record<string, any>, key: string, defaultValue = 0): number {
  const value = config[key];
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  const parsed = parseFloat(value.toString());
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function calculateProgressiveTax(
  taxableIncome: number,
  brackets: Array<{ min: number; max?: number | null; rate: number }>
): number {
  let tax = 0;
  let remaining = Math.max(0, taxableIncome);

  for (const bracket of brackets) {
    if (remaining <= 0) {
      break;
    }
    const min = getConfigNumber(bracket as any, "min", 0);
    const max = bracket.max == null ? Infinity : getConfigNumber(bracket as any, "max", Infinity);
    const rate = getConfigNumber(bracket as any, "rate", 0);
    if (taxableIncome <= min) {
      continue;
    }
    const bracketWidth = max === Infinity ? remaining : Math.max(0, max - min);
    const taxableInBracket = Math.min(remaining, bracketWidth);
    if (taxableInBracket > 0) {
      tax += (taxableInBracket * rate) / 100;
      remaining -= taxableInBracket;
    }
  }

  return round2(tax);
}

export async function calculateNSSF(
  grossPay: number,
  country: string = "Kenya"
): Promise<number> {
  try {
    const nssfRate = await getLatestRate(country, "nssf");
    if (!nssfRate) {
      return 0;
    }
    const config = nssfRate.config || {};
    const tiers: Array<{
      min?: number;
      max?: number;
      employeeRate?: number;
      rate?: number;
    }> = config.tiers || [];

    if (tiers.length > 0) {
      let total = 0;
      for (const tier of tiers) {
        const min = getConfigNumber(tier as any, "min", 0);
        const max = tier.max == null ? Infinity : getConfigNumber(tier as any, "max", Infinity);
        const rate = getConfigNumber(tier as any, "employeeRate", getConfigNumber(tier as any, "rate", 0));
        if (grossPay <= min || rate <= 0) {
          continue;
        }
        const taxableInTier = Math.min(grossPay, max) - min;
        if (taxableInTier > 0) {
          total += (taxableInTier * rate) / 100;
        }
      }
      return round2(total);
    }

    const rate = getConfigNumber(config, "rate", 0);
    const maxContribution = getConfigNumber(config, "maxAmount", Infinity);
    const contributionBase = Math.min(grossPay, maxContribution);
    return round2((contributionBase * rate) / 100);
  } catch (error: any) {
    logger.error("Error calculating NSSF:", error);
    return 0;
  }
}

export async function calculateEmployerNSSF(
  grossPay: number,
  country: string = "Kenya"
): Promise<number> {
  try {
    const nssfRate = await getLatestRate(country, "nssf");
    if (!nssfRate) {
      return 0;
    }

    const config = nssfRate.config || {};
    const tiers: Array<{
      min?: number;
      max?: number;
      employerRate?: number;
      rate?: number;
    }> = config.tiers || [];

    if (tiers.length > 0) {
      let total = 0;
      for (const tier of tiers) {
        const min = getConfigNumber(tier as any, "min", 0);
        const max = tier.max == null ? Infinity : getConfigNumber(tier as any, "max", Infinity);
        const rate = getConfigNumber(
          tier as any,
          "employerRate",
          getConfigNumber(tier as any, "rate", 0)
        );

        if (grossPay <= min || rate <= 0) {
          continue;
        }

        const taxableInTier = Math.min(grossPay, max) - min;
        if (taxableInTier > 0) {
          total += (taxableInTier * rate) / 100;
        }
      }
      return round2(total);
    }

    const rate = getConfigNumber(config, "employerRate", getConfigNumber(config, "rate", 0));
    const maxContribution = getConfigNumber(config, "maxAmount", Infinity);
    const contributionBase = Math.min(grossPay, maxContribution);
    return round2((contributionBase * rate) / 100);
  } catch (error: any) {
    logger.error("Error calculating employer NSSF:", error);
    return 0;
  }
}

export async function calculateSHIF(
  grossPay: number,
  country: string = "Kenya"
): Promise<number> {
  try {
    const shifRate = (await getLatestRate(country, "shif")) || (await getLatestRate(country, "nhif"));
    if (!shifRate) {
      return 0;
    }
    const config = shifRate.config || {};
    const rate = getConfigNumber(config, "rate", 0);
    const minimum = getConfigNumber(config, "minAmount", 0);
    const fixedAmount = getConfigNumber(config, "amount", 0);
    if (fixedAmount > 0) {
      return round2(fixedAmount);
    }
    const calculated = (grossPay * rate) / 100;
    return round2(Math.max(minimum, calculated));
  } catch (error: any) {
    logger.error("Error calculating SHIF:", error);
    return 0;
  }
}

export async function calculateHousingLevy(
  grossPay: number,
  country: string = "Kenya"
): Promise<number> {
  try {
    const levyRate = await getLatestRate(country, "housing_levy");
    if (!levyRate) {
      return 0;
    }
    const config = levyRate.config || {};
    const rate = getConfigNumber(config, "employeeRate", getConfigNumber(config, "rate", 0));
    return round2((grossPay * rate) / 100);
  } catch (error: any) {
    logger.error("Error calculating Housing Levy:", error);
    return 0;
  }
}

export async function calculateEmployerHousingLevy(
  grossPay: number,
  country: string = "Kenya"
): Promise<number> {
  try {
    const levyRate = await getLatestRate(country, "housing_levy");
    if (!levyRate) {
      return 0;
    }
    const config = levyRate.config || {};
    const rate = getConfigNumber(
      config,
      "employerRate",
      getConfigNumber(config, "rate", 0)
    );
    return round2((grossPay * rate) / 100);
  } catch (error: any) {
    logger.error("Error calculating employer Housing Levy:", error);
    return 0;
  }
}

export async function calculatePAYE(
  taxableIncome: number,
  personalRelief: number,
  insuranceRelief: number,
  country: string = "Kenya"
): Promise<{ grossTax: number; netTax: number }> {
  try {
    const payeRate = await getLatestRate(country, "paye");
    if (!payeRate) {
      return { grossTax: 0, netTax: 0 };
    }
    const config = payeRate.config || {};
    const brackets = (config.brackets || []) as Array<{ min: number; max?: number; rate: number }>;
    const grossTax =
      brackets.length > 0
        ? calculateProgressiveTax(taxableIncome, brackets)
        : round2((taxableIncome * getConfigNumber(config, "rate", 0)) / 100);

    const netTax = Math.max(0, grossTax - personalRelief - insuranceRelief);
    return { grossTax, netTax: round2(netTax) };
  } catch (error: any) {
    logger.error("Error calculating PAYE:", error);
    return { grossTax: 0, netTax: 0 };
  }
}

export async function calculateAllStatutoryDeductions(
  grossPay: number,
  taxableIncome: number,
  employee: Employee
): Promise<StatutoryDeductions> {
  const country = employee.country || "Kenya";

  const [
    nssf,
    employerNssf,
    shif,
    housingLevy,
    employerHousingLevy,
    reliefRate,
    mandatoryReliefs,
    employeeReliefs,
  ] = await Promise.all([
    calculateNSSF(grossPay, country),
    calculateEmployerNSSF(grossPay, country),
    calculateSHIF(grossPay, country),
    calculateHousingLevy(grossPay, country),
    calculateEmployerHousingLevy(grossPay, country),
    getLatestRate(country, "relief"),
    SalaryRelief.findAll({
      where: {
        tenantId: employee.tenantId,
        isActive: true,
        isMandatory: true,
        effectiveFrom: { [Op.lte]: new Date() },
        [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: new Date() } }],
      },
    }),
    EmployeeSalaryRelief.findAll({
      where: {
        employeeId: employee.id,
        effectiveFrom: { [Op.lte]: new Date() },
        [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: new Date() } }],
      },
      include: [{ model: SalaryRelief, as: "salaryRelief", required: true }],
    }),
  ]);

  const reliefConfig = reliefRate?.config || {};
  let personalRelief = getConfigNumber(reliefConfig, "personalRelief", 2400);
  const insuranceReliefRate = getConfigNumber(reliefConfig, "insuranceReliefRate", 15);
  const insuranceReliefCap = getConfigNumber(reliefConfig, "insuranceReliefCap", 5000);
  let insuranceRelief = round2(Math.min((shif * insuranceReliefRate) / 100, insuranceReliefCap));

  for (const relief of mandatoryReliefs) {
    if (relief.reliefType === "personal" && relief.amount) {
      personalRelief += parseFloat(relief.amount.toString());
    }
  }

  for (const assignment of employeeReliefs) {
    const relief = assignment.get("salaryRelief") as SalaryRelief;
    if (!relief?.isActive) {
      continue;
    }
    if (relief.reliefType === "insurance") {
      if (assignment.amount != null) {
        insuranceRelief += parseFloat(assignment.amount.toString());
      } else if (relief.calculationType === "percentage" && relief.percentageValue) {
        insuranceRelief += (shif * parseFloat(relief.percentageValue.toString())) / 100;
      } else if (relief.amount) {
        insuranceRelief += parseFloat(relief.amount.toString());
      }
      if (relief.maxAmount != null) {
        insuranceRelief = Math.min(
          insuranceRelief,
          parseFloat(relief.maxAmount.toString())
        );
      }
    }
  }

  const taxableIncomeAfterNssf = round2(Math.max(0, taxableIncome - nssf));
  const { grossTax: payeGross, netTax: paye } = await calculatePAYE(
    taxableIncomeAfterNssf,
    personalRelief,
    insuranceRelief,
    country
  );

  return {
    paye,
    payeGross,
    nssf,
    employerNssf,
    shif,
    housingLevy,
    employerHousingLevy,
    personalRelief,
    insuranceRelief,
    taxableIncomeAfterNssf,
  };
}

