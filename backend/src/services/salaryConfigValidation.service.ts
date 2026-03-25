import { ApiError } from '../utils/apiError';
import { extractFormulaIdentifiers } from '../salary/formulaEvaluator';
import {
  EsiWageBasis,
  PercentageBasis,
  PfWageBasis,
  PtCalculationMode,
  SalaryCalculationType,
  SalaryComponentCategory,
  SalaryComponentSourceType,
  SalaryComponentStatus,
} from '../salary/salary.enums';
import {
  OrganizationSalaryConfigInput,
  SalaryTemplateComponentInput,
} from '../salary/salary.types';

const BUILTIN_TOKENS = new Set<string>([
  'CTC',
  'MONTHLY_CTC',
  'GROSS',
  'BASIC_PLUS_HRA',
  'DA',
]);

export class SalaryConfigValidationService {
  validate(input: OrganizationSalaryConfigInput): void {
    this.validateStatutory(input);
    this.validateComponents(input.components);
  }

  private validateStatutory(input: OrganizationSalaryConfigInput): void {
    if (input.pfConfig.employeePfRate < 0 || input.pfConfig.employerPfRate < 0) {
      throw ApiError.badRequest('PF rates cannot be negative.', 'INVALID_PF_RATE');
    }
    if (input.esiConfig.employeeEsiRate < 0 || input.esiConfig.employerEsiRate < 0) {
      throw ApiError.badRequest('ESI rates cannot be negative.', 'INVALID_ESI_RATE');
    }
    if (input.ptConfig.fixedAmount < 0) {
      throw ApiError.badRequest('PT fixed amount cannot be negative.', 'INVALID_PT_AMOUNT');
    }
    if (
      input.ptConfig.ptCalculationMode === PtCalculationMode.SLAB &&
      (!Array.isArray(input.ptConfig.slabs) || input.ptConfig.slabs.length === 0)
    ) {
      throw ApiError.badRequest(
        'PT slab mode requires at least one slab definition.',
        'INVALID_PT_SLAB',
      );
    }

    for (const slab of input.ptConfig.slabs || []) {
      if (slab.minAmount < 0 || (slab.maxAmount != null && slab.maxAmount < slab.minAmount)) {
        throw ApiError.badRequest('Invalid PT slab range.', 'INVALID_PT_SLAB_RANGE');
      }
      if (slab.amount < 0) {
        throw ApiError.badRequest('PT slab amount cannot be negative.', 'INVALID_PT_SLAB');
      }
    }

    if (
      input.pfConfig.pfWageBasis === PfWageBasis.CUSTOM &&
      (!input.pfConfig.pfCustomComponentCodes || input.pfConfig.pfCustomComponentCodes.length === 0)
    ) {
      throw ApiError.badRequest(
        'PF custom wage basis requires component codes.',
        'INVALID_PF_CUSTOM_BASIS',
      );
    }
    if (
      input.esiConfig.esiWageBasis === EsiWageBasis.CUSTOM &&
      (!input.esiConfig.esiCustomComponentCodes ||
        input.esiConfig.esiCustomComponentCodes.length === 0)
    ) {
      throw ApiError.badRequest(
        'ESI custom wage basis requires component codes.',
        'INVALID_ESI_CUSTOM_BASIS',
      );
    }
  }

  private validateComponents(components: SalaryTemplateComponentInput[]): void {
    if (!Array.isArray(components) || components.length === 0) {
      throw ApiError.badRequest(
        'At least one salary template component is required.',
        'MISSING_COMPONENTS',
      );
    }

    const normalized = components.map((component) => ({
      ...component,
      componentCode: component.componentCode.trim().toUpperCase(),
      percentageOf: component.percentageOf
        ? String(component.percentageOf).trim().toUpperCase()
        : null,
      formulaExpression: component.formulaExpression?.trim() || null,
    }));

    const codeSet = new Set<string>();
    for (const component of normalized) {
      if (!component.componentName.trim()) {
        throw ApiError.badRequest('Component name is required.', 'INVALID_COMPONENT_NAME');
      }
      if (!component.componentCode.trim()) {
        throw ApiError.badRequest('Component code is required.', 'INVALID_COMPONENT_CODE');
      }
      if (!/^[A-Z][A-Z0-9_]*$/.test(component.componentCode)) {
        throw ApiError.badRequest(
          `Invalid component code "${component.componentCode}". Use uppercase letters, digits and underscore only.`,
          'INVALID_COMPONENT_CODE',
        );
      }
      if (codeSet.has(component.componentCode)) {
        throw ApiError.badRequest(
          `Duplicate component code "${component.componentCode}".`,
          'DUPLICATE_COMPONENT_CODE',
        );
      }
      codeSet.add(component.componentCode);

      if (!Object.values(SalaryComponentCategory).includes(component.category)) {
        throw ApiError.badRequest('Invalid component category.', 'INVALID_COMPONENT_CATEGORY');
      }
      if (!Object.values(SalaryComponentSourceType).includes(component.sourceType)) {
        throw ApiError.badRequest('Invalid component source type.', 'INVALID_SOURCE_TYPE');
      }
      if (!Object.values(SalaryComponentStatus).includes(component.status)) {
        throw ApiError.badRequest('Invalid component status.', 'INVALID_COMPONENT_STATUS');
      }
      if (component.displayOrder < 0) {
        throw ApiError.badRequest('Display order cannot be negative.', 'INVALID_DISPLAY_ORDER');
      }
      if (component.value != null && Number(component.value) < 0) {
        throw ApiError.badRequest(
          `Component "${component.componentCode}" cannot have negative value.`,
          'INVALID_COMPONENT_VALUE',
        );
      }
      if (
        component.calculationType === SalaryCalculationType.PERCENTAGE &&
        (component.value == null || Number(component.value) < 0 || Number(component.value) > 1000)
      ) {
        throw ApiError.badRequest(
          `Invalid percentage value for component "${component.componentCode}".`,
          'INVALID_COMPONENT_PERCENTAGE',
        );
      }
      if (
        component.calculationType === SalaryCalculationType.FORMULA &&
        !component.formulaExpression
      ) {
        throw ApiError.badRequest(
          `Formula expression required for component "${component.componentCode}".`,
          'MISSING_FORMULA_EXPRESSION',
        );
      }
      if (
        component.calculationType === SalaryCalculationType.PERCENTAGE &&
        !component.percentageOf
      ) {
        throw ApiError.badRequest(
          `Percentage basis required for component "${component.componentCode}".`,
          'MISSING_PERCENTAGE_BASIS',
        );
      }
      if (
        component.calculationType === SalaryCalculationType.RESIDUAL &&
        component.category !== SalaryComponentCategory.EARNING
      ) {
        throw ApiError.badRequest(
          `Residual calculation is supported only for earnings (${component.componentCode}).`,
          'INVALID_RESIDUAL_USAGE',
        );
      }
    }

    this.validateReferences(normalized, codeSet);
    this.detectCircularDependencies(normalized, codeSet);
  }

  private validateReferences(
    components: Array<
      SalaryTemplateComponentInput & {
        componentCode: string;
        percentageOf: string | null;
        formulaExpression: string | null;
      }
    >,
    codeSet: Set<string>,
  ): void {
    const knownTokens = new Set([...codeSet, ...BUILTIN_TOKENS, ...Object.values(PercentageBasis)]);

    for (const component of components) {
      if (component.percentageOf && !knownTokens.has(component.percentageOf)) {
        throw ApiError.badRequest(
          `Component "${component.componentCode}" references unknown percentage basis "${component.percentageOf}".`,
          'INVALID_PERCENTAGE_BASIS_REFERENCE',
        );
      }
      if (component.formulaExpression) {
        const tokens = extractFormulaIdentifiers(component.formulaExpression);
        for (const token of tokens) {
          if (!knownTokens.has(token)) {
            throw ApiError.badRequest(
              `Component "${component.componentCode}" formula references unknown token "${token}".`,
              'INVALID_FORMULA_REFERENCE',
            );
          }
        }
      }
    }
  }

  private detectCircularDependencies(
    components: Array<
      SalaryTemplateComponentInput & {
        componentCode: string;
        percentageOf: string | null;
        formulaExpression: string | null;
      }
    >,
    codeSet: Set<string>,
  ): void {
    const deps = new Map<string, Set<string>>();
    for (const component of components) {
      deps.set(component.componentCode, new Set());
    }

    for (const component of components) {
      const depSet = deps.get(component.componentCode) as Set<string>;
      if (component.percentageOf && codeSet.has(component.percentageOf)) {
        depSet.add(component.percentageOf);
      }
      if (component.formulaExpression) {
        const tokens = extractFormulaIdentifiers(component.formulaExpression);
        for (const token of tokens) {
          if (codeSet.has(token)) depSet.add(token);
        }
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();

    const dfs = (node: string): void => {
      if (visited.has(node)) return;
      if (visiting.has(node)) {
        throw ApiError.badRequest(
          `Circular component dependency detected around "${node}".`,
          'CIRCULAR_COMPONENT_DEPENDENCY',
        );
      }
      visiting.add(node);
      const children = deps.get(node) || new Set<string>();
      for (const child of children) {
        dfs(child);
      }
      visiting.delete(node);
      visited.add(node);
    };

    for (const node of deps.keys()) {
      dfs(node);
    }
  }
}
