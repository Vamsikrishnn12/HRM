import { OrganizationSalaryConfig } from '../entities/OrganizationSalaryConfig.entity';
import { SalaryTemplateComponent } from '../entities/SalaryTemplateComponent.entity';
import { evaluateFormula } from '../salary/formulaEvaluator';
import {
  EsiWageBasis,
  PercentageBasis,
  PfWageBasis,
  PtCalculationMode,
  RoundingRule,
  SalaryCalculationType,
  SalaryComponentCategory,
  SalaryComponentSourceType,
  StatutoryCalculationMode,
  StatutoryComponentSide,
  StatutoryType,
} from '../salary/salary.enums';
import { SalaryPreviewInput } from '../salary/salary.types';

export interface CalculatedComponent {
  componentName: string;
  componentCode: string;
  category: SalaryComponentCategory;
  sourceType: SalaryComponentSourceType;
  calculationType: SalaryCalculationType;
  value: number | null;
  percentageOf: string | null;
  formulaExpression: string | null;
  amount: number;
  includeInGross: boolean;
  taxable: boolean;
  includeInPfWage: boolean;
  includeInEsiWage: boolean;
  affectsNetPay: boolean;
  editableForEmployee: boolean;
  isOverride: boolean;
  displayOrder: number;
}

export interface StatutoryBreakdownLine {
  statutoryType: StatutoryType;
  componentSide: StatutoryComponentSide;
  componentName: string;
  amount: number;
  calculationMode: StatutoryCalculationMode;
  rate: number | null;
  basisAmount: number;
  wageBasis: string | null;
  metadata: Record<string, unknown>;
}

export interface SalaryComputationResult {
  annualCtc: number;
  monthlyCtc: number;
  taxRegime: string;
  appliedTemplateName: string;
  appliedConfigVersion: number;
  earnings: CalculatedComponent[];
  deductions: CalculatedComponent[];
  statutoryBreakdowns: StatutoryBreakdownLine[];
  summary: {
    grossSalary: number;
    totalEarnings: number;
    totalDeductions: number;
    netPay: number;
    employeeDeductions: number;
    employerContributions: number;
    employerCostImpact: number;
    annualNetPay: number;
    annualEmployerCostImpact: number;
  };
}

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

const applyRounding = (value: number, rule: RoundingRule): number => {
  switch (rule) {
    case RoundingRule.CEIL:
      return Math.ceil(value);
    case RoundingRule.FLOOR:
      return Math.floor(value);
    case RoundingRule.ROUND:
      return Math.round(value);
    case RoundingRule.NONE:
    default:
      return value;
  }
};

const toPositive = (value: number) => (value < 0 ? 0 : value);

export class SalaryCalculationEngineService {
  calculate(
    config: OrganizationSalaryConfig,
    input: SalaryPreviewInput,
  ): SalaryComputationResult {
    const annualCtc = round2(input.annualCtc && input.annualCtc > 0 ? input.annualCtc : 0);
    const monthlyCtc = round2(
      input.monthlyCtc && input.monthlyCtc > 0
        ? input.monthlyCtc
        : annualCtc > 0
          ? annualCtc / 12
          : 0,
    );
    const computedAnnualCtc = annualCtc > 0 ? annualCtc : round2(monthlyCtc * 12);

    const componentRule = config.roundingRules?.componentRule ?? RoundingRule.ROUND;
    const statutoryRule = config.roundingRules?.statutoryRule ?? RoundingRule.ROUND;
    const summaryRule = config.roundingRules?.summaryRule ?? RoundingRule.ROUND;
    const overrides = this.normalizeOverrides(input.componentOverrides);
    const componentStates = this.normalizeStates(input.componentStates);

    const grossExcludesEmployerPf = Boolean(config.metadata?.grossExcludesEmployerPf);
    const pfEnabledForGross =
      input.statutoryOverrides?.pfApplicable ??
      Boolean(config.pfConfig?.pfApplicable && config.pfConfig?.defaultEnabled);
    const employerPfRateForGross =
      input.statutoryOverrides?.employerPfRate != null
        ? input.statutoryOverrides.employerPfRate
        : Number(config.pfConfig?.employerPfRate || 0);
    const employerPfBasisForGross =
      config.metadata?.employerPfBasis === 'HALF_MONTHLY_CTC'
        ? monthlyCtc / 2
        : monthlyCtc;
    const employerPfExcludedAmount =
      grossExcludesEmployerPf && pfEnabledForGross
        ? round2(
            toPositive(
              applyRounding(
                (employerPfBasisForGross * employerPfRateForGross) / 100,
                statutoryRule,
              ),
            ),
          )
        : 0;
    const configuredGross = round2(toPositive(monthlyCtc - employerPfExcludedAmount));

    const context: Record<string, number> = {
      CTC: computedAnnualCtc,
      MONTHLY_CTC: monthlyCtc,
      GROSS: configuredGross,
      BASIC_PLUS_HRA: 0,
    };

    const activeComponents = (config.templateComponents ?? [])
      .filter((c) => c.status === 'ACTIVE')
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const earningTemplates = activeComponents.filter(
      (c) => c.category === SalaryComponentCategory.EARNING,
    );
    const deductionTemplates = activeComponents.filter(
      (c) => c.category === SalaryComponentCategory.DEDUCTION,
    );

    const earnings = this.resolveComponents({
      templates: earningTemplates,
      context,
      overrides,
      componentStates,
      roundingRule: componentRule,
      residualBasis: 'GROSS',
    });

    const gross = round2(
      earnings
        .filter((c) => c.includeInGross)
        .reduce((sum, c) => sum + c.amount, 0),
    );
    context.GROSS = gross;
    context.BASIC_PLUS_HRA = round2((context.BASIC || 0) + (context.HRA || 0));

    const statutoryBreakdowns = this.calculateStatutoryBreakdowns({
      config,
      context,
      earnings,
      overrides: input.statutoryOverrides ?? {},
      roundRule: statutoryRule,
    });

    for (const statutory of statutoryBreakdowns) {
      context[this.toCode(statutory.componentName)] = statutory.amount;
    }

    const statutoryDeductions = statutoryBreakdowns
      .filter((s) => s.componentSide === StatutoryComponentSide.EMPLOYEE)
      .map<CalculatedComponent>((line, idx) => ({
        componentName: line.componentName,
        componentCode: this.toCode(line.componentName),
        category: SalaryComponentCategory.DEDUCTION,
        sourceType: SalaryComponentSourceType.AUTO_STATUTORY,
        calculationType: SalaryCalculationType.FIXED,
        value: line.amount,
        percentageOf: null,
        formulaExpression: null,
        amount: line.amount,
        includeInGross: false,
        taxable: false,
        includeInPfWage: false,
        includeInEsiWage: false,
        affectsNetPay: true,
        editableForEmployee: false,
        isOverride: false,
        displayOrder: 1000 + idx,
      }));

    const manualDeductions = this.resolveComponents({
      templates: deductionTemplates,
      context,
      overrides,
      componentStates,
      roundingRule: componentRule,
      residualBasis: 'GROSS',
    });

    const deductions = [...statutoryDeductions, ...manualDeductions].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    const totalEarnings = round2(earnings.reduce((sum, c) => sum + c.amount, 0));
    const employeeDeductions = round2(
      deductions.filter((d) => d.affectsNetPay).reduce((sum, d) => sum + d.amount, 0),
    );
    const totalDeductions = round2(deductions.reduce((sum, d) => sum + d.amount, 0));
    const employerContributions = round2(
      statutoryBreakdowns
        .filter((s) => s.componentSide === StatutoryComponentSide.EMPLOYER)
        .reduce((sum, s) => sum + s.amount, 0),
    );

    const netPay = round2(toPositive(totalEarnings - employeeDeductions));
    const employerCostImpact = round2(totalEarnings + employerContributions);

    return {
      annualCtc: computedAnnualCtc,
      monthlyCtc,
      taxRegime: input.taxRegime || config.taxRegimeDefaults || 'New',
      appliedTemplateName: config.defaultTemplateName,
      appliedConfigVersion: config.version,
      earnings,
      deductions,
      statutoryBreakdowns,
      summary: {
        grossSalary: applyRounding(gross, summaryRule),
        totalEarnings: applyRounding(totalEarnings, summaryRule),
        totalDeductions: applyRounding(totalDeductions, summaryRule),
        netPay: applyRounding(netPay, summaryRule),
        employeeDeductions: applyRounding(employeeDeductions, summaryRule),
        employerContributions: applyRounding(employerContributions, summaryRule),
        employerCostImpact: applyRounding(employerCostImpact, summaryRule),
        annualNetPay: applyRounding(netPay * 12, summaryRule),
        annualEmployerCostImpact: applyRounding(employerCostImpact * 12, summaryRule),
      },
    };
  }

  private resolveComponents(params: {
    templates: SalaryTemplateComponent[];
    context: Record<string, number>;
    overrides: Record<string, number>;
    componentStates: Record<string, boolean>;
    roundingRule: RoundingRule;
    residualBasis: string;
  }): CalculatedComponent[] {
    const { templates, context, overrides, componentStates, roundingRule, residualBasis } = params;
    const entries = templates
      .filter((template) => this.isComponentEnabled(template, componentStates))
      .map((template) => ({
        template,
        code: template.componentCode.toUpperCase(),
        resolved: false,
        amount: 0,
        isOverride: false,
      }));

    for (const row of entries) {
      if (row.code in overrides) {
        const amount = round2(toPositive(overrides[row.code] as number));
        row.amount = amount;
        row.resolved = true;
        row.isOverride = true;
        context[row.code] = amount;
      }
    }

    const maxPasses = entries.length + 5;
    let pass = 0;
    while (pass < maxPasses) {
      pass += 1;
      let progressed = false;

      for (const row of entries) {
        if (row.resolved) continue;

        const template = row.template;
        let amount: number | null = null;

        if (template.calculationType === SalaryCalculationType.FIXED) {
          amount = Number(template.value ?? 0);
        } else if (template.calculationType === SalaryCalculationType.PERCENTAGE) {
          const basisKey = (template.percentageOf || PercentageBasis.MONTHLY_CTC).toUpperCase();
          const basisAmount = this.getBasisAmount(basisKey, context);
          if (basisAmount == null) continue;
          amount = (basisAmount * Number(template.value ?? 0)) / 100;
        } else if (template.calculationType === SalaryCalculationType.FORMULA) {
          if (!template.formulaExpression) {
            throw new Error(
              `Formula expression missing for component ${template.componentCode}.`,
            );
          }
          try {
            amount = evaluateFormula(template.formulaExpression, context);
          } catch (err: any) {
            if (String(err?.message || '').includes('Unknown identifier')) {
              continue;
            }
            throw new Error(
              `Invalid formula for ${template.componentCode}: ${String(err?.message || err)}`,
            );
          }
        } else if (template.calculationType === SalaryCalculationType.RESIDUAL) {
          const basisKey = (template.percentageOf || residualBasis).toUpperCase();
          const basisAmount = this.getBasisAmount(basisKey, context);
          if (basisAmount == null) continue;
          const resolvedTotal = entries
            .filter((e) => e.resolved && e.code !== row.code)
            .filter((e) => e.template.includeInGross)
            .reduce((sum, e) => sum + e.amount, 0);
          amount = basisAmount - resolvedTotal;
        }

        if (amount == null) continue;
        const rounded = round2(toPositive(applyRounding(amount, roundingRule)));
        row.amount = rounded;
        row.resolved = true;
        context[row.code] = rounded;
        progressed = true;
      }

      if (entries.every((e) => e.resolved)) {
        break;
      }
      if (!progressed) {
        const unresolved = entries
          .filter((e) => !e.resolved)
          .map((e) => e.code)
          .join(', ');
        throw new Error(
          `Unable to resolve salary components. Check formula dependencies: ${unresolved}.`,
        );
      }
    }

    return entries
      .map<CalculatedComponent>((row) => {
        const template = row.template;
        return {
          componentName: template.componentName,
          componentCode: row.code,
          category: template.category,
          sourceType: template.sourceType,
          calculationType: template.calculationType,
          value: template.value ? Number(template.value) : null,
          percentageOf: template.percentageOf || null,
          formulaExpression: template.formulaExpression || null,
          amount: row.amount,
          includeInGross: template.includeInGross,
          taxable: template.taxable,
          includeInPfWage: template.includeInPfWage,
          includeInEsiWage: template.includeInEsiWage,
          affectsNetPay: template.affectsNetPay,
          editableForEmployee: template.editableForEmployee,
          isOverride: row.isOverride,
          displayOrder: template.displayOrder,
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  private calculateStatutoryBreakdowns(params: {
    config: OrganizationSalaryConfig;
    context: Record<string, number>;
    earnings: CalculatedComponent[];
    overrides: SalaryPreviewInput['statutoryOverrides'];
    roundRule: RoundingRule;
  }): StatutoryBreakdownLine[] {
    const { config, context, earnings, overrides, roundRule } = params;
    const statutory: StatutoryBreakdownLine[] = [];

    const pfEnabled =
      overrides?.pfApplicable ?? (config.pfConfig?.pfApplicable && config.pfConfig?.defaultEnabled);
    if (pfEnabled) {
      const pfWage = this.computePfWageBase(config.pfConfig, context, earnings);
      const limitedWage =
        config.pfConfig.pfWageLimitEnabled && !config.pfConfig.allowHigherPf
          ? Math.min(pfWage, config.pfConfig.pfWageLimitAmount || pfWage)
          : pfWage;

      const employeeRate =
        overrides?.employeePfRate != null
          ? overrides.employeePfRate
          : Number(config.pfConfig.employeePfRate || 0);
      const employerRate =
        overrides?.employerPfRate != null
          ? overrides.employerPfRate
          : Number(config.pfConfig.employerPfRate || 0);
      const pensionRate = Number(config.pfConfig.pensionRate || 0);
      const employerPfBasisMode = String(config.metadata?.employerPfBasis || '');
      const employerPfWage =
        employerPfBasisMode === 'HALF_MONTHLY_CTC'
          ? Number(context.MONTHLY_CTC || 0) / 2
          : limitedWage;

      const employeePf =
        config.pfConfig.pfCalculationMode === StatutoryCalculationMode.FIXED
          ? Number(config.pfConfig.employeePfFixedAmount || 0)
          : (limitedWage * employeeRate) / 100;
      const employerPf =
        config.pfConfig.pfCalculationMode === StatutoryCalculationMode.FIXED
          ? Number(config.pfConfig.employerPfFixedAmount || 0)
          : (employerPfWage * employerRate) / 100;
      const pension =
        config.pfConfig.pfCalculationMode === StatutoryCalculationMode.FIXED
          ? Number(config.pfConfig.pensionFixedAmount || 0)
          : (limitedWage * pensionRate) / 100;

      statutory.push({
        statutoryType: StatutoryType.PF,
        componentSide: StatutoryComponentSide.EMPLOYEE,
        componentName: 'PF Employee',
        amount: round2(toPositive(applyRounding(employeePf, roundRule))),
        calculationMode: config.pfConfig.pfCalculationMode,
        rate:
          config.pfConfig.pfCalculationMode === StatutoryCalculationMode.PERCENTAGE
            ? employeeRate
            : null,
        basisAmount: round2(limitedWage),
        wageBasis: config.pfConfig.pfWageBasis,
        metadata: {
          wageLimitApplied: config.pfConfig.pfWageLimitEnabled,
        },
      });
      statutory.push({
        statutoryType: StatutoryType.PF,
        componentSide: StatutoryComponentSide.EMPLOYER,
        componentName: 'PF Employer',
        amount: round2(toPositive(applyRounding(employerPf, roundRule))),
        calculationMode: config.pfConfig.pfCalculationMode,
        rate:
          config.pfConfig.pfCalculationMode === StatutoryCalculationMode.PERCENTAGE
            ? employerRate
            : null,
        basisAmount: round2(employerPfWage),
        wageBasis: employerPfBasisMode || config.pfConfig.pfWageBasis,
        metadata: {
          excludedFromGross: Boolean(config.metadata?.grossExcludesEmployerPf),
        },
      });
      statutory.push({
        statutoryType: StatutoryType.PF,
        componentSide: StatutoryComponentSide.EMPLOYER,
        componentName: 'Pension',
        amount: round2(toPositive(applyRounding(pension, roundRule))),
        calculationMode: config.pfConfig.pfCalculationMode,
        rate:
          config.pfConfig.pfCalculationMode === StatutoryCalculationMode.PERCENTAGE
            ? pensionRate
            : null,
        basisAmount: round2(limitedWage),
        wageBasis: config.pfConfig.pfWageBasis,
        metadata: {},
      });
    }

    const esiEnabled =
      overrides?.esiApplicable ?? (config.esiConfig?.esiApplicable && config.esiConfig?.defaultEnabled);
    if (esiEnabled) {
      const esiWage = this.computeEsiWageBase(config.esiConfig, context, earnings);
      const eligible = !config.esiConfig.esiEligibilityThresholdEnabled
        ? true
        : esiWage <= Number(config.esiConfig.esiEligibilityThresholdAmount || 0);

      const employeeRate =
        overrides?.employeeEsiRate != null
          ? overrides.employeeEsiRate
          : Number(config.esiConfig.employeeEsiRate || 0);
      const employerRate =
        overrides?.employerEsiRate != null
          ? overrides.employerEsiRate
          : Number(config.esiConfig.employerEsiRate || 0);

      const employeeEsi = eligible
        ? config.esiConfig.esiCalculationMode === StatutoryCalculationMode.FIXED
          ? Number(config.esiConfig.employeeEsiFixedAmount || 0)
          : (esiWage * employeeRate) / 100
        : 0;
      const employerEsi = eligible
        ? config.esiConfig.esiCalculationMode === StatutoryCalculationMode.FIXED
          ? Number(config.esiConfig.employerEsiFixedAmount || 0)
          : (esiWage * employerRate) / 100
        : 0;

      statutory.push({
        statutoryType: StatutoryType.ESI,
        componentSide: StatutoryComponentSide.EMPLOYEE,
        componentName: 'ESI Employee',
        amount: round2(toPositive(applyRounding(employeeEsi, roundRule))),
        calculationMode: config.esiConfig.esiCalculationMode,
        rate:
          config.esiConfig.esiCalculationMode === StatutoryCalculationMode.PERCENTAGE
            ? employeeRate
            : null,
        basisAmount: round2(esiWage),
        wageBasis: config.esiConfig.esiWageBasis,
        metadata: { eligible },
      });
      statutory.push({
        statutoryType: StatutoryType.ESI,
        componentSide: StatutoryComponentSide.EMPLOYER,
        componentName: 'ESI Employer',
        amount: round2(toPositive(applyRounding(employerEsi, roundRule))),
        calculationMode: config.esiConfig.esiCalculationMode,
        rate:
          config.esiConfig.esiCalculationMode === StatutoryCalculationMode.PERCENTAGE
            ? employerRate
            : null,
        basisAmount: round2(esiWage),
        wageBasis: config.esiConfig.esiWageBasis,
        metadata: { eligible },
      });
    }

    const ptEnabled =
      overrides?.ptApplicable ?? (config.ptConfig?.ptApplicable && config.ptConfig?.defaultEnabled);
    if (ptEnabled) {
      const gross = Number(context.GROSS || 0);
      const ptAmount =
        config.ptConfig.ptCalculationMode === PtCalculationMode.FIXED
          ? Number(overrides?.ptFixedAmount ?? config.ptConfig.fixedAmount ?? 0)
          : this.computePtFromSlabs(gross, config.ptConfig.slabs || []);

      statutory.push({
        statutoryType: StatutoryType.PT,
        componentSide: StatutoryComponentSide.EMPLOYEE,
        componentName: 'Professional Tax',
        amount: round2(toPositive(applyRounding(ptAmount, roundRule))),
        calculationMode:
          config.ptConfig.ptCalculationMode === PtCalculationMode.SLAB
            ? StatutoryCalculationMode.SLAB
            : StatutoryCalculationMode.FIXED,
        rate: null,
        basisAmount: round2(gross),
        wageBasis: 'GROSS',
        metadata: {},
      });
    }

    return statutory;
  }

  private computePfWageBase(
    config: OrganizationSalaryConfig['pfConfig'],
    context: Record<string, number>,
    earnings: CalculatedComponent[],
  ): number {
    switch (config.pfWageBasis) {
      case PfWageBasis.BASIC:
        return Number(context.BASIC || 0);
      case PfWageBasis.BASIC_DA:
        return Number(context.BASIC || 0) + Number(context.DA || 0);
      case PfWageBasis.PF_ELIGIBLE_EARNINGS:
        return earnings
          .filter((e) => e.includeInPfWage)
          .reduce((sum, e) => sum + e.amount, 0);
      case PfWageBasis.CUSTOM:
        return (config.pfCustomComponentCodes || []).reduce(
          (sum, code) => sum + Number(context[code.toUpperCase()] || 0),
          0,
        );
      default:
        return Number(context.BASIC || 0);
    }
  }

  private computeEsiWageBase(
    config: OrganizationSalaryConfig['esiConfig'],
    context: Record<string, number>,
    earnings: CalculatedComponent[],
  ): number {
    switch (config.esiWageBasis) {
      case EsiWageBasis.GROSS:
        return Number(context.GROSS || 0);
      case EsiWageBasis.ESI_ELIGIBLE_EARNINGS:
        return earnings
          .filter((e) => e.includeInEsiWage)
          .reduce((sum, e) => sum + e.amount, 0);
      case EsiWageBasis.CUSTOM:
        return (config.esiCustomComponentCodes || []).reduce(
          (sum, code) => sum + Number(context[code.toUpperCase()] || 0),
          0,
        );
      default:
        return Number(context.GROSS || 0);
    }
  }

  private computePtFromSlabs(
    basisAmount: number,
    slabs: Array<{ minAmount: number; maxAmount: number | null; amount: number }>,
  ): number {
    for (const slab of slabs) {
      const minOk = basisAmount >= Number(slab.minAmount || 0);
      const max = slab.maxAmount == null ? Number.POSITIVE_INFINITY : Number(slab.maxAmount);
      const maxOk = basisAmount <= max;
      if (minOk && maxOk) {
        return Number(slab.amount || 0);
      }
    }
    return 0;
  }

  private getBasisAmount(
    basis: string,
    context: Record<string, number>,
  ): number | null {
    if (basis in context) return Number(context[basis]);
    if (basis === PercentageBasis.BASIC_PLUS_HRA) {
      return Number(context.BASIC || 0) + Number(context.HRA || 0);
    }
    return null;
  }

  private normalizeOverrides(
    raw?: Record<string, number>,
  ): Record<string, number> {
    const result: Record<string, number> = {};
    if (!raw) return result;
    for (const [key, value] of Object.entries(raw)) {
      result[key.toUpperCase()] = Number(value || 0);
    }
    return result;
  }

  private normalizeStates(
    raw?: Record<string, boolean>,
  ): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    if (!raw) return result;
    for (const [key, value] of Object.entries(raw)) {
      result[key.toUpperCase()] = Boolean(value);
    }
    return result;
  }

  private isComponentEnabled(
    component: SalaryTemplateComponent,
    componentStates: Record<string, boolean>,
  ): boolean {
    const code = component.componentCode.toUpperCase();
    if (code in componentStates) return componentStates[code] as boolean;
    return component.defaultEnabled;
  }

  private toCode(label: string): string {
    return label
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
