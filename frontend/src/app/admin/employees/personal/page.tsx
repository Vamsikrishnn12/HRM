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
import { employeeApi } from "@/api";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { PrimaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput, StyledSelect } from "@/components/ui/FormHelpers";
import EmployeeSelector from "@/components/ui/EmployeeSelector";
import type { PersonalForm } from "@/types";

const emptyForm: PersonalForm = {
  aadhaarNumber: "",
  mobileNumber: "",
  whatsappNumber: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  nationality: "",
  currentAddressLine1: "",
  currentCity: "",
  currentState: "",
  currentPincode: "",
  currentCountry: "",
  permanentSameAsCurrent: true,
  permanentAddressLine1: "",
  permanentCity: "",
  permanentState: "",
  permanentPincode: "",
  permanentCountry: "",
  totalExperienceYears: "",
  lastCompany: "",
  lastDesignation: "",
  reasonForLeaving: "",
  highestQualification: "",
  institutionName: "",
  graduationYear: "",
};

export default function PersonalDetailsPage() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [form, setForm] = useState<PersonalForm>({ ...emptyForm });
  const [employmentType, setEmploymentType] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!selectedUserId) { setForm({ ...emptyForm }); return; }
    employeeApi.getByUserId(selectedUserId).then((data) => {
      setEmploymentType(data.employmentType || "");
      setForm({
        aadhaarNumber: data.aadhaarNumber || "",
        mobileNumber: data.mobileNumber || "",
        whatsappNumber: data.whatsappNumber || "",
        dateOfBirth: data.dateOfBirth || "",
        gender: data.gender || "",
        maritalStatus: data.maritalStatus || "",
        nationality: data.nationality || "",
        currentAddressLine1: data.currentAddressLine1 || "",
        currentCity: data.currentCity || "",
        currentState: data.currentState || "",
        currentPincode: data.currentPincode || "",
        currentCountry: data.currentCountry || "",
        permanentSameAsCurrent: data.permanentSameAsCurrent ?? true,
        permanentAddressLine1: data.permanentAddressLine1 || "",
        permanentCity: data.permanentCity || "",
        permanentState: data.permanentState || "",
        permanentPincode: data.permanentPincode || "",
        permanentCountry: data.permanentCountry || "",
        totalExperienceYears: data.totalExperienceYears || "",
        lastCompany: data.lastCompany || "",
        lastDesignation: data.lastDesignation || "",
        reasonForLeaving: data.reasonForLeaving || "",
        highestQualification: data.education?.highestQualification || "",
        institutionName: data.education?.institutionName || "",
        graduationYear: data.education?.graduationYear || "",
      });
    }).catch(() => toast({ title: "Failed to load employee", status: "error", duration: 3000, isClosable: true }));
  }, [selectedUserId, toast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await employeeApi.savePersonal(selectedUserId, form);
      toast({ title: "Personal details saved", status: "success", duration: 3000, isClosable: true });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save", status: "error", duration: 4000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const experienced = employmentType.toLowerCase() === "experienced";

  return (
    <Box>
      <PageHeader title="Personal Details" subtitle="Update personal, address, education, and experience information." />

      <SectionCard>
        <EmployeeSelector value={selectedUserId} onChange={setSelectedUserId} />
      </SectionCard>

      {selectedUserId && (
        <>
          <SectionCard>
            <Text fontWeight="800" color="text.heading" mb={3}>Identity Information</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
              <Field label="Aadhaar Number"><StyledInput inputMode="numeric" placeholder="12-digit Aadhaar" value={form.aadhaarNumber} onChange={(e) => setForm((p) => ({ ...p, aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12) }))} /></Field>
              <Field label="Mobile Number"><StyledInput inputMode="numeric" placeholder="Mobile number" value={form.mobileNumber} onChange={(e) => setForm((p) => ({ ...p, mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 15) }))} /></Field>
              <Field label="WhatsApp Number"><StyledInput inputMode="numeric" placeholder="WhatsApp number" value={form.whatsappNumber} onChange={(e) => setForm((p) => ({ ...p, whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 15) }))} /></Field>
            </SimpleGrid>

            <Divider my={5} />
            <Text fontWeight="800" color="text.heading" mb={3}>Demographics</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
              <Field label="Date of Birth"><StyledInput type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} /></Field>
              <Field label="Gender"><StyledSelect placeholder="Select gender" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}><option value="Female">Female</option><option value="Male">Male</option><option value="Other">Other</option></StyledSelect></Field>
              <Field label="Marital Status"><StyledSelect placeholder="Select" value={form.maritalStatus} onChange={(e) => setForm((p) => ({ ...p, maritalStatus: e.target.value }))}><option value="Single">Single</option><option value="Married">Married</option></StyledSelect></Field>
              <Field label="Nationality"><StyledInput placeholder="Nationality" value={form.nationality} onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value }))} /></Field>
            </SimpleGrid>

            <Divider my={5} />
            <Text fontWeight="800" color="text.heading" mb={3}>Current Address</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
              <Field label="Address Line 1"><StyledInput placeholder="Address line 1" value={form.currentAddressLine1} onChange={(e) => setForm((p) => ({ ...p, currentAddressLine1: e.target.value }))} /></Field>
              <Field label="City"><StyledInput placeholder="City" value={form.currentCity} onChange={(e) => setForm((p) => ({ ...p, currentCity: e.target.value }))} /></Field>
              <Field label="State"><StyledInput placeholder="State" value={form.currentState} onChange={(e) => setForm((p) => ({ ...p, currentState: e.target.value }))} /></Field>
              <Field label="Pincode"><StyledInput inputMode="numeric" placeholder="Pincode" value={form.currentPincode} onChange={(e) => setForm((p) => ({ ...p, currentPincode: e.target.value.replace(/\D/g, "").slice(0, 10) }))} /></Field>
              <Field label="Country"><StyledInput placeholder="Country" value={form.currentCountry} onChange={(e) => setForm((p) => ({ ...p, currentCountry: e.target.value }))} /></Field>
            </SimpleGrid>

            <Checkbox isChecked={form.permanentSameAsCurrent} onChange={(e) => setForm((p) => ({ ...p, permanentSameAsCurrent: e.target.checked }))} colorScheme="purple" mb={4}>
              Permanent Address same as Current Address
            </Checkbox>

            {!form.permanentSameAsCurrent && (
              <>
                <Text fontSize="sm" color="text.muted" mb={3}>Permanent Address</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
                  <Field label="Address Line 1"><StyledInput value={form.permanentAddressLine1} onChange={(e) => setForm((p) => ({ ...p, permanentAddressLine1: e.target.value }))} /></Field>
                  <Field label="City"><StyledInput value={form.permanentCity} onChange={(e) => setForm((p) => ({ ...p, permanentCity: e.target.value }))} /></Field>
                  <Field label="State"><StyledInput value={form.permanentState} onChange={(e) => setForm((p) => ({ ...p, permanentState: e.target.value }))} /></Field>
                  <Field label="Pincode"><StyledInput value={form.permanentPincode} onChange={(e) => setForm((p) => ({ ...p, permanentPincode: e.target.value }))} /></Field>
                  <Field label="Country"><StyledInput value={form.permanentCountry} onChange={(e) => setForm((p) => ({ ...p, permanentCountry: e.target.value }))} /></Field>
                </SimpleGrid>
              </>
            )}
          </SectionCard>

          <SectionCard>
            <Text fontWeight="800" color="text.heading" mb={3}>Education</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
              <Field label="Highest Qualification"><StyledSelect placeholder="Select" value={form.highestQualification} onChange={(e) => setForm((p) => ({ ...p, highestQualification: e.target.value }))}><option value="Diploma">Diploma</option><option value="UG">UG</option><option value="PG">PG</option></StyledSelect></Field>
              <Field label="Institution Name"><StyledInput placeholder="Institution" value={form.institutionName} onChange={(e) => setForm((p) => ({ ...p, institutionName: e.target.value }))} /></Field>
              <Field label="Graduation Year"><StyledInput placeholder="e.g., 2024" value={form.graduationYear} onChange={(e) => setForm((p) => ({ ...p, graduationYear: e.target.value }))} /></Field>
            </SimpleGrid>

            {experienced && (
              <>
                <Divider my={5} />
                <Text fontWeight="800" color="text.heading" mb={3}>Previous Employment</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Field label="Total Experience (Years)"><StyledInput value={form.totalExperienceYears} onChange={(e) => setForm((p) => ({ ...p, totalExperienceYears: e.target.value }))} /></Field>
                  <Field label="Last Company"><StyledInput value={form.lastCompany} onChange={(e) => setForm((p) => ({ ...p, lastCompany: e.target.value }))} /></Field>
                  <Field label="Last Designation"><StyledInput value={form.lastDesignation} onChange={(e) => setForm((p) => ({ ...p, lastDesignation: e.target.value }))} /></Field>
                  <Field label="Reason for Leaving"><StyledInput value={form.reasonForLeaving} onChange={(e) => setForm((p) => ({ ...p, reasonForLeaving: e.target.value }))} /></Field>
                </SimpleGrid>
              </>
            )}
          </SectionCard>

          <SectionCard>
            <Flex justify="flex-end">
              <PrimaryButton size="sm" onClick={handleSave} isLoading={saving}>Save Personal Details</PrimaryButton>
            </Flex>
          </SectionCard>
        </>
      )}
    </Box>
  );
}
