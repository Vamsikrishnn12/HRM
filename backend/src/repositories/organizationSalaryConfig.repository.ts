import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OrganizationSalaryConfig } from '../entities/OrganizationSalaryConfig.entity';
import { SalaryTemplateComponent } from '../entities/SalaryTemplateComponent.entity';
import { DEFAULT_ORGANIZATION_ID } from '../salary/salary.enums';
import { OrganizationSalaryConfigInput } from '../salary/salary.types';

export class OrganizationSalaryConfigRepository {
  private configRepo: Repository<OrganizationSalaryConfig>;
  private componentRepo: Repository<SalaryTemplateComponent>;

  constructor() {
    this.configRepo = AppDataSource.getRepository(OrganizationSalaryConfig);
    this.componentRepo = AppDataSource.getRepository(SalaryTemplateComponent);
  }

  async findActiveConfig(
    organizationId = DEFAULT_ORGANIZATION_ID,
  ): Promise<OrganizationSalaryConfig | null> {
    return this.configRepo.findOne({
      where: { organizationId, active: true },
      relations: ['templateComponents'],
      order: { version: 'DESC', templateComponents: { displayOrder: 'ASC' } },
    });
  }

  async findById(id: string): Promise<OrganizationSalaryConfig | null> {
    return this.configRepo.findOne({
      where: { id },
      relations: ['templateComponents'],
      order: { templateComponents: { displayOrder: 'ASC' } },
    });
  }

  async findLatestVersion(organizationId = DEFAULT_ORGANIZATION_ID): Promise<number> {
    const latest = await this.configRepo.findOne({
      where: { organizationId },
      order: { version: 'DESC' },
    });
    return latest?.version ?? 0;
  }

  async createVersionedConfig(
    input: OrganizationSalaryConfigInput,
    organizationId = DEFAULT_ORGANIZATION_ID,
  ): Promise<OrganizationSalaryConfig> {
    return AppDataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(OrganizationSalaryConfig)
        .set({ active: false })
        .where('organizationId = :organizationId', { organizationId })
        .andWhere('active = :active', { active: true })
        .execute();

      const latestVersion = await manager.getRepository(OrganizationSalaryConfig).findOne({
        where: { organizationId },
        order: { version: 'DESC' },
      });
      const nextVersion = (latestVersion?.version ?? 0) + 1;

      const config = manager.getRepository(OrganizationSalaryConfig).create({
        organizationId,
        defaultTemplateName: input.defaultTemplateName,
        effectiveFrom: input.effectiveFrom,
        taxRegimeDefaults: input.taxRegimeDefaults,
        pfConfig: input.pfConfig,
        esiConfig: input.esiConfig,
        ptConfig: input.ptConfig,
        roundingRules: input.roundingRules,
        metadata: input.metadata ?? {},
        version: nextVersion,
        active: true,
      });

      const savedConfig = await manager.getRepository(OrganizationSalaryConfig).save(config);
      const components = input.components.map((component) =>
        manager.getRepository(SalaryTemplateComponent).create({
          ...component,
          componentCode: component.componentCode.toUpperCase(),
          percentageOf: component.percentageOf
            ? String(component.percentageOf).toUpperCase()
            : null,
          formulaExpression: component.formulaExpression?.trim() || null,
          organizationSalaryConfigId: savedConfig.id,
          metadata: component.metadata ?? {},
        }),
      );
      await manager.getRepository(SalaryTemplateComponent).save(components);

      return manager.getRepository(OrganizationSalaryConfig).findOneOrFail({
        where: { id: savedConfig.id },
        relations: ['templateComponents'],
        order: { templateComponents: { displayOrder: 'ASC' } },
      });
    });
  }

  async createInitialConfig(
    input: OrganizationSalaryConfigInput,
    organizationId = DEFAULT_ORGANIZATION_ID,
  ): Promise<OrganizationSalaryConfig> {
    return this.createVersionedConfig(input, organizationId);
  }

  async listVersions(
    organizationId = DEFAULT_ORGANIZATION_ID,
  ): Promise<OrganizationSalaryConfig[]> {
    return this.configRepo.find({
      where: { organizationId },
      order: { version: 'DESC' },
    });
  }

  async removeComponentsByConfigId(configId: string): Promise<void> {
    await this.componentRepo.delete({ organizationSalaryConfigId: configId });
  }
}
