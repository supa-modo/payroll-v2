import { QueryInterface } from "sequelize";

interface StatutorySeed {
  rateType: string;
  config: Record<string, any>;
}

const kenyaRates: StatutorySeed[] = [
  {
    rateType: "paye",
    config: {
      brackets: [
        { min: 0, max: 24000, rate: 10 },
        { min: 24000, max: 32333, rate: 25 },
        { min: 32333, max: 500000, rate: 30 },
        { min: 500000, max: 800000, rate: 32.5 },
        { min: 800000, max: null, rate: 35 },
      ],
    },
  },
  {
    rateType: "nssf",
    config: {
      tiers: [
        { min: 0, max: 9000, employeeRate: 6, employerRate: 6 },
        { min: 9000, max: 108000, employeeRate: 6, employerRate: 6 },
      ],
    },
  },
  {
    rateType: "shif",
    config: {
      rate: 2.75,
      minAmount: 300,
    },
  },
  {
    rateType: "housing_levy",
    config: {
      employeeRate: 1.5,
      employerRate: 1.5,
    },
  },
  {
    rateType: "relief",
    config: {
      personalRelief: 2400,
      insuranceReliefRate: 15,
      insuranceReliefCap: 5000,
    },
  },
];

export async function up(queryInterface: QueryInterface): Promise<void> {
  for (const rate of kenyaRates) {
    await queryInterface.sequelize.query(
      `
      INSERT INTO statutory_rates (id, country, rate_type, effective_from, config, is_active, created_at, updated_at)
      SELECT gen_random_uuid(), 'Kenya', :rateType, DATE '2026-03-01', CAST(:config AS jsonb), true, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1
        FROM statutory_rates
        WHERE country = 'Kenya' AND rate_type = :rateType AND effective_from = DATE '2026-03-01'
      );
      `,
      {
        replacements: {
          rateType: rate.rateType,
          config: JSON.stringify(rate.config),
        },
      }
    );
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(
    `
    DELETE FROM statutory_rates
    WHERE country = 'Kenya'
      AND effective_from = DATE '2026-03-01'
      AND rate_type IN ('paye', 'nssf', 'shif', 'housing_levy', 'relief');
    `
  );
}
