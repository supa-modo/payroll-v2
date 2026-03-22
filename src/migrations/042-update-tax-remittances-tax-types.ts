/**
 * Migration: Update Tax Remittances tax_type constraint
 *
 * Adds support for SHIF and Housing Levy remittances.
 */

import { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // If the previous version created a DB CHECK constraint (some setups do),
  // drop it and replace with the expanded allow-list.
  await queryInterface.sequelize.query(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'tax_remittances'
          AND tc.constraint_type = 'CHECK'
      LOOP
        IF pg_get_constraintdef(to_regclass('public.' || r.constraint_name)) ILIKE '%tax_type%'
           AND pg_get_constraintdef(to_regclass('public.' || r.constraint_name)) ILIKE '%PAYE%'
        THEN
          EXECUTE 'ALTER TABLE tax_remittances DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
        END IF;
      END LOOP;
    END $$;
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE tax_remittances
    DROP CONSTRAINT IF EXISTS tax_remittances_tax_type_check;
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE tax_remittances
    ADD CONSTRAINT tax_remittances_tax_type_check
    CHECK (tax_type IN ('PAYE','NSSF','NHIF','SHIF','HOUSING_LEVY'));
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(`
    ALTER TABLE tax_remittances
    DROP CONSTRAINT IF EXISTS tax_remittances_tax_type_check;
  `);
}

