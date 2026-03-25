import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalaryConfigurationEngine1773110000000
  implements MigrationInterface
{
  name = 'AddSalaryConfigurationEngine1773110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."salary_component_category_enum" AS ENUM('EARNING', 'DEDUCTION')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."salary_component_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."salary_component_source_type_enum" AS ENUM('TEMPLATE_DEFAULT', 'AUTO_STATUTORY', 'MANUAL_DEFAULT', 'EMPLOYEE_CUSTOM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."salary_calculation_type_enum" AS ENUM('FIXED', 'PERCENTAGE', 'FORMULA', 'RESIDUAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."salary_structure_status_enum" AS ENUM('DRAFT', 'ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."statutory_type_enum" AS ENUM('PF', 'ESI', 'PT', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."statutory_component_side_enum" AS ENUM('EMPLOYEE', 'EMPLOYER', 'SHARED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."statutory_calculation_mode_enum" AS ENUM('PERCENTAGE', 'FIXED', 'SLAB')`,
    );

    await queryRunner.query(
      `CREATE TABLE "organization_salary_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" character varying(80) NOT NULL DEFAULT 'ORG_DEFAULT',
        "defaultTemplateName" character varying(160) NOT NULL DEFAULT 'Default Salary Template',
        "version" integer NOT NULL DEFAULT '1',
        "active" boolean NOT NULL DEFAULT true,
        "effectiveFrom" date NOT NULL,
        "taxRegimeDefaults" character varying(10) NOT NULL DEFAULT 'New',
        "pfConfig" jsonb NOT NULL DEFAULT '{}',
        "esiConfig" jsonb NOT NULL DEFAULT '{}',
        "ptConfig" jsonb NOT NULL DEFAULT '{}',
        "roundingRules" jsonb NOT NULL DEFAULT '{}',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organization_salary_configs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_org_salary_config_org_version" UNIQUE ("organizationId", "version")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "salary_template_components" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationSalaryConfigId" uuid NOT NULL,
        "componentName" character varying(120) NOT NULL,
        "componentCode" character varying(80) NOT NULL,
        "category" "public"."salary_component_category_enum" NOT NULL,
        "sourceType" "public"."salary_component_source_type_enum" NOT NULL DEFAULT 'TEMPLATE_DEFAULT',
        "status" "public"."salary_component_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "defaultEnabled" boolean NOT NULL DEFAULT true,
        "calculationType" "public"."salary_calculation_type_enum" NOT NULL DEFAULT 'FIXED',
        "value" numeric(12,4),
        "percentageOf" character varying(80),
        "formulaExpression" text,
        "taxable" boolean NOT NULL DEFAULT true,
        "includeInPfWage" boolean NOT NULL DEFAULT false,
        "includeInEsiWage" boolean NOT NULL DEFAULT false,
        "includeInGross" boolean NOT NULL DEFAULT true,
        "affectsNetPay" boolean NOT NULL DEFAULT true,
        "editableForEmployee" boolean NOT NULL DEFAULT true,
        "displayOrder" integer NOT NULL DEFAULT '1',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_salary_template_components_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_salary_template_component_code" UNIQUE ("organizationSalaryConfigId", "componentCode")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "employee_salary_structures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeeId" uuid NOT NULL,
        "organizationSalaryConfigId" uuid NOT NULL,
        "annualCtc" numeric(12,2) NOT NULL DEFAULT '0',
        "monthlyCtc" numeric(12,2) NOT NULL DEFAULT '0',
        "taxRegime" character varying(10) NOT NULL DEFAULT 'New',
        "overrideEnabled" boolean NOT NULL DEFAULT false,
        "effectiveFrom" date NOT NULL,
        "status" "public"."salary_structure_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "notes" text,
        "summary" jsonb NOT NULL DEFAULT '{}',
        "bankingInfo" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_salary_structures_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "employee_salary_components" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeeSalaryStructureId" uuid NOT NULL,
        "componentName" character varying(120) NOT NULL,
        "componentCode" character varying(80) NOT NULL,
        "category" "public"."salary_component_category_enum" NOT NULL,
        "sourceType" "public"."salary_component_source_type_enum" NOT NULL DEFAULT 'TEMPLATE_DEFAULT',
        "calculationType" "public"."salary_calculation_type_enum" NOT NULL DEFAULT 'FIXED',
        "value" numeric(12,4),
        "calculatedAmount" numeric(12,2) NOT NULL DEFAULT '0',
        "percentageOf" character varying(80),
        "formulaReference" text,
        "isOverride" boolean NOT NULL DEFAULT false,
        "includeInGross" boolean NOT NULL DEFAULT true,
        "taxable" boolean NOT NULL DEFAULT true,
        "includeInPfWage" boolean NOT NULL DEFAULT false,
        "includeInEsiWage" boolean NOT NULL DEFAULT false,
        "affectsNetPay" boolean NOT NULL DEFAULT true,
        "displayOrder" integer NOT NULL DEFAULT '1',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_salary_components_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "employee_statutory_breakdowns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeeSalaryStructureId" uuid NOT NULL,
        "statutoryType" "public"."statutory_type_enum" NOT NULL DEFAULT 'OTHER',
        "componentSide" "public"."statutory_component_side_enum" NOT NULL DEFAULT 'EMPLOYEE',
        "componentName" character varying(120) NOT NULL,
        "calculationMode" "public"."statutory_calculation_mode_enum" NOT NULL DEFAULT 'PERCENTAGE',
        "rate" numeric(10,4),
        "basisAmount" numeric(12,2) NOT NULL DEFAULT '0',
        "wageBasis" character varying(80),
        "amount" numeric(12,2) NOT NULL DEFAULT '0',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_statutory_breakdowns_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "salary_template_components"
       ADD CONSTRAINT "FK_salary_template_components_config"
       FOREIGN KEY ("organizationSalaryConfigId")
       REFERENCES "organization_salary_configs"("id")
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "employee_salary_structures"
       ADD CONSTRAINT "FK_employee_salary_structures_employee"
       FOREIGN KEY ("employeeId")
       REFERENCES "users"("id")
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "employee_salary_structures"
       ADD CONSTRAINT "FK_employee_salary_structures_config"
       FOREIGN KEY ("organizationSalaryConfigId")
       REFERENCES "organization_salary_configs"("id")
       ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "employee_salary_components"
       ADD CONSTRAINT "FK_employee_salary_components_structure"
       FOREIGN KEY ("employeeSalaryStructureId")
       REFERENCES "employee_salary_structures"("id")
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "employee_statutory_breakdowns"
       ADD CONSTRAINT "FK_employee_statutory_breakdowns_structure"
       FOREIGN KEY ("employeeSalaryStructureId")
       REFERENCES "employee_salary_structures"("id")
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_org_salary_config_active" ON "organization_salary_configs" ("organizationId", "active", "effectiveFrom")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_employee_salary_structure_employee" ON "employee_salary_structures" ("employeeId", "status", "effectiveFrom")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_employee_salary_structure_employee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_org_salary_config_active"`,
    );

    await queryRunner.query(
      `ALTER TABLE "employee_statutory_breakdowns" DROP CONSTRAINT "FK_employee_statutory_breakdowns_structure"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_salary_components" DROP CONSTRAINT "FK_employee_salary_components_structure"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_salary_structures" DROP CONSTRAINT "FK_employee_salary_structures_config"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_salary_structures" DROP CONSTRAINT "FK_employee_salary_structures_employee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "salary_template_components" DROP CONSTRAINT "FK_salary_template_components_config"`,
    );

    await queryRunner.query(`DROP TABLE "employee_statutory_breakdowns"`);
    await queryRunner.query(`DROP TABLE "employee_salary_components"`);
    await queryRunner.query(`DROP TABLE "employee_salary_structures"`);
    await queryRunner.query(`DROP TABLE "salary_template_components"`);
    await queryRunner.query(`DROP TABLE "organization_salary_configs"`);

    await queryRunner.query(`DROP TYPE "public"."statutory_calculation_mode_enum"`);
    await queryRunner.query(`DROP TYPE "public"."statutory_component_side_enum"`);
    await queryRunner.query(`DROP TYPE "public"."statutory_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."salary_structure_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."salary_calculation_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."salary_component_source_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."salary_component_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."salary_component_category_enum"`);
  }
}
