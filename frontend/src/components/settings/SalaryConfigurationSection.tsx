"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Divider,
  Flex,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Spinner,
  Switch,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Plus, Trash2, WandSparkles } from "lucide-react";
import { settingsApi } from "@/api";
import SectionCard from "@/components/ui/SectionCard";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput, StyledSelect } from "@/components/ui/FormHelpers";
import { formatInrCurrency } from "@/lib/formatters";
import type {
  OrganizationSalaryConfig,
  SalaryComputation,
  SalaryTemplateComponent,
} from "@/types";

type EditableSalaryTemplateComponent = Omit<SalaryTemplateComponent, "value" | "displayOrder"> & {
  value: string;
  displayOrder: string;
};

type EditablePfConfig = Omit<OrganizationSalaryConfig["pfConfig"], "employeePfRate" | "employerPfRate"> & {
  employeePfRate: string;
  employerPfRate: string;
};

type EditableEsiConfig = Omit<OrganizationSalaryConfig["esiConfig"], "employeeEsiRate" | "employerEsiRate"> & {
  employeeEsiRate: string;
  employerEsiRate: string;
};

type EditablePtConfig = Omit<OrganizationSalaryConfig["ptConfig"], "fixedAmount"> & {
  fixedAmount: string;
};

interface EditableSalaryConfig {
  defaultTemplateName: string;
  effectiveFrom: string;
  taxRegimeDefaults: string;
  pfConfig: EditablePfConfig;
  esiConfig: EditableEsiConfig;
  ptConfig: EditablePtConfig;
  roundingRules: OrganizationSalaryConfig["roundingRules"];
  metadata?: Record<string, unknown> | null;
  components: EditableSalaryTemplateComponent[];
}

const roundRules = ["NONE", "ROUND", "FLOOR", "CEIL"] as const;
const calcTypes = ["FIXED", "PERCENTAGE", "FORMULA", "RESIDUAL"] as const;
const categories = ["EARNING", "DEDUCTION"] as const;
const sourceTypes = [
  "TEMPLATE_DEFAULT",
  "MANUAL_DEFAULT",
  "AUTO_STATUTORY",
  "EMPLOYEE_CUSTOM",
] as const;
const basisOptions = [
  "CTC",
  "MONTHLY_CTC",
  "BASIC",
  "BASIC_PLUS_HRA",
  "GROSS",
] as const;

const emptyComponent = (category: "EARNING" | "DEDUCTION", order: number): EditableSalaryTemplateComponent => ({
  componentName: "",
  componentCode: "",
  category,
  sourceType: category === "EARNING" ? "TEMPLATE_DEFAULT" : "MANUAL_DEFAULT",
  status: "ACTIVE",
  defaultEnabled: true,
  calculationType: "FIXED",
  value: "0",
  percentageOf: category === "EARNING" ? "MONTHLY_CTC" : "GROSS",
  formulaExpression: null,
  taxable: category === "EARNING",
  includeInPfWage: false,
  includeInEsiWage: false,
  includeInGross: category === "EARNING",
  affectsNetPay: category === "DEDUCTION",
  editableForEmployee: true,
  displayOrder: String(order),
});

const formatCurrency = formatInrCurrency;

const toEditableNumber = (value: number | null | undefined): string =>
  value == null ? "" : String(value);

const parseEditableNumber = (
  raw: string,
  label: string,
  opts: { integer?: boolean; min?: number; nullable?: boolean } = {},
): number | null => {
  const value = raw.trim();
  if (value === "") {
    if (opts.nullable) return null;
    throw new Error(`${label} is required`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number`);
  }
  if (opts.integer && !Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number`);
  }
  if (opts.min != null && parsed < opts.min) {
    throw new Error(`${label} must be at least ${opts.min}`);
  }
  return parsed;
};

const toEditableConfig = (data: OrganizationSalaryConfig): EditableSalaryConfig => ({
  defaultTemplateName: data.defaultTemplateName,
  effectiveFrom: data.effectiveFrom,
  taxRegimeDefaults: data.taxRegimeDefaults,
  pfConfig: {
    ...data.pfConfig,
    employeePfRate: toEditableNumber(data.pfConfig.employeePfRate),
    employerPfRate: toEditableNumber(data.pfConfig.employerPfRate),
  },
  esiConfig: {
    ...data.esiConfig,
    employeeEsiRate: toEditableNumber(data.esiConfig.employeeEsiRate),
    employerEsiRate: toEditableNumber(data.esiConfig.employerEsiRate),
  },
  ptConfig: {
    ...data.ptConfig,
    fixedAmount: toEditableNumber(data.ptConfig.fixedAmount),
  },
  roundingRules: { ...data.roundingRules },
  metadata: data.metadata || {},
  components: data.components.map((c) => ({
    ...c,
    value: toEditableNumber(c.value),
    displayOrder: toEditableNumber(c.displayOrder),
  })),
});

export default function SalaryConfigurationSection() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [activeVersion, setActiveVersion] = useState<number>(0);
  const [versionsCount, setVersionsCount] = useState(0);
  const [config, setConfig] = useState<EditableSalaryConfig | null>(null);
  const [previewMonthlyCtc, setPreviewMonthlyCtc] = useState("50000");
  const [previewData, setPreviewData] = useState<SalaryComputation | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const [cfg, versions] = await Promise.all([
        settingsApi.getSalaryConfig(),
        settingsApi.listSalaryConfigVersions(),
      ]);
      setConfig(toEditableConfig(cfg));
      setActiveVersion(cfg.version);
      setVersionsCount(versions.length);
    } catch {
      toast({
        title: "Failed to load salary configuration",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const components = config?.components || [];
  const earningRows = useMemo(
    () =>
      components
        .filter((c) => c.category === "EARNING")
        .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)),
    [components],
  );
  const deductionRows = useMemo(
    () =>
      components
        .filter((c) => c.category === "DEDUCTION")
        .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)),
    [components],
  );

  const updateComponent = (idx: number, patch: Partial<EditableSalaryTemplateComponent>) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = [...prev.components];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, components: next };
    });
  };

  const addComponent = (category: "EARNING" | "DEDUCTION") => {
    setConfig((prev) => {
      if (!prev) return prev;
      const nextOrder = prev.components.length + 1;
      return {
        ...prev,
        components: [...prev.components, emptyComponent(category, nextOrder)],
      };
    });
  };

  const removeComponent = (idx: number) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = prev.components.filter((_, i) => i !== idx);
      return {
        ...prev,
        components: next.map((item, i) => ({ ...item, displayOrder: String(i + 1) })),
      };
    });
  };

  type SalaryConfigPayload = Parameters<typeof settingsApi.saveSalaryConfig>[0];

  const buildPayload = useCallback((): SalaryConfigPayload | null => {
    if (!config) return null;
    return {
      defaultTemplateName: config.defaultTemplateName,
      effectiveFrom: config.effectiveFrom,
      taxRegimeDefaults: config.taxRegimeDefaults,
      pfConfig: {
        ...config.pfConfig,
        employeePfRate: parseEditableNumber(config.pfConfig.employeePfRate, "PF employee %", { min: 0 }) as number,
        employerPfRate: parseEditableNumber(config.pfConfig.employerPfRate, "PF employer %", { min: 0 }) as number,
      },
      esiConfig: {
        ...config.esiConfig,
        employeeEsiRate: parseEditableNumber(config.esiConfig.employeeEsiRate, "ESI employee %", { min: 0 }) as number,
        employerEsiRate: parseEditableNumber(config.esiConfig.employerEsiRate, "ESI employer %", { min: 0 }) as number,
      },
      ptConfig: {
        ...config.ptConfig,
        fixedAmount: parseEditableNumber(config.ptConfig.fixedAmount, "Professional Tax fixed amount", { min: 0 }) as number,
      },
      roundingRules: config.roundingRules,
      metadata: config.metadata || {},
      components: config.components.map((c) => {
        const componentLabel = c.componentName.trim() || c.componentCode.trim() || "Component";
        const parsedValue =
          c.calculationType === "FORMULA"
            ? null
            : c.calculationType === "PERCENTAGE"
              ? parseEditableNumber(c.value, `${componentLabel} value`, { min: 0 })
              : parseEditableNumber(c.value, `${componentLabel} value`, { min: 0, nullable: true });

        return {
          ...c,
          componentCode: c.componentCode.trim().toUpperCase(),
          percentageOf: c.percentageOf ? c.percentageOf.toUpperCase() : null,
          formulaExpression: c.formulaExpression || null,
          value: parsedValue,
          displayOrder: parseEditableNumber(c.displayOrder, `${componentLabel} display order`, {
            integer: true,
            min: 0,
          }) as number,
        };
      }),
    };
  }, [config]);

  const runPreview = async () => {
    let payload: SalaryConfigPayload | null = null;
    let monthly = 0;
    try {
      payload = buildPayload();
      if (!payload) return;
      monthly = parseEditableNumber(previewMonthlyCtc, "Preview monthly CTC", { min: 0 }) as number;
      if (monthly <= 0) {
        throw new Error("Enter valid preview monthly CTC");
      }
    } catch (err: any) {
      toast({
        title: err?.message || "Enter valid preview monthly CTC",
        status: "warning",
        duration: 2500,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    try {
      setPreviewing(true);
      const result = await settingsApi.previewSalaryConfig({
        configInput: payload,
        previewInput: { monthlyCtc: monthly },
      });
      setPreviewData(result);
    } catch (err: any) {
      toast({
        title: err?.message || "Failed to run preview",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    let payload: SalaryConfigPayload | null = null;
    try {
      payload = buildPayload();
      if (!payload) return;
    } catch (err: any) {
      toast({
        title: err?.message || "Please fix invalid numeric inputs",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    try {
      setSaving(true);
      await settingsApi.saveSalaryConfig(payload);
      toast({
        title: "Salary configuration saved as new version",
        status: "success",
        duration: 2500,
        isClosable: true,
        position: "top-right",
      });
      await loadConfig();
    } catch (err: any) {
      toast({
        title: err?.message || "Failed to save salary configuration",
        status: "error",
        duration: 3500,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <SectionCard title="Salary Configuration">
        <Flex py={8} justify="center">
          <Spinner color="brand.400" />
        </Flex>
      </SectionCard>
    );
  }

  return (
    <Box mt={4}>
      <SectionCard
        title="Salary Configuration"
        actions={
          <HStack spacing={2}>
            <Badge colorScheme="green" variant="subtle">
              v{activeVersion}
            </Badge>
            <Badge colorScheme="purple" variant="subtle">
              {versionsCount} versions
            </Badge>
          </HStack>
        }
      >
        <Flex direction="column" gap={5}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Field label="Template Name" required>
              <StyledInput
                value={config.defaultTemplateName}
                onChange={(e) => setConfig((prev) => (prev ? { ...prev, defaultTemplateName: e.target.value } : prev))}
              />
            </Field>
            <Field label="Effective From" required>
              <StyledInput
                type="date"
                value={config.effectiveFrom}
                onChange={(e) => setConfig((prev) => (prev ? { ...prev, effectiveFrom: e.target.value } : prev))}
              />
            </Field>
            <Field label="Tax Regime Default">
              <StyledSelect
                value={config.taxRegimeDefaults}
                onChange={(e) => setConfig((prev) => (prev ? { ...prev, taxRegimeDefaults: e.target.value } : prev))}
              >
                <option value="New">New</option>
                <option value="Old">Old</option>
              </StyledSelect>
            </Field>
          </SimpleGrid>

          <Divider />

          <Flex justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="700" color="text.heading">
              Earnings Rules
            </Text>
            <SecondaryButton size="xs" leftIcon={<Plus size={14} />} onClick={() => addComponent("EARNING")}>
              Add Earning Rule
            </SecondaryButton>
          </Flex>
          <Flex direction="column" gap={3}>
            {earningRows.map((row) => {
              const idx = components.indexOf(row);
              return (
                <ComponentRuleRow
                  key={`earning-${idx}`}
                  component={row}
                  componentCodes={components.map((item) => item.componentCode).filter(Boolean)}
                  onChange={(patch) => updateComponent(idx, patch)}
                  onRemove={() => removeComponent(idx)}
                />
              );
            })}
          </Flex>

          <Divider />

          <Flex justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="700" color="text.heading">
              Default Deduction Rules
            </Text>
            <SecondaryButton size="xs" leftIcon={<Plus size={14} />} onClick={() => addComponent("DEDUCTION")}>
              Add Deduction Rule
            </SecondaryButton>
          </Flex>
          <Flex direction="column" gap={3}>
            {deductionRows.map((row) => {
              const idx = components.indexOf(row);
              return (
                <ComponentRuleRow
                  key={`deduction-${idx}`}
                  component={row}
                  componentCodes={components.map((item) => item.componentCode).filter(Boolean)}
                  onChange={(patch) => updateComponent(idx, patch)}
                  onRemove={() => removeComponent(idx)}
                />
              );
            })}
          </Flex>

          <Divider />

          <Text fontSize="sm" fontWeight="700" color="text.heading">
            Statutory Configuration
          </Text>
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
            <Box border="1px solid" borderColor="surface.border" borderRadius="lg" p={3}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="700">PF</Text>
                <Switch
                  isChecked={config.pfConfig.pfApplicable}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev ? { ...prev, pfConfig: { ...prev.pfConfig, pfApplicable: e.target.checked } } : prev,
                    )
                  }
                />
              </Flex>
              <SimpleGrid columns={2} spacing={2}>
                <Field label="Emp %">
                  <StyledInput
                    type="number"
                    value={config.pfConfig.employeePfRate}
                    onChange={(e) =>
                      setConfig((prev) =>
                        prev
                          ? { ...prev, pfConfig: { ...prev.pfConfig, employeePfRate: e.target.value } }
                          : prev,
                      )
                    }
                  />
                </Field>
                <Field label="Employer %">
                  <StyledInput
                    type="number"
                    value={config.pfConfig.employerPfRate}
                    onChange={(e) =>
                      setConfig((prev) =>
                        prev
                          ? { ...prev, pfConfig: { ...prev.pfConfig, employerPfRate: e.target.value } }
                          : prev,
                      )
                    }
                  />
                </Field>
              </SimpleGrid>
            </Box>

            <Box border="1px solid" borderColor="surface.border" borderRadius="lg" p={3}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="700">ESI</Text>
                <Switch
                  isChecked={config.esiConfig.esiApplicable}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev ? { ...prev, esiConfig: { ...prev.esiConfig, esiApplicable: e.target.checked } } : prev,
                    )
                  }
                />
              </Flex>
              <SimpleGrid columns={2} spacing={2}>
                <Field label="Emp %">
                  <StyledInput
                    type="number"
                    value={config.esiConfig.employeeEsiRate}
                    onChange={(e) =>
                      setConfig((prev) =>
                        prev
                          ? { ...prev, esiConfig: { ...prev.esiConfig, employeeEsiRate: e.target.value } }
                          : prev,
                      )
                    }
                  />
                </Field>
                <Field label="Employer %">
                  <StyledInput
                    type="number"
                    value={config.esiConfig.employerEsiRate}
                    onChange={(e) =>
                      setConfig((prev) =>
                        prev
                          ? { ...prev, esiConfig: { ...prev.esiConfig, employerEsiRate: e.target.value } }
                          : prev,
                      )
                    }
                  />
                </Field>
              </SimpleGrid>
            </Box>

            <Box border="1px solid" borderColor="surface.border" borderRadius="lg" p={3}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="700">Professional Tax</Text>
                <Switch
                  isChecked={config.ptConfig.ptApplicable}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev ? { ...prev, ptConfig: { ...prev.ptConfig, ptApplicable: e.target.checked } } : prev,
                    )
                  }
                />
              </Flex>
              <Field label="Fixed Amount">
                <StyledInput
                  type="number"
                  value={config.ptConfig.fixedAmount}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev
                        ? { ...prev, ptConfig: { ...prev.ptConfig, fixedAmount: e.target.value } }
                        : prev,
                    )
                  }
                />
              </Field>
            </Box>
          </SimpleGrid>

          <Divider />

          <Text fontSize="sm" fontWeight="700" color="text.heading">
            Rounding Rules
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Field label="Component Rule">
              <StyledSelect
                value={config.roundingRules.componentRule}
                onChange={(e) =>
                  setConfig((prev) =>
                    prev
                      ? {
                          ...prev,
                          roundingRules: {
                            ...prev.roundingRules,
                            componentRule: e.target.value as OrganizationSalaryConfig["roundingRules"]["componentRule"],
                          },
                        }
                      : prev,
                  )
                }
              >
                {roundRules.map((rule) => (
                  <option key={rule} value={rule}>{rule}</option>
                ))}
              </StyledSelect>
            </Field>
            <Field label="Statutory Rule">
              <StyledSelect
                value={config.roundingRules.statutoryRule}
                onChange={(e) =>
                  setConfig((prev) =>
                    prev
                      ? {
                          ...prev,
                          roundingRules: {
                            ...prev.roundingRules,
                            statutoryRule: e.target.value as OrganizationSalaryConfig["roundingRules"]["statutoryRule"],
                          },
                        }
                      : prev,
                  )
                }
              >
                {roundRules.map((rule) => (
                  <option key={rule} value={rule}>{rule}</option>
                ))}
              </StyledSelect>
            </Field>
            <Field label="Summary Rule">
              <StyledSelect
                value={config.roundingRules.summaryRule}
                onChange={(e) =>
                  setConfig((prev) =>
                    prev
                      ? {
                          ...prev,
                          roundingRules: {
                            ...prev.roundingRules,
                            summaryRule: e.target.value as OrganizationSalaryConfig["roundingRules"]["summaryRule"],
                          },
                        }
                      : prev,
                  )
                }
              >
                {roundRules.map((rule) => (
                  <option key={rule} value={rule}>{rule}</option>
                ))}
              </StyledSelect>
            </Field>
          </SimpleGrid>

          <Divider />

          <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
            <Box>
              <Text fontSize="sm" fontWeight="700" color="text.heading">Live Preview</Text>
              <Text fontSize="xs" color="text.muted">
                Test this configuration before saving.
              </Text>
            </Box>
            <HStack spacing={2}>
              <Input
                type="number"
                size="sm"
                borderRadius="lg"
                maxW="170px"
                value={previewMonthlyCtc}
                onChange={(e) => setPreviewMonthlyCtc(e.target.value)}
                placeholder="Monthly CTC"
              />
              <SecondaryButton size="sm" leftIcon={<WandSparkles size={14} />} isLoading={previewing} onClick={runPreview}>
                Preview
              </SecondaryButton>
            </HStack>
          </Flex>

          {previewData ? (
            <Box border="1px solid" borderColor="surface.border" borderRadius="lg" p={3} bg="surface.bg">
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
                <SummaryStat title="Gross" value={formatCurrency(previewData.summary.grossSalary)} />
                <SummaryStat title="Employee Deductions" value={formatCurrency(previewData.summary.employeeDeductions)} />
                <SummaryStat title="Net Pay" value={formatCurrency(previewData.summary.netPay)} />
                <SummaryStat title="Employer Cost" value={formatCurrency(previewData.summary.employerCostImpact)} />
              </SimpleGrid>
              <Divider my={3} />
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontSize="xs" fontWeight="700" color="text.heading" mb={2}>Earnings</Text>
                  {previewData.earnings.map((item) => (
                    <Flex key={`e-${item.componentCode}`} justify="space-between" py={1}>
                      <Text fontSize="xs">{item.componentName}</Text>
                      <Text fontSize="xs" fontWeight="600">{formatCurrency(item.amount)}</Text>
                    </Flex>
                  ))}
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="700" color="text.heading" mb={2}>Deductions</Text>
                  {previewData.deductions.map((item) => (
                    <Flex key={`d-${item.componentCode}`} justify="space-between" py={1}>
                      <Text fontSize="xs">{item.componentName}</Text>
                      <Text fontSize="xs" fontWeight="600">{formatCurrency(item.amount)}</Text>
                    </Flex>
                  ))}
                </Box>
              </SimpleGrid>
            </Box>
          ) : null}

          <Flex justify="flex-end" gap={2}>
            <SecondaryButton size="sm" onClick={loadConfig}>Reset</SecondaryButton>
            <PrimaryButton size="sm" isLoading={saving} onClick={handleSave}>
              Save New Version
            </PrimaryButton>
          </Flex>
        </Flex>
      </SectionCard>
    </Box>
  );
}

function SummaryStat({ title, value }: { title: string; value: string }) {
  return (
    <Box border="1px solid" borderColor="surface.border" borderRadius="md" p={2.5} bg="white">
      <Text fontSize="xs" color="text.muted">{title}</Text>
      <Text fontSize="sm" fontWeight="700" color="text.heading">{value}</Text>
    </Box>
  );
}

function ComponentRuleRow({
  component,
  componentCodes,
  onChange,
  onRemove,
}: {
  component: EditableSalaryTemplateComponent;
  componentCodes: string[];
  onChange: (patch: Partial<EditableSalaryTemplateComponent>) => void;
  onRemove: () => void;
}) {
  const codes = Array.from(new Set(componentCodes.map((item) => item.toUpperCase())));

  return (
    <Box border="1px solid" borderColor="surface.border" borderRadius="lg" p={3}>
      <SimpleGrid columns={{ base: 1, md: 5 }} spacing={3}>
        <Field label="Name">
          <StyledInput value={component.componentName} onChange={(e) => onChange({ componentName: e.target.value })} />
        </Field>
        <Field label="Code">
          <StyledInput
            value={component.componentCode}
            onChange={(e) => onChange({ componentCode: e.target.value.toUpperCase() })}
          />
        </Field>
        <Field label="Category">
          <StyledSelect
            value={component.category}
            onChange={(e) => onChange({ category: e.target.value as SalaryTemplateComponent["category"] })}
          >
            {categories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </StyledSelect>
        </Field>
        <Field label="Source">
          <StyledSelect
            value={component.sourceType}
            onChange={(e) => onChange({ sourceType: e.target.value as SalaryTemplateComponent["sourceType"] })}
          >
            {sourceTypes.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </StyledSelect>
        </Field>
        <Field label="Calculation">
          <StyledSelect
            value={component.calculationType}
            onChange={(e) => onChange({ calculationType: e.target.value as SalaryTemplateComponent["calculationType"] })}
          >
            {calcTypes.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </StyledSelect>
        </Field>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3} mt={3}>
        <Field label={component.calculationType === "FORMULA" ? "Formula" : "Value"}>
          {component.calculationType === "FORMULA" ? (
            <StyledInput
              value={component.formulaExpression || ""}
              onChange={(e) => onChange({ formulaExpression: e.target.value })}
              placeholder="Example: GROSS - (BASIC + HRA)"
            />
          ) : (
            <StyledInput
              type="number"
              value={component.value}
              onChange={(e) => onChange({ value: e.target.value })}
            />
          )}
        </Field>
        <Field label="Percentage Of / Basis">
          <StyledSelect
            value={component.percentageOf || ""}
            onChange={(e) => onChange({ percentageOf: e.target.value || null })}
          >
            <option value="">Select</option>
            {basisOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
            {codes.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </StyledSelect>
        </Field>
        <Field label="Status">
          <StyledSelect
            value={component.status}
            onChange={(e) => onChange({ status: e.target.value as SalaryTemplateComponent["status"] })}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </StyledSelect>
        </Field>
        <Field label="Display Order">
          <StyledInput
            type="number"
            value={component.displayOrder}
            onChange={(e) => onChange({ displayOrder: e.target.value })}
          />
        </Field>
      </SimpleGrid>

      <HStack spacing={5} mt={3} flexWrap="wrap">
        <ToggleTag label="Enabled By Default" checked={component.defaultEnabled} onChange={(checked) => onChange({ defaultEnabled: checked })} />
        <ToggleTag label="Editable Per Employee" checked={component.editableForEmployee} onChange={(checked) => onChange({ editableForEmployee: checked })} />
        <ToggleTag label="Include In Gross" checked={component.includeInGross} onChange={(checked) => onChange({ includeInGross: checked })} />
        <ToggleTag label="Taxable" checked={component.taxable} onChange={(checked) => onChange({ taxable: checked })} />
        <ToggleTag label="PF Wage" checked={component.includeInPfWage} onChange={(checked) => onChange({ includeInPfWage: checked })} />
        <ToggleTag label="ESI Wage" checked={component.includeInEsiWage} onChange={(checked) => onChange({ includeInEsiWage: checked })} />
        <ToggleTag label="Affects Net Pay" checked={component.affectsNetPay} onChange={(checked) => onChange({ affectsNetPay: checked })} />
        <IconButton
          aria-label="Remove component"
          icon={<Trash2 size={14} />}
          size="sm"
          variant="ghost"
          color="red.500"
          _hover={{ bg: "red.50" }}
          onClick={onRemove}
        />
      </HStack>
    </Box>
  );
}

function ToggleTag({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Flex align="center" gap={2}>
      <Switch isChecked={checked} onChange={(e) => onChange(e.target.checked)} size="sm" />
      <Text fontSize="xs" color="text.muted">{label}</Text>
    </Flex>
  );
}
