"use client";

import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Divider,
  Checkbox,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput, StyledSelect } from "@/components/ui/FormHelpers";
import { employeeApi } from "@/api";
import type { AddEmployeeFormState } from "@/types";

const initialState: AddEmployeeFormState = {
  firstName: "",
  lastName: "",
  email: "",
  department: "",
  designation: "",
  employmentType: "Fresher",
  dateOfJoining: "",
  reportingManager: "",
  shiftSchedule: "",
  allowLoginOnlyInsideOffice: false,
  officeLatitude: "",
  officeLongitude: "",
  officeRadiusMeters: "",
};

interface CreatedResult {
  empId: string;
  generatedPassword: string;
}

export default function AddEmployeePage() {
  const [form, setForm] = useState<AddEmployeeFormState>({ ...initialState });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedResult | null>(null);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.department || !form.designation || !form.dateOfJoining || !form.reportingManager || !form.shiftSchedule) {
      toast({ title: "Please fill all required fields", status: "warning", duration: 3000, isClosable: true });
      return;
    }

    if (form.allowLoginOnlyInsideOffice && (!form.officeLatitude || !form.officeLongitude || !form.officeRadiusMeters)) {
      toast({ title: "Please fill latitude, longitude, and radius for location-based login", status: "warning", duration: 3000, isClosable: true });
      return;
    }

    try {
      setSubmitting(true);

      const payload: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        department: form.department,
        designation: form.designation,
        employmentType: form.employmentType,
        dateOfJoining: form.dateOfJoining,
        reportingManager: form.reportingManager,
        shiftSchedule: form.shiftSchedule,
        allowLoginOnlyInsideOffice: form.allowLoginOnlyInsideOffice,
      };

      if (form.allowLoginOnlyInsideOffice) {
        payload.officeLatitude = parseFloat(form.officeLatitude);
        payload.officeLongitude = parseFloat(form.officeLongitude);
        payload.officeRadiusMeters = parseInt(form.officeRadiusMeters, 10);
      }

      const result = await employeeApi.create(payload as any);
      setCreated({ empId: result.empId, generatedPassword: result.generatedPassword });
      toast({ title: "Employee created!", description: `Employee ID: ${result.empId}`, status: "success", duration: 5000, isClosable: true });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create employee", status: "error", duration: 4000, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setForm({ ...initialState });
    setCreated(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (created) {
    return (
      <Box>
        <PageHeader title="Employee Created" subtitle="The new employee has been registered successfully." />
        <SectionCard>
          <Alert status="success" borderRadius="xl" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={8}>
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">Employee Account Created!</AlertTitle>
            <AlertDescription maxWidth="sm">
              <Text mb={3}>Credentials have been sent to the employee&apos;s email. You can also share them manually:</Text>
              <Box bg="gray.50" borderRadius="lg" p={4} textAlign="left">
                <Text fontSize="sm" mb={1}><strong>Employee ID:</strong> <Code>{created.empId}</Code></Text>
                <Text fontSize="sm"><strong>Password:</strong> <Code>{created.generatedPassword}</Code></Text>
              </Box>
            </AlertDescription>
          </Alert>
          <Flex mt={6} gap={3} justify="center">
            <PrimaryButton size="sm" onClick={handleAddAnother}>Add Another Employee</PrimaryButton>
            <SecondaryButton size="sm" onClick={() => router.push("/admin/employees")}>Go to Employee List</SecondaryButton>
          </Flex>
        </SectionCard>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Employee Details" subtitle="Create a new employee account. Credentials will be auto-generated and emailed." />

      <SectionCard>
        <Text fontSize="lg" fontWeight="800" color="text.heading" mb={1}>Basic Information</Text>
        <Text fontSize="sm" color="text.muted" mb={4}>Enter the employee&apos;s basic employment details to create their account.</Text>
        <Divider mb={5} />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
          <Field label="First Name" required>
            <StyledInput placeholder="Enter first name" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
          </Field>
          <Field label="Last Name" required>
            <StyledInput placeholder="Enter last name" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
          </Field>
          <Field label="Email" required>
            <StyledInput type="email" placeholder="Enter work email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </Field>
          <Field label="Department" required>
            <StyledSelect placeholder="Select department" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
            </StyledSelect>
          </Field>
          <Field label="Designation" required>
            <StyledInput placeholder="e.g., Sr. Developer" value={form.designation} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} />
          </Field>
          <Field label="Employment Type" required>
            <StyledSelect placeholder="Select type" value={form.employmentType} onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}>
              <option value="Fresher">Fresher</option>
              <option value="Experienced">Experienced</option>
            </StyledSelect>
          </Field>
          <Field label="Date of Joining" required>
            <StyledInput type="date" value={form.dateOfJoining} onChange={(e) => setForm((p) => ({ ...p, dateOfJoining: e.target.value }))} />
          </Field>
          <Field label="Reporting Manager" required>
            <StyledInput placeholder="Enter manager name" value={form.reportingManager} onChange={(e) => setForm((p) => ({ ...p, reportingManager: e.target.value }))} />
          </Field>
          <Field label="Shift / Work Schedule" required>
            <StyledSelect placeholder="Select shift" value={form.shiftSchedule} onChange={(e) => setForm((p) => ({ ...p, shiftSchedule: e.target.value }))}>
              <option value="General">General</option>
              <option value="Night Shift">Night Shift</option>
              <option value="Rotational">Rotational</option>
            </StyledSelect>
          </Field>
        </SimpleGrid>

        <Divider mb={5} />

        <Text fontSize="lg" fontWeight="800" color="text.heading" mb={1}>Login Access</Text>
        <Text fontSize="sm" color="text.muted" mb={4}>Configure how the employee can access the system.</Text>

        <Box mb={4}>
          <Checkbox
            isChecked={form.allowLoginOnlyInsideOffice}
            onChange={(e) => setForm((p) => ({ ...p, allowLoginOnlyInsideOffice: e.target.checked }))}
            colorScheme="purple"
          >
            <Text fontSize="sm" fontWeight="600" color="text.heading">Allow login only inside office</Text>
          </Checkbox>
          <Text mt={1} fontSize="xs" color="text.muted" ml={6}>
            When enabled, employee login is restricted to the specified office coordinates and radius.
          </Text>
        </Box>

        {form.allowLoginOnlyInsideOffice && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            <Field label="Office Latitude" required>
              <StyledInput
                type="number"
                step="any"
                placeholder="e.g., 28.6139"
                value={form.officeLatitude}
                onChange={(e) => setForm((p) => ({ ...p, officeLatitude: e.target.value }))}
              />
            </Field>
            <Field label="Office Longitude" required>
              <StyledInput
                type="number"
                step="any"
                placeholder="e.g., 77.2090"
                value={form.officeLongitude}
                onChange={(e) => setForm((p) => ({ ...p, officeLongitude: e.target.value }))}
              />
            </Field>
            <Field label="Allowed Radius (meters)" required>
              <StyledInput
                type="number"
                placeholder="e.g., 200"
                value={form.officeRadiusMeters}
                onChange={(e) => setForm((p) => ({ ...p, officeRadiusMeters: e.target.value }))}
              />
            </Field>
          </SimpleGrid>
        )}

        <Divider my={4} />

        <Flex justify="flex-end" gap={3}>
          <SecondaryButton size="sm" onClick={() => router.push("/admin/employees")}>Cancel</SecondaryButton>
          <PrimaryButton size="sm" onClick={handleSubmit} isLoading={submitting}>Create Employee</PrimaryButton>
        </Flex>
      </SectionCard>
    </Box>
  );
}
