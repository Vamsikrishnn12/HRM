import { OrganizationSalaryConfigRepository } from '../repositories/organizationSalaryConfig.repository';
import { buildDefaultSalaryConfig } from '../salary/defaultSalaryConfig';
import { OrganizationSalaryConfig } from '../entities/OrganizationSalaryConfig.entity';
import { SalaryTemplateComponent } from '../entities/SalaryTemplateComponent.entity';
import { SalaryCalculationEngineService } from './salaryCalculationEngine.service';
import {
  OrganizationSalaryConfigInput,
  SalaryPreviewInput,
} from '../salary/salary.types';
import { SalaryConfigValidationService } from './salaryConfigValidation.service';

export class OrganizationSalaryConfigService {
  private repo: OrganizationSalaryConfigRepository;
  private calculator: SalaryCalculationEngineService;
  private validator: SalaryConfigValidationService;

  constructor() {
    this.repo = new OrganizationSalaryConfigRepository();
    this.calculator = new SalaryCalculationEngineService();
    this.validator = new SalaryConfigValidationService();
  }

  async getActiveConfig() {
    let config = await this.repo.findActiveConfig();
    if (!config) {
      config = await this.repo.createInitialConfig(buildDefaultSalaryConfig());
    }
    return this.formatConfig(config);
  }

  async listVersions() {
    const rows = await this.repo.listVersions();
    return rows.map((row) => ({
      id: row.id,
      version: row.version,
      defaultTemplateName: row.defaultTemplateName,
      active: row.active,
      effectiveFrom: row.effectiveFrom,
      createdAt: row.createdAt,
    }));
  }

  async saveNewVersion(input: OrganizationSalaryConfigInput) {
    this.validator.validate(input);
    const saved = await this.repo.createVersionedConfig(input);
    return this.formatConfig(saved);
  }

  async preview(input: {
    configInput?: OrganizationSalaryConfigInput;
    previewInput: SalaryPreviewInput;
  }) {
    if (input.configInput) {
      this.validator.validate(input.configInput);
      const simulated = this.toConfigEntity(input.configInput);
      return this.calculator.calculate(simulated, input.previewInput);
    }

    let activeConfig = await this.repo.findActiveConfig();
    if (!activeConfig) {
      activeConfig = await this.repo.createInitialConfig(buildDefaultSalaryConfig());
    }
    return this.calculator.calculate(activeConfig, input.previewInput);
  }

  async getActiveConfigEntity(): Promise<OrganizationSalaryConfig> {
    let activeConfig = await this.repo.findActiveConfig();
    if (!activeConfig) {
      activeConfig = await this.repo.createInitialConfig(buildDefaultSalaryConfig());
    }
    return activeConfig;
  }

  private formatConfig(config: OrganizationSalaryConfig) {
    return {
      id: config.id,
      organizationId: config.organizationId,
      defaultTemplateName: config.defaultTemplateName,
      version: config.version,
      active: config.active,
      effectiveFrom: config.effectiveFrom,
      taxRegimeDefaults: config.taxRegimeDefaults,
      pfConfig: config.pfConfig,
      esiConfig: config.esiConfig,
      ptConfig: config.ptConfig,
      roundingRules: config.roundingRules,
      metadata: config.metadata || {},
      components: (config.templateComponents || [])
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((c) => this.formatComponent(c)),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  private formatComponent(c: SalaryTemplateComponent) {
    return {
      id: c.id,
      componentName: c.componentName,
      componentCode: c.componentCode,
      category: c.category,
      sourceType: c.sourceType,
      status: c.status,
      defaultEnabled: c.defaultEnabled,
      calculationType: c.calculationType,
      value: c.value != null ? Number(c.value) : null,
      percentageOf: c.percentageOf,
      formulaExpression: c.formulaExpression,
      taxable: c.taxable,
      includeInPfWage: c.includeInPfWage,
      includeInEsiWage: c.includeInEsiWage,
      includeInGross: c.includeInGross,
      affectsNetPay: c.affectsNetPay,
      editableForEmployee: c.editableForEmployee,
      displayOrder: c.displayOrder,
      metadata: c.metadata || {},
    };
  }

  private toConfigEntity(input: OrganizationSalaryConfigInput): OrganizationSalaryConfig {
    const config = new OrganizationSalaryConfig();
    config.id = 'preview';
    config.organizationId = 'ORG_DEFAULT';
    config.defaultTemplateName = input.defaultTemplateName;
    config.version = 0;
    config.active = true;
    config.effectiveFrom = input.effectiveFrom;
    config.taxRegimeDefaults = input.taxRegimeDefaults;
    config.pfConfig = input.pfConfig;
    config.esiConfig = input.esiConfig;
    config.ptConfig = input.ptConfig;
    config.roundingRules = input.roundingRules;
    config.metadata = input.metadata || {};
    config.templateComponents = input.components.map((component, idx) => {
      const item = new SalaryTemplateComponent();
      item.id = `preview-${idx}`;
      item.organizationSalaryConfigId = 'preview';
      item.componentName = component.componentName;
      item.componentCode = component.componentCode.toUpperCase();
      item.category = component.category;
      item.sourceType = component.sourceType;
      item.status = component.status;
      item.defaultEnabled = component.defaultEnabled;
      item.calculationType = component.calculationType;
      item.value = component.value ?? null;
      item.percentageOf = component.percentageOf ? String(component.percentageOf).toUpperCase() : null;
      item.formulaExpression = component.formulaExpression || null;
      item.taxable = component.taxable;
      item.includeInPfWage = component.includeInPfWage;
      item.includeInEsiWage = component.includeInEsiWage;
      item.includeInGross = component.includeInGross;
      item.affectsNetPay = component.affectsNetPay;
      item.editableForEmployee = component.editableForEmployee;
      item.displayOrder = component.displayOrder;
      item.metadata = component.metadata || {};
      return item;
    });
    return config;
  }
}
