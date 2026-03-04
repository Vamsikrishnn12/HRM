"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  Divider,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  VStack,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { Check, ChevronLeft, RotateCcw, UploadCloud, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";

/** -------------------------
 * Types
 * ------------------------ */
type StepKey = "personal" | "employment" | "dynamic" | "salary" | "documents";

type FormState = {
  // Personal
  firstName: string;
  lastName: string;
  aadhaarNumber: string;
  workEmail: string;
  mobileNumber: string;
  whatsappNumber: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;

  currentAddressLine1: string;
  currentCity: string;
  currentState: string;
  currentPincode: string;
  currentCountry: string;

  permanentSameAsCurrent: boolean;
  permanentAddressLine1: string;
  permanentCity: string;
  permanentState: string;
  permanentPincode: string;
  permanentCountry: string;

  // Employment
  department: string;
  designation: string;
  employmentType: "Fresher" | "Experienced" | string;
  dateOfJoining: string;
  reportingManager: string;
  shiftSchedule: string;

  // ✅ Login Access (replaces Work Mode radio)
  allowLoginOnlyInsideOffice: boolean;

  // Banking
  bankAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  panNumber: string;
  uanNumber: string;

  // Educational Qualification + Experienced
  highestQualification: string;
  institutionName: string;
  graduationYear: string;

  totalExperienceYears: string;
  lastCompany: string;
  lastDesignation: string;
  reasonForLeaving: string;

  // Salary
  ctc: string;
  basic: string;
  hra: string;
  allowances: string;
  pfApplicable: boolean;
  pfEmployee: string;
  pfEmployer: string;
  taxRegime: "Old" | "New" | string;

  // Documents
  uploadedDocuments: File[];
};

const initialState: FormState = {
  firstName: "",
  lastName: "",
  aadhaarNumber: "",
  workEmail: "",
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

  department: "",
  designation: "",
  employmentType: "Fresher",
  dateOfJoining: "",
  reportingManager: "",
  shiftSchedule: "",

  allowLoginOnlyInsideOffice: false,

  bankAccountNumber: "",
  ifscCode: "",
  bankName: "",
  branchName: "",
  panNumber: "",
  uanNumber: "",

  highestQualification: "",
  institutionName: "",
  graduationYear: "",

  totalExperienceYears: "",
  lastCompany: "",
  lastDesignation: "",
  reasonForLeaving: "",

  ctc: "",
  basic: "",
  hra: "",
  allowances: "",
  pfApplicable: true,
  pfEmployee: "",
  pfEmployer: "",
  taxRegime: "New",

  uploadedDocuments: [],
};

/** -------------------------
 * Helpers
 * ------------------------ */
const steps: { key: StepKey; label: string }[] = [
  { key: "personal", label: "Personal Information" },
  { key: "employment", label: "Employment Details" },
  { key: "dynamic", label: "Educational Qualification" },
  { key: "salary", label: "Salary Structure" },
  { key: "documents", label: "Upload Documents" },
];

function Stepper({
  activeIndex,
  completedUpTo,
}: {
  activeIndex: number;
  completedUpTo: number;
}) {
  return (
    <SectionCard>
      <Flex
        gap={5}
        align="center"
        wrap="nowrap"
        overflowX="auto"
        py={1}
        sx={{
          "&::-webkit-scrollbar": { height: "6px" },
          "&::-webkit-scrollbar-thumb": { background: "#cfcfe6", borderRadius: "999px" },
        }}
      >
        {steps.map((s, idx) => {
          const done = idx < completedUpTo;
          const active = idx === activeIndex;

          return (
            <HStack key={s.key} spacing={3} flex="0 0 auto">
              <Box
                w="28px"
                h="28px"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={done ? "brand.500" : active ? "brand.500" : "surface.bg"}
                color={done || active ? "white" : "text.muted"}
                border="1px solid"
                borderColor={done || active ? "brand.500" : "surface.border"}
                fontSize="sm"
                fontWeight="700"
              >
                {done ? <Check size={16} /> : idx + 1}
              </Box>
              <Text
                fontSize="sm"
                fontWeight={active ? "700" : "600"}
                color={active ? "text.heading" : "text.muted"}
                whiteSpace="nowrap"
              >
                {s.label}
              </Text>
            </HStack>
          );
        })}
      </Flex>
    </SectionCard>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <FormControl>
      <FormLabel fontSize="sm" fontWeight="600" color="text.heading">
        {label} {required ? <Text as="span" color="red.400">*</Text> : null}
      </FormLabel>
      {children}
    </FormControl>
  );
}

function StyledInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      size="sm"
      borderRadius="lg"
      bg="surface.bg"
      border="1px solid"
      borderColor="surface.border"
      _focus={{ borderColor: "brand.400" }}
      fontSize="sm"
      autoComplete="off"
      {...props}
    />
  );
}

function StyledSelect(props: React.ComponentProps<typeof Select>) {
  return (
    <Select
      size="sm"
      borderRadius="lg"
      bg="surface.bg"
      border="1px solid"
      borderColor="surface.border"
      _focus={{ borderColor: "brand.400" }}
      fontSize="sm"
      autoComplete="off"
      {...props}
    />
  );
}

/** -------------------------
 * Upload Dropzone (NEW)
 * ------------------------ */
function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function fileKey(f: File) {
  return `${f.name}-${f.size}-${f.lastModified}`;
}

function UploadDropzone({
  files,
  onChange,
  accept,
  maxFiles = 20,
}: {
  files: File[];
  onChange: (nextFiles: File[]) => void;
  accept?: string;
  maxFiles?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const toast = useToast();

  const addFiles = (incoming: File[]) => {
    if (!incoming.length) return;

    const map = new Map<string, File>();
    for (const f of files) map.set(fileKey(f), f);
    for (const f of incoming) map.set(fileKey(f), f);

    const merged = Array.from(map.values());
    if (merged.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can upload up to ${maxFiles} files.`,
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      onChange(merged.slice(0, maxFiles));
      return;
    }

    onChange(merged);

    // allow selecting same file again later
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    onChange(next);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    addFiles(dropped);
  };

  return (
    <Box>
      {/* Hidden input */}
      <Input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        display="none"
        onChange={(e) => addFiles(Array.from(e.target.files || []))}
      />

      {/* Drop area */}
      <Box
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        borderRadius="xl"
        border="1px solid"
        borderColor={isDragging ? "brand.400" : "surface.border"}
        bg={isDragging ? "purple.50" : "surface.bg"}
        px={{ base: 4, md: 6 }}
        py={{ base: 6, md: 7 }}
        cursor="pointer"
        transition="all 0.15s ease"
        _hover={{ borderColor: "brand.400" }}
      >
        <Flex direction="column" align="center" justify="center" gap={2}>
          <Box
            w="44px"
            h="44px"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg={isDragging ? "brand.500" : "white"}
            border="1px solid"
            borderColor={isDragging ? "brand.500" : "surface.border"}
            color={isDragging ? "white" : "brand.500"}
          >
            <UploadCloud size={20} />
          </Box>

          <Text fontSize="sm" fontWeight="700" color="text.heading" textAlign="center">
            Drag & drop files here <Text as="span" color="brand.500">or click to upload</Text>
          </Text>

          <Text fontSize="xs" color="text.muted" textAlign="center">
            Accepted: PDF, JPG, PNG, DOCX • Multiple files allowed
          </Text>
        </Flex>
      </Box>

      {/* File list */}
      {files.length ? (
        <Box mt={4}>
          <Flex align="center" justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="800" color="text.heading">
              Uploaded Files
            </Text>
            <Text fontSize="xs" color="text.muted">
              {files.length} file{files.length > 1 ? "s" : ""}
            </Text>
          </Flex>

          <Box border="1px solid" borderColor="surface.border" borderRadius="xl" overflow="hidden">
            {files.map((f, idx) => (
              <Flex
                key={fileKey(f)}
                align="center"
                justify="space-between"
                px={3}
                py={2.5}
                borderTop={idx === 0 ? "none" : "1px solid"}
                borderColor="surface.border"
                bg="white"
              >
                <Box minW={0}>
                  <Text fontSize="sm" fontWeight="700" color="text.heading" noOfLines={1}>
                    {f.name}
                  </Text>
                  <Text fontSize="xs" color="text.muted">
                    {formatBytes(f.size)}
                  </Text>
                </Box>

                <IconButton
                  aria-label="Remove file"
                  icon={<X size={16} />}
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAt(idx)}
                />
              </Flex>
            ))}
          </Box>

          <Text mt={2} fontSize="xs" color="text.muted">
            Tip: You can drag more files anytime — they will be appended (not replaced).
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}

/** -------------------------
 * Step UIs
 * ------------------------ */
function PersonalStep({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <SectionCard>
      <Flex align="center" justify="space-between" mb={4}>
        <Box>
          <Text fontSize="xl" fontWeight="800" color="text.heading">
            Personal Information
          </Text>
          <Text fontSize="sm" color="text.muted">
            Create a new employee profile in the system
          </Text>
        </Box>
        <Text fontSize="sm" color="text.muted">
          Step 1 of {steps.length}
        </Text>
      </Flex>

      <Divider mb={5} />

      <Text fontWeight="800" color="text.heading" mb={3}>
        1. Identity Information
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
        <Field label="First Name" required>
          <StyledInput
            placeholder="Enter your first name"
            value={form.firstName}
            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
          />
        </Field>

        <Field label="Last Name" required>
          <StyledInput
            placeholder="Enter your last name"
            value={form.lastName}
            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
          />
        </Field>

        <Field label="Aadhaar Number" required>
          <StyledInput
            inputMode="numeric"
            placeholder="Aadhaar: Enter 12-digit Aadhaar number"
            value={form.aadhaarNumber}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12),
              }))
            }
          />
        </Field>

        <Field label="Email" required>
          <StyledInput
            type="email"
            placeholder="Email: Enter your email"
            value={form.workEmail}
            onChange={(e) => setForm((p) => ({ ...p, workEmail: e.target.value }))}
          />
        </Field>

        <Field label="Mobile Number" required>
          <StyledInput
            inputMode="numeric"
            placeholder="Mobile: Enter your mobile number"
            value={form.mobileNumber}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 15),
              }))
            }
          />
        </Field>

        <Box>
          <Checkbox
            isChecked={form.whatsappNumber === form.mobileNumber && !!form.mobileNumber}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                whatsappNumber: e.target.checked ? p.mobileNumber : p.whatsappNumber,
              }))
            }
            colorScheme="purple"
            mb={2}
          >
            Same as WhatsApp Number
          </Checkbox>

          <Field label="WhatsApp Number" required>
            <StyledInput
              inputMode="numeric"
              placeholder="WhatsApp: Enter your WhatsApp number"
              value={form.whatsappNumber}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 15),
                }))
              }
            />
          </Field>
        </Box>
      </SimpleGrid>

      <Divider my={5} />

      <Text fontWeight="800" color="text.heading" mb={3}>
        2. Demographic Details
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
        <Field label="Date of Birth" required>
          <StyledInput
            type="date"
            placeholder="DOB: Select date of birth"
            value={form.dateOfBirth}
            onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
          />
        </Field>

        <Field label="Gender" required>
          <StyledSelect
            placeholder="Select gender"
            value={form.gender}
            onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </StyledSelect>
        </Field>

        <Field label="Marital Status">
          <StyledSelect
            placeholder="Select marital status"
            value={form.maritalStatus}
            onChange={(e) => setForm((p) => ({ ...p, maritalStatus: e.target.value }))}
          >
            <option value="Single">Single</option>
            <option value="Married">Married</option>
          </StyledSelect>
        </Field>

        <Field label="Nationality" required>
          <StyledInput
            placeholder="Nationality: Enter nationality"
            value={form.nationality}
            onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value }))}
          />
        </Field>
      </SimpleGrid>

      <Divider my={5} />

      <Text fontWeight="800" color="text.heading" mb={3}>
        3. Address Information
      </Text>

      <Text fontSize="sm" color="text.muted" mb={4}>
        Current Address
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
        <Field label="Address Line 1" required>
          <StyledInput
            placeholder="Address: Enter address line 1"
            value={form.currentAddressLine1}
            onChange={(e) => setForm((p) => ({ ...p, currentAddressLine1: e.target.value }))}
          />
        </Field>

        <Field label="City" required>
          <StyledInput
            placeholder="City: Enter your city"
            value={form.currentCity}
            onChange={(e) => setForm((p) => ({ ...p, currentCity: e.target.value }))}
          />
        </Field>

        <Field label="State" required>
          <StyledInput
            placeholder="State: Enter your state"
            value={form.currentState}
            onChange={(e) => setForm((p) => ({ ...p, currentState: e.target.value }))}
          />
        </Field>

        <Field label="Pincode" required>
          <StyledInput
            inputMode="numeric"
            placeholder="Pincode: Enter pincode"
            value={form.currentPincode}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                currentPincode: e.target.value.replace(/\D/g, "").slice(0, 10),
              }))
            }
          />
        </Field>

        <Field label="Country" required>
          <StyledInput
            placeholder="Country: Enter country"
            value={form.currentCountry}
            onChange={(e) => setForm((p) => ({ ...p, currentCountry: e.target.value }))}
          />
        </Field>
      </SimpleGrid>

      <Checkbox
        isChecked={form.permanentSameAsCurrent}
        onChange={(e) => setForm((p) => ({ ...p, permanentSameAsCurrent: e.target.checked }))}
        colorScheme="purple"
        mb={4}
      >
        Permanent Address same as Current Address
      </Checkbox>

      {!form.permanentSameAsCurrent ? (
        <Box mt={3}>
          <Text fontSize="sm" color="text.muted" mb={4}>
            Permanent Address
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Field label="Address Line 1" required>
              <StyledInput
                placeholder="Permanent address line 1"
                value={form.permanentAddressLine1}
                onChange={(e) => setForm((p) => ({ ...p, permanentAddressLine1: e.target.value }))}
              />
            </Field>

            <Field label="City" required>
              <StyledInput
                placeholder="Permanent city"
                value={form.permanentCity}
                onChange={(e) => setForm((p) => ({ ...p, permanentCity: e.target.value }))}
              />
            </Field>

            <Field label="State" required>
              <StyledInput
                placeholder="Permanent state"
                value={form.permanentState}
                onChange={(e) => setForm((p) => ({ ...p, permanentState: e.target.value }))}
              />
            </Field>

            <Field label="Pincode" required>
              <StyledInput
                inputMode="numeric"
                placeholder="Permanent pincode"
                value={form.permanentPincode}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    permanentPincode: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
              />
            </Field>

            <Field label="Country" required>
              <StyledInput
                placeholder="Permanent country"
                value={form.permanentCountry}
                onChange={(e) => setForm((p) => ({ ...p, permanentCountry: e.target.value }))}
              />
            </Field>
          </SimpleGrid>
        </Box>
      ) : null}
    </SectionCard>
  );
}

function EmploymentStep({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <SectionCard>
      <Flex align="center" justify="space-between" mb={4}>
        <Box>
          <Text fontSize="xl" fontWeight="800" color="text.heading">
            Employment Details
          </Text>
          <Text fontSize="sm" color="text.muted">
            Organization and joining information
          </Text>
        </Box>
        <Text fontSize="sm" color="text.muted">
          Step 2 of {steps.length}
        </Text>
      </Flex>

      <Divider mb={5} />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        <Field label="Department" required>
          <StyledSelect
            placeholder="Select department"
            value={form.department}
            onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
          >
            <option value="Engineering">Engineering</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
          </StyledSelect>
        </Field>

        <Field label="Designation" required>
          <StyledInput
            placeholder="Designation: e.g., Sr. Developer"
            value={form.designation}
            onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
          />
        </Field>

        <Field label="Employment Type" required>
          <StyledSelect
            placeholder="Select employment type"
            value={String(form.employmentType || "")}
            onChange={(e) => {
              const clean = e.target.value.trim();
              setForm((p) => {
                if (clean === "Fresher") {
                  return {
                    ...p,
                    employmentType: "Fresher",
                    totalExperienceYears: "",
                    lastCompany: "",
                    lastDesignation: "",
                    reasonForLeaving: "",
                  };
                }
                return { ...p, employmentType: "Experienced" };
              });
            }}
          >
            <option value="Fresher">Fresher</option>
            <option value="Experienced">Experienced</option>
          </StyledSelect>
        </Field>

        <Field label="Date of Joining" required>
          <StyledInput
            type="date"
            placeholder="DOJ: Select joining date"
            value={form.dateOfJoining}
            onChange={(e) => setForm((p) => ({ ...p, dateOfJoining: e.target.value }))}
          />
        </Field>

        <Field label="Reporting Manager" required>
          <StyledInput
            placeholder="Manager: Enter manager name"
            value={form.reportingManager}
            onChange={(e) => setForm((p) => ({ ...p, reportingManager: e.target.value }))}
          />
        </Field>

        <Field label="Shift / Work Schedule" required>
          <StyledSelect
            placeholder="Select shift / schedule"
            value={form.shiftSchedule}
            onChange={(e) => setForm((p) => ({ ...p, shiftSchedule: e.target.value }))}
          >
            <option value="General">General</option>
            <option value="Night Shift">Night Shift</option>
            <option value="Rotational">Rotational</option>
          </StyledSelect>
        </Field>

        <Box>
          <Text fontSize="sm" fontWeight="600" color="text.heading" mb={2}>
            Login Access
          </Text>

          <Checkbox
            isChecked={form.allowLoginOnlyInsideOffice}
            onChange={(e) => setForm((p) => ({ ...p, allowLoginOnlyInsideOffice: e.target.checked }))}
            colorScheme="purple"
          >
            Allow login only inside office
          </Checkbox>

          <Text mt={2} fontSize="xs" color="text.muted">
            When enabled, employee login is restricted to the organization’s approved office network
            or geofenced location (enforced by backend security policies).
          </Text>
        </Box>
      </SimpleGrid>

      <Divider my={5} />

      <Text fontWeight="800" color="text.heading" mb={3}>
        Banking Information
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Field label="Account Number" required>
          <StyledInput
            placeholder="Account: Enter bank account number"
            value={form.bankAccountNumber}
            onChange={(e) => setForm((p) => ({ ...p, bankAccountNumber: e.target.value }))}
          />
        </Field>

        <Field label="IFSC Code" required>
          <StyledInput
            placeholder="IFSC: Enter IFSC code"
            value={form.ifscCode}
            onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value }))}
          />
        </Field>

        <Field label="Bank Name" required>
          <StyledInput
            placeholder="Bank: Enter bank name"
            value={form.bankName}
            onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
          />
        </Field>

        <Field label="Branch Name" required>
          <StyledInput
            placeholder="Branch: Enter branch name"
            value={form.branchName}
            onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))}
          />
        </Field>

        <Field label="PAN Number" required>
          <StyledInput
            placeholder="PAN: Enter PAN number"
            value={form.panNumber}
            onChange={(e) => setForm((p) => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
          />
        </Field>

        <Field label="UAN Number" required>
          <StyledInput
            placeholder="UAN: Enter UAN number"
            value={form.uanNumber}
            onChange={(e) => setForm((p) => ({ ...p, uanNumber: e.target.value.replace(/\D/g, "") }))}
          />
        </Field>
      </SimpleGrid>
    </SectionCard>
  );
}

function DynamicStep({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const experienced = String(form.employmentType || "").trim().toLowerCase() === "experienced";

  return (
    <SectionCard>
      <Flex align="center" justify="space-between" mb={4}>
        <Box>
          <Text fontSize="xl" fontWeight="800" color="text.heading">
            Educational Qualification
          </Text>
          <Text fontSize="sm" color="text.muted">
            Education and background details
          </Text>
        </Box>
        <Text fontSize="sm" color="text.muted">
          Step 3 of {steps.length}
        </Text>
      </Flex>

      <Divider mb={5} />

      <Text fontWeight="800" color="text.heading" mb={3}>
        Education Details
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        <Field label="Highest Qualification" required>
          <StyledSelect
            placeholder="Select highest qualification"
            value={form.highestQualification}
            onChange={(e) => setForm((p) => ({ ...p, highestQualification: e.target.value }))}
          >
            <option value="Diploma">Diploma</option>
            <option value="UG">UG</option>
            <option value="PG">PG</option>
          </StyledSelect>
        </Field>

        <Field label="Institution Name" required>
          <StyledInput
            placeholder="Institution: Enter institution name"
            value={form.institutionName}
            onChange={(e) => setForm((p) => ({ ...p, institutionName: e.target.value }))}
          />
        </Field>

        <Field label="Graduation Year" required>
          <StyledInput
            placeholder="Graduation year: e.g., 2026"
            value={form.graduationYear}
            onChange={(e) => setForm((p) => ({ ...p, graduationYear: e.target.value }))}
          />
        </Field>
      </SimpleGrid>

      {experienced ? (
        <>
          <Divider my={5} />
          <Text fontWeight="800" color="text.heading" mb={3}>
            Experienced: Previous Employment
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Field label="Total Experience (Years)" required>
              <StyledInput
                placeholder="Experience: Enter total years"
                value={form.totalExperienceYears}
                onChange={(e) => setForm((p) => ({ ...p, totalExperienceYears: e.target.value }))}
              />
            </Field>

            <Field label="Last Company" required>
              <StyledInput
                placeholder="Company: Enter last company name"
                value={form.lastCompany}
                onChange={(e) => setForm((p) => ({ ...p, lastCompany: e.target.value }))}
              />
            </Field>

            <Field label="Last Designation" required>
              <StyledInput
                placeholder="Designation: Enter last designation"
                value={form.lastDesignation}
                onChange={(e) => setForm((p) => ({ ...p, lastDesignation: e.target.value }))}
              />
            </Field>

            <Field label="Reason for Leaving" required>
              <StyledInput
                placeholder="Reason: Enter reason for leaving"
                value={form.reasonForLeaving}
                onChange={(e) => setForm((p) => ({ ...p, reasonForLeaving: e.target.value }))}
              />
            </Field>
          </SimpleGrid>
        </>
      ) : null}
    </SectionCard>
  );
}

function SalaryStep({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <SectionCard>
      <Flex align="center" justify="space-between" mb={4}>
        <Box>
          <Text fontSize="xl" fontWeight="800" color="text.heading">
            Salary Structure
          </Text>
          <Text fontSize="sm" color="text.muted">
            Compensation and PF/Tax details
          </Text>
        </Box>
        <Text fontSize="sm" color="text.muted">
          Step 4 of {steps.length}
        </Text>
      </Flex>

      <Divider mb={5} />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        <Field label="CTC" required>
          <StyledInput
            placeholder="CTC: Enter CTC (e.g., 600000)"
            value={form.ctc}
            onChange={(e) => setForm((p) => ({ ...p, ctc: e.target.value }))}
          />
        </Field>

        <Field label="Basic" required>
          <StyledInput
            placeholder="Basic: Enter basic salary"
            value={form.basic}
            onChange={(e) => setForm((p) => ({ ...p, basic: e.target.value }))}
          />
        </Field>

        <Field label="HRA">
          <StyledInput
            placeholder="HRA: Enter HRA amount"
            value={form.hra}
            onChange={(e) => setForm((p) => ({ ...p, hra: e.target.value }))}
          />
        </Field>

        <Field label="Allowances">
          <StyledInput
            placeholder="Allowances: Enter allowances"
            value={form.allowances}
            onChange={(e) => setForm((p) => ({ ...p, allowances: e.target.value }))}
          />
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

      {form.pfApplicable ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
          <Field label="PF Employee Contribution" required>
            <StyledInput
              placeholder="PF employee contribution"
              value={form.pfEmployee}
              onChange={(e) => setForm((p) => ({ ...p, pfEmployee: e.target.value }))}
            />
          </Field>

          <Field label="PF Employer Contribution" required>
            <StyledInput
              placeholder="PF employer contribution"
              value={form.pfEmployer}
              onChange={(e) => setForm((p) => ({ ...p, pfEmployer: e.target.value }))}
            />
          </Field>
        </SimpleGrid>
      ) : null}

      <Field label="Tax Regime" required>
        <StyledSelect
          placeholder="Select tax regime"
          value={String(form.taxRegime || "New")}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              taxRegime: e.target.value.trim() as FormState["taxRegime"],
            }))
          }
          maxW={{ base: "100%", md: "240px" }}
        >
          <option value="New">New</option>
          <option value="Old">Old</option>
        </StyledSelect>
      </Field>
    </SectionCard>
  );
}

function DocumentsStep({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <SectionCard>
      <Flex align="center" justify="space-between" mb={4}>
        <Box>
          <Text fontSize="xl" fontWeight="800" color="text.heading">
            Upload Documents
          </Text>
          <Text fontSize="sm" color="text.muted">
            Upload multiple documents (PDF/JPG/PNG/DOCX)
          </Text>
        </Box>
        <Text fontSize="sm" color="text.muted">
          Step 5 of {steps.length}
        </Text>
      </Flex>

      <Divider mb={5} />

      <Field label="Upload Documents" required>
        <UploadDropzone
          files={form.uploadedDocuments}
          onChange={(next) => setForm((p) => ({ ...p, uploadedDocuments: next }))}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          maxFiles={20}
        />
      </Field>
    </SectionCard>
  );
}

/** -------------------------
 * Main Page
 * ------------------------ */
export default function AddEmployeePage() {
  const [form, setForm] = useState<FormState>({ ...initialState });
  const [activeStep, setActiveStep] = useState<StepKey>("personal");
  const [completedUpTo, setCompletedUpTo] = useState<number>(0);

  const activeIndex = useMemo(() => steps.findIndex((s) => s.key === activeStep), [activeStep]);

  // Keep permanent address fields synced if user checks "same as current"
  useEffect(() => {
    if (!form.permanentSameAsCurrent) return;
    setForm((p) => ({
      ...p,
      permanentAddressLine1: p.currentAddressLine1,
      permanentCity: p.currentCity,
      permanentState: p.currentState,
      permanentPincode: p.currentPincode,
      permanentCountry: p.currentCountry,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.permanentSameAsCurrent,
    form.currentAddressLine1,
    form.currentCity,
    form.currentState,
    form.currentPincode,
    form.currentCountry,
  ]);

  const goNext = () => {
    const nextIndex = Math.min(activeIndex + 1, steps.length - 1);
    setActiveStep(steps[nextIndex].key);
    setCompletedUpTo((p) => Math.max(p, nextIndex));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    const prevIndex = Math.max(activeIndex - 1, 0);
    setActiveStep(steps[prevIndex].key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm({ ...initialState });
    setActiveStep("personal");
    setCompletedUpTo(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderStep = () => {
    switch (activeStep) {
      case "personal":
        return <PersonalStep form={form} setForm={setForm} />;
      case "employment":
        return <EmploymentStep form={form} setForm={setForm} />;
      case "dynamic":
        return <DynamicStep form={form} setForm={setForm} />;
      case "salary":
        return <SalaryStep form={form} setForm={setForm} />;
      case "documents":
        return <DocumentsStep form={form} setForm={setForm} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <PageHeader title="Add New Employee" subtitle="Multi-step employee onboarding form" />

      <Stepper activeIndex={activeIndex} completedUpTo={completedUpTo} />

      <Box mt={5}>{renderStep()}</Box>

      {/* Footer actions */}
      <SectionCard>
        <Flex align="center" justify="space-between" wrap="wrap" gap={3} px={2}>
          <SecondaryButton
            leftIcon={<ChevronLeft size={16} />}
            size="sm"
            onClick={() => window.history.back()}
          >
            Cancel
          </SecondaryButton>

          <HStack spacing={3}>
            <SecondaryButton
              leftIcon={<ChevronLeft size={16} />}
              size="sm"
              onClick={goPrev}
              isDisabled={activeIndex === 0}
            >
              Previous
            </SecondaryButton>

            <SecondaryButton leftIcon={<RotateCcw size={16} />} size="sm" onClick={resetForm}>
              Reset Form
            </SecondaryButton>

            <PrimaryButton size="sm" onClick={goNext}>
              {activeIndex === steps.length - 1 ? "Save Employee" : "Save & Continue"}
            </PrimaryButton>
          </HStack>
        </Flex>
      </SectionCard>
    </Box>
  );
}