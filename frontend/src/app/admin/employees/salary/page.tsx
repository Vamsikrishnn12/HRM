"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Divider,
  Checkbox,
  useToast,
} from "@chakra-ui/react";
import { api } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { PrimaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput, StyledSelect } from "@/components/ui/FormHelpers";
import EmployeeSelector from "@/components/ui/EmployeeSelector";

interface SalaryForm {
  ctc: string;
  basic: string;
  hra: string;
  allowances: string;
  pfApplicable: boolean;
  pfEmployeeContribution: string;
  pfEmployerContribution: string;
  taxRegime: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  panNumber: string;
  uanNumber: string;
}

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

export default function SalaryBankingPage() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [form, setForm] = useState<SalaryForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!selectedUserId) { setForm({ ...emptyForm }); return; }
    api.get<any>(`/employees/user/${selectedUserId}`).then((data) => {
      const sal = data.salaryStructure;
      const bank = data.bankAccount;
      setForm({
        ctc: sal?.ctc?.toString() || "",
        basic: sal?.basic?.toString() || "",
        hra: sal?.hra?.toString() || "",
        allowances: sal?.allowances?.toString() || "",
        pfApplicable: sal?.pfApplicable ?? true,
        pfEmployeeContribution: sal?.pfEmployeeContribution?.toString() || "",
        pfEmployerContribution: sal?.pfEmployerContribution?.toString() || "",
        taxRegime: sal?.taxRegime || "New",
        accountNumber: bank?.accountNumber || "",
        ifscCode: bank?.ifscCode || "",
        bankName: bank?.bankName || "",
        branchName: bank?.branchName || "",
        panNumber: bank?.panNumber || "",
        uanNumber: bank?.uanNumber || "",
      });
    }).catch(() => toast({ title: "Failed to load employee", status: "error", duration: 3000, isClosable: true }));
  }, [selectedUserId, toast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/employees/${selectedUserId}/salary`, {
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
      toast({ title: "Salary & banking saved", status: "success", duration: 3000, isClosable: true });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save", status: "error", duration: 4000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Salary & Banking" subtitle="Update salary structure and banking details." />

      <SectionCard>
        <EmployeeSelector value={selectedUserId} onChange={setSelectedUserId} />
      </SectionCard>

      {selectedUserId && (
        <>
          <SectionCard>
            <Text fontWeight="800" color="text.heading" mb={3}>Salary Structure</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
              <Field label="CTC"><StyledInput placeholder="e.g., 600000" value={form.ctc} onChange={(e) => setForm((p) => ({ ...p, ctc: e.target.value }))} /></Field>
              <Field label="Basic"><StyledInput placeholder="Basic salary" value={form.basic} onChange={(e) => setForm((p) => ({ ...p, basic: e.target.value }))} /></Field>
              <Field label="HRA"><StyledInput placeholder="HRA" value={form.hra} onChange={(e) => setForm((p) => ({ ...p, hra: e.target.value }))} /></Field>
              <Field label="Allowances"><StyledInput placeholder="Allowances" value={form.allowances} onChange={(e) => setForm((p) => ({ ...p, allowances: e.target.value }))} /></Field>
            </SimpleGrid>

            <Checkbox isChecked={form.pfApplicable} onChange={(e) => setForm((p) => ({ ...p, pfApplicable: e.target.checked }))} colorScheme="purple" mb={4}>
              PF Applicable
            </Checkbox>

            {form.pfApplicable && (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
                <Field label="PF Employee Contribution"><StyledInput value={form.pfEmployeeContribution} onChange={(e) => setForm((p) => ({ ...p, pfEmployeeContribution: e.target.value }))} /></Field>
                <Field label="PF Employer Contribution"><StyledInput value={form.pfEmployerContribution} onChange={(e) => setForm((p) => ({ ...p, pfEmployerContribution: e.target.value }))} /></Field>
              </SimpleGrid>
            )}

            <Field label="Tax Regime">
              <StyledSelect value={form.taxRegime} onChange={(e) => setForm((p) => ({ ...p, taxRegime: e.target.value }))} maxW={{ base: "100%", md: "240px" }}>
                <option value="New">New</option>
                <option value="Old">Old</option>
              </StyledSelect>
            </Field>
          </SectionCard>

          <SectionCard>
            <Text fontWeight="800" color="text.heading" mb={3}>Banking Information</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Field label="Account Number"><StyledInput placeholder="Bank account number" value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} /></Field>
              <Field label="IFSC Code"><StyledInput placeholder="IFSC code" value={form.ifscCode} onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value }))} /></Field>
              <Field label="Bank Name"><StyledInput placeholder="Bank name" value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} /></Field>
              <Field label="Branch Name"><StyledInput placeholder="Branch name" value={form.branchName} onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))} /></Field>
              <Field label="PAN Number"><StyledInput placeholder="PAN number" value={form.panNumber} onChange={(e) => setForm((p) => ({ ...p, panNumber: e.target.value.toUpperCase() }))} /></Field>
              <Field label="UAN Number"><StyledInput placeholder="UAN number" value={form.uanNumber} onChange={(e) => setForm((p) => ({ ...p, uanNumber: e.target.value.replace(/\D/g, "") }))} /></Field>
            </SimpleGrid>
          </SectionCard>

          <SectionCard>
            <Flex justify="flex-end">
              <PrimaryButton size="sm" onClick={handleSave} isLoading={saving}>Save Salary & Banking</PrimaryButton>
            </Flex>
          </SectionCard>
        </>
      )}
    </Box>
  );
}
