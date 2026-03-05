"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Divider,
  Checkbox,
  useToast,
  IconButton,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { Edit2, Eye, Search, Plus } from "lucide-react";
import { salaryDetailsApi } from "@/api";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput, StyledSelect } from "@/components/ui/FormHelpers";
import EmployeeSelector from "@/components/ui/EmployeeSelector";
import type { SalaryForm, SalaryDetailsRow } from "@/types";

const emptyForm: SalaryForm = {
  ctc: "",
  basic: "",
  hra: "",
  allowances: "",
  pfApplicable: true,
  pfEmployeeContribution: "",
  pfEmployerContribution: "",
  taxRegime: "New",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
  branchName: "",
  panNumber: "",
  uanNumber: "",
};

function formatCurrency(val: number) {
  if (!val) return "—";
  return `₹${val.toLocaleString("en-IN")}`;
}

/* ── View Modal ─────────────────────────────────────────────────── */
function ViewModal({
  isOpen,
  onClose,
  record,
}: {
  isOpen: boolean;
  onClose: () => void;
  record: SalaryDetailsRow | null;
}) {
  if (!record) return null;
  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.50">
      <Text fontSize="sm" color="text.muted" fontWeight="500">{label}</Text>
      <Text fontSize="sm" color="text.body" fontWeight="500">{value || "—"}</Text>
    </Flex>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader borderBottom="1px solid" borderColor="surface.border">
          <Text fontWeight="700">Salary & Banking — {record.employeeName}</Text>
          <Text fontSize="xs" color="text.muted">{record.empId} · {record.email}</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={5}>
          <Text fontWeight="700" mb={2} color="text.heading">Salary Structure</Text>
          <InfoRow label="CTC" value={formatCurrency(record.ctc)} />
          <InfoRow label="Basic" value={formatCurrency(record.basic)} />
          <InfoRow label="HRA" value={formatCurrency(record.hra)} />
          <InfoRow label="Allowances" value={formatCurrency(record.allowances)} />
          <InfoRow label="PF Applicable" value={record.pfApplicable ? "Yes" : "No"} />
          {record.pfApplicable && (
            <>
              <InfoRow label="PF Employee Contribution" value={formatCurrency(record.pfEmployeeContribution)} />
              <InfoRow label="PF Employer Contribution" value={formatCurrency(record.pfEmployerContribution)} />
            </>
          )}
          <InfoRow label="Tax Regime" value={record.taxRegime} />

          <Divider my={4} />
          <Text fontWeight="700" mb={2} color="text.heading">Banking Information</Text>
          <InfoRow label="Account Number" value={record.accountNumber} />
          <InfoRow label="IFSC Code" value={record.ifscCode} />
          <InfoRow label="Bank Name" value={record.bankName} />
          <InfoRow label="Branch Name" value={record.branchName} />
          <InfoRow label="PAN Number" value={record.panNumber} />
          <InfoRow label="UAN Number" value={record.uanNumber} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

/* ── Salary Form ────────────────────────────────────────────────── */
function SalaryForm_({
  mode,
  editRecord,
  onDone,
  onCancel,
}: {
  mode: "add" | "edit";
  editRecord?: SalaryDetailsRow | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState(editRecord?.userId || "");
  const [form, setForm] = useState<SalaryForm>(
    editRecord
      ? {
          ctc: editRecord.ctc?.toString() || "",
          basic: editRecord.basic?.toString() || "",
          hra: editRecord.hra?.toString() || "",
          allowances: editRecord.allowances?.toString() || "",
          pfApplicable: editRecord.pfApplicable ?? true,
          pfEmployeeContribution: editRecord.pfEmployeeContribution?.toString() || "",
          pfEmployerContribution: editRecord.pfEmployerContribution?.toString() || "",
          taxRegime: editRecord.taxRegime || "New",
          accountNumber: editRecord.accountNumber || "",
          ifscCode: editRecord.ifscCode || "",
          bankName: editRecord.bankName || "",
          branchName: editRecord.branchName || "",
          panNumber: editRecord.panNumber || "",
          uanNumber: editRecord.uanNumber || "",
        }
      : { ...emptyForm },
  );
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const buildPayload = () => ({
    ctc: parseFloat(form.ctc) || 0,
    basic: parseFloat(form.basic) || 0,
    hra: parseFloat(form.hra) || 0,
    allowances: parseFloat(form.allowances) || 0,
    pfApplicable: form.pfApplicable,
    pfEmployeeContribution: parseFloat(form.pfEmployeeContribution) || 0,
    pfEmployerContribution: parseFloat(form.pfEmployerContribution) || 0,
    taxRegime: form.taxRegime,
    accountNumber: form.accountNumber,
    ifscCode: form.ifscCode,
    bankName: form.bankName,
    branchName: form.branchName,
    panNumber: form.panNumber,
    uanNumber: form.uanNumber,
  });

  const handleSave = async () => {
    const userId = mode === "edit" ? editRecord!.userId : selectedUserId;
    if (!userId) {
      toast({ title: "Please select an employee", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    try {
      setSaving(true);
      if (mode === "edit" && editRecord) {
        await salaryDetailsApi.update(editRecord.id, buildPayload());
      } else {
        await salaryDetailsApi.save(userId, buildPayload());
      }
      toast({ title: `Salary details ${mode === "edit" ? "updated" : "saved"}`, status: "success", duration: 3000, isClosable: true });
      onDone();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save", status: "error", duration: 4000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="700" color="text.heading">
          {mode === "edit" ? `Edit Salary — ${editRecord?.employeeName}` : "Add Salary & Banking"}
        </Text>
        <SecondaryButton size="sm" onClick={onCancel}>Back to List</SecondaryButton>
      </Flex>

      {mode === "add" && (
        <SectionCard mb={4}>
          <EmployeeSelector value={selectedUserId} onChange={setSelectedUserId} />
        </SectionCard>
      )}

      <SectionCard mb={4}>
        <Text fontWeight="800" color="text.heading" mb={3}>Salary Structure</Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={5}>
          <Field label="CTC">
            <StyledInput placeholder="e.g., 600000" value={form.ctc} onChange={(e) => setForm((p) => ({ ...p, ctc: e.target.value }))} />
          </Field>
          <Field label="Basic">
            <StyledInput placeholder="Basic salary" value={form.basic} onChange={(e) => setForm((p) => ({ ...p, basic: e.target.value }))} />
          </Field>
          <Field label="HRA">
            <StyledInput placeholder="HRA" value={form.hra} onChange={(e) => setForm((p) => ({ ...p, hra: e.target.value }))} />
          </Field>
          <Field label="Allowances">
            <StyledInput placeholder="Allowances" value={form.allowances} onChange={(e) => setForm((p) => ({ ...p, allowances: e.target.value }))} />
          </Field>
        </SimpleGrid>

        <Checkbox
          isChecked={form.pfApplicable}
          onChange={(e) => setForm((p) => ({ ...p, pfApplicable: e.target.checked }))}
          colorScheme="purple"
          mb={4}
        >
          PF Applicable
        </Checkbox>

        {form.pfApplicable && (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
            <Field label="PF Employee Contribution">
              <StyledInput value={form.pfEmployeeContribution} onChange={(e) => setForm((p) => ({ ...p, pfEmployeeContribution: e.target.value }))} />
            </Field>
            <Field label="PF Employer Contribution">
              <StyledInput value={form.pfEmployerContribution} onChange={(e) => setForm((p) => ({ ...p, pfEmployerContribution: e.target.value }))} />
            </Field>
          </SimpleGrid>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Field label="Tax Regime">
            <StyledSelect value={form.taxRegime} onChange={(e) => setForm((p) => ({ ...p, taxRegime: e.target.value }))}>
              <option value="New">New</option>
              <option value="Old">Old</option>
            </StyledSelect>
          </Field>
        </SimpleGrid>
      </SectionCard>

      <SectionCard mb={4}>
        <Text fontWeight="800" color="text.heading" mb={3}>Banking Information</Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          <Field label="Account Number">
            <StyledInput placeholder="Bank account number" value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} />
          </Field>
          <Field label="IFSC Code">
            <StyledInput placeholder="IFSC code" value={form.ifscCode} onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value }))} />
          </Field>
          <Field label="Bank Name">
            <StyledInput placeholder="Bank name" value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} />
          </Field>
          <Field label="Branch Name">
            <StyledInput placeholder="Branch name" value={form.branchName} onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))} />
          </Field>
          <Field label="PAN Number">
            <StyledInput placeholder="PAN number" value={form.panNumber} onChange={(e) => setForm((p) => ({ ...p, panNumber: e.target.value.toUpperCase() }))} />
          </Field>
          <Field label="UAN Number">
            <StyledInput placeholder="UAN number" value={form.uanNumber} onChange={(e) => setForm((p) => ({ ...p, uanNumber: e.target.value.replace(/\D/g, "") }))} />
          </Field>
        </SimpleGrid>
      </SectionCard>

      <SectionCard>
        <Flex justify="flex-end" gap={3}>
          <SecondaryButton size="sm" onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton size="sm" onClick={handleSave} isLoading={saving}>
            {mode === "edit" ? "Update Details" : "Save Details"}
          </PrimaryButton>
        </Flex>
      </SectionCard>
    </Box>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function SalaryBankingPage() {
  const [records, setRecords] = useState<SalaryDetailsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [editRecord, setEditRecord] = useState<SalaryDetailsRow | null>(null);
  const [viewRecord, setViewRecord] = useState<SalaryDetailsRow | null>(null);
  const viewModal = useDisclosure();
  const toast = useToast();

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await salaryDetailsApi.list();
      setRecords(res.data);
    } catch {
      toast({ title: "Failed to load salary details", status: "error", duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.employeeName.toLowerCase().includes(q) ||
      r.empId.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.bankName.toLowerCase().includes(q)
    );
  });

  const handleView = (row: SalaryDetailsRow) => {
    setViewRecord(row);
    viewModal.onOpen();
  };

  const handleEdit = (row: SalaryDetailsRow) => {
    setEditRecord(row);
    setView("edit");
  };

  const handleFormDone = () => {
    setView("list");
    setEditRecord(null);
    fetchRecords();
  };

  const columns: Column<SalaryDetailsRow>[] = [
    {
      key: "empId",
      header: "Emp ID",
      width: "100px",
      render: (row) => (
        <Text fontWeight="600" fontSize="sm" color="brand.500">{row.empId}</Text>
      ),
    },
    {
      key: "employeeName",
      header: "Employee Name",
      render: (row) => (
        <Box>
          <Text fontWeight="600" fontSize="sm">{row.employeeName}</Text>
          <Text fontSize="xs" color="text.muted">{row.email}</Text>
        </Box>
      ),
    },
    {
      key: "ctc",
      header: "CTC",
      render: (row) => <Text fontSize="sm" fontWeight="600">{formatCurrency(row.ctc)}</Text>,
    },
    {
      key: "basic",
      header: "Basic",
      render: (row) => <Text fontSize="sm">{formatCurrency(row.basic)}</Text>,
    },
    {
      key: "bankName",
      header: "Bank",
      render: (row) => <Text fontSize="sm">{row.bankName || "—"}</Text>,
    },
    {
      key: "taxRegime",
      header: "Tax Regime",
      width: "100px",
      render: (row) => (
        <Badge variant="subtle" colorScheme={row.taxRegime === "New" ? "green" : "orange"} fontSize="xs">
          {row.taxRegime}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "100px",
      render: (row) => (
        <HStack spacing={1}>
          <IconButton
            aria-label="View"
            icon={<Eye size={16} />}
            size="sm"
            variant="ghost"
            color="text.muted"
            _hover={{ color: "brand.400", bg: "brand.50" }}
            onClick={() => handleView(row)}
          />
          <IconButton
            aria-label="Edit"
            icon={<Edit2 size={16} />}
            size="sm"
            variant="ghost"
            color="text.muted"
            _hover={{ color: "blue.500", bg: "blue.50" }}
            onClick={() => handleEdit(row)}
          />
        </HStack>
      ),
    },
  ];

  if (view === "add") {
    return (
      <Box>
        <PageHeader title="Salary & Banking" subtitle="Add salary structure and banking details for an employee." />
        <SalaryForm_ mode="add" onDone={handleFormDone} onCancel={() => setView("list")} />
      </Box>
    );
  }

  if (view === "edit" && editRecord) {
    return (
      <Box>
        <PageHeader title="Salary & Banking" subtitle="Update salary structure and banking details." />
        <SalaryForm_ mode="edit" editRecord={editRecord} onDone={handleFormDone} onCancel={() => { setView("list"); setEditRecord(null); }} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Salary & Banking"
        subtitle="Update salary structure and banking details."
        actions={
          <PrimaryButton size="sm" leftIcon={<Plus size={16} />} onClick={() => setView("add")}>
            Add New
          </PrimaryButton>
        }
      />

      <SectionCard>
        <Flex
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={3}
          mb={4}
        >
          <InputGroup maxW={{ base: "100%", md: "320px" }}>
            <InputLeftElement pointerEvents="none">
              <Search size={16} color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Search by name, ID, email, bank..."
              size="md"
              borderRadius="lg"
              fontSize="sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <Text fontSize="sm" color="text.muted">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </Text>
        </Flex>

        <DataTable
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage={loading ? "Loading..." : "No salary details found. Click 'Add New' to add one."}
        />
      </SectionCard>

      <ViewModal isOpen={viewModal.isOpen} onClose={viewModal.onClose} record={viewRecord} />
    </Box>
  );
}
