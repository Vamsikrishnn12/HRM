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
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Switch,
  FormControl,
  FormLabel,
  useDisclosure,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { Edit2, Eye, Search, Plus } from "lucide-react";
import { employeeApi } from "@/api";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput, StyledSelect } from "@/components/ui/FormHelpers";
import type { EmployeeFromAPI, EmployeeRow, AddEmployeeFormState } from "@/types";

const initialFormState: AddEmployeeFormState = {
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

/* ── View Modal ─────────────────────────────────────────────────── */
function ViewModal({
  isOpen,
  onClose,
  employee,
}: {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeFromAPI | null;
}) {
  if (!employee) return null;
  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="surface.border">
      <Text fontSize="sm" color="text.muted" fontWeight="500">{label}</Text>
      <Text fontSize="sm" color="text.body" fontWeight="500">{value || "—"}</Text>
    </Flex>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader borderBottom="1px solid" borderColor="surface.border">
          <Text fontWeight="700">{employee.user.firstName} {employee.user.lastName}</Text>
          <Text fontSize="xs" color="text.muted">{employee.user.empId || "—"} · {employee.user.email}</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={5}>
          <Text fontWeight="700" mb={2} color="text.heading">Employment</Text>
          <InfoRow label="Department" value={employee.department} />
          <InfoRow label="Designation" value={employee.designation} />
          <InfoRow label="Employment Type" value={employee.employmentType} />
          <InfoRow label="Date of Joining" value={employee.dateOfJoining} />
          <InfoRow label="Reporting Manager" value={employee.reportingManager} />
          <InfoRow label="Shift Schedule" value={employee.shiftSchedule} />
          <InfoRow label="Status" value={employee.user.isActive ? "Active" : "Inactive"} />
          <InfoRow label="Last Login" value={employee.user.lastLoginAt ? new Date(employee.user.lastLoginAt).toLocaleString() : "Never"} />

          {employee.user.officeLocationRequired && (
            <>
              <Divider my={4} />
              <Text fontWeight="700" mb={2} color="text.heading">Location-Based Login</Text>
              <InfoRow label="Latitude" value={employee.user.officeLatitude != null ? String(employee.user.officeLatitude) : "—"} />
              <InfoRow label="Longitude" value={employee.user.officeLongitude != null ? String(employee.user.officeLongitude) : "—"} />
              <InfoRow label="Radius (meters)" value={employee.user.officeRadiusMeters != null ? String(employee.user.officeRadiusMeters) : "—"} />
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

/* ── Employee Form (Add / Edit) ─────────────────────────────────── */
function EmployeeForm_({
  mode,
  editRow,
  onDone,
  onCancel,
}: {
  mode: "add" | "edit";
  editRow?: EmployeeRow | null;
  onDone: (created?: { empId: string; generatedPassword: string }) => void;
  onCancel: () => void;
}) {
  const emp = editRow?.raw;
  const [form, setForm] = useState<AddEmployeeFormState>(
    emp
      ? {
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
          email: emp.user.email,
          department: emp.department,
          designation: emp.designation,
          employmentType: emp.employmentType,
          dateOfJoining: emp.dateOfJoining,
          reportingManager: emp.reportingManager,
          shiftSchedule: emp.shiftSchedule,
          allowLoginOnlyInsideOffice: emp.user.officeLocationRequired,
          officeLatitude: emp.user.officeLatitude != null ? String(emp.user.officeLatitude) : "",
          officeLongitude: emp.user.officeLongitude != null ? String(emp.user.officeLongitude) : "",
          officeRadiusMeters: emp.user.officeRadiusMeters != null ? String(emp.user.officeRadiusMeters) : "",
        }
      : { ...initialFormState },
  );
  const [isActive, setIsActive] = useState(emp?.user.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const validate = () => {
    if (!form.firstName || !form.lastName || !form.department || !form.designation || !form.dateOfJoining || !form.reportingManager || !form.shiftSchedule) {
      toast({ title: "Please fill all required fields", status: "warning", duration: 3000, isClosable: true });
      return false;
    }
    if (mode === "add" && !form.email) {
      toast({ title: "Email is required", status: "warning", duration: 3000, isClosable: true });
      return false;
    }
    if (form.allowLoginOnlyInsideOffice && (!form.officeLatitude || !form.officeLongitude || !form.officeRadiusMeters)) {
      toast({ title: "Please fill latitude, longitude, and radius", status: "warning", duration: 3000, isClosable: true });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);

      if (mode === "edit" && emp) {
        const payload: Record<string, unknown> = {
          firstName: form.firstName,
          lastName: form.lastName,
          department: form.department,
          designation: form.designation,
          employmentType: form.employmentType,
          dateOfJoining: form.dateOfJoining,
          reportingManager: form.reportingManager,
          shiftSchedule: form.shiftSchedule,
          isActive,
          officeLocationRequired: form.allowLoginOnlyInsideOffice,
        };
        if (form.allowLoginOnlyInsideOffice) {
          payload.officeLatitude = parseFloat(form.officeLatitude);
          payload.officeLongitude = parseFloat(form.officeLongitude);
          payload.officeRadiusMeters = parseInt(form.officeRadiusMeters, 10);
        } else {
          payload.officeLatitude = null;
          payload.officeLongitude = null;
          payload.officeRadiusMeters = null;
        }
        await employeeApi.update(emp.id, payload);
        toast({ title: "Employee updated", status: "success", duration: 3000, isClosable: true });
        onDone();
      } else {
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
        toast({ title: "Employee created!", description: `Employee ID: ${result.empId}`, status: "success", duration: 5000, isClosable: true });
        onDone({ empId: result.empId, generatedPassword: result.generatedPassword });
      }
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
          {mode === "edit" ? `Edit Employee — ${editRow?.name}` : "Add New Employee"}
        </Text>
        <SecondaryButton size="sm" onClick={onCancel}>Back to List</SecondaryButton>
      </Flex>

      <SectionCard mb={4}>
        <Text fontWeight="800" color="text.heading" mb={1}>Basic Information</Text>
        <Text fontSize="sm" color="text.muted" mb={4}>
          {mode === "edit" ? "Update the employee's employment details." : "Enter the employee's basic employment details to create their account."}
        </Text>
        <Divider mb={5} />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
          <Field label="First Name" required>
            <StyledInput placeholder="Enter first name" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
          </Field>
          <Field label="Last Name" required>
            <StyledInput placeholder="Enter last name" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
          </Field>
          {mode === "add" ? (
            <Field label="Email" required>
              <StyledInput type="email" placeholder="Enter work email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </Field>
          ) : (
            <Field label="Email">
              <StyledInput value={form.email} isReadOnly bg="surface.bg" cursor="not-allowed" />
            </Field>
          )}
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
      </SectionCard>

      <SectionCard mb={4}>
        <Text fontWeight="800" color="text.heading" mb={1}>Login Access</Text>
        <Text fontSize="sm" color="text.muted" mb={4}>Configure how the employee can access the system.</Text>
        <Divider mb={5} />

        {mode === "edit" && (
          <FormControl display="flex" alignItems="center" justifyContent="space-between" mb={4} p={3} bg="surface.bg" borderRadius="lg">
            <Box>
              <FormLabel htmlFor="status-switch" mb={0} fontSize="sm" fontWeight="600" color="text.heading">Account Status</FormLabel>
              <Text fontSize="xs" color="text.muted">{isActive ? "Employee can log in" : "Login is blocked"}</Text>
            </Box>
            <Switch id="status-switch" isChecked={isActive} onChange={(e) => setIsActive(e.target.checked)} colorScheme="brand" size="md" />
          </FormControl>
        )}

        <Box mb={4}>
          <Checkbox
            isChecked={form.allowLoginOnlyInsideOffice}
            onChange={(e) => setForm((p) => ({ ...p, allowLoginOnlyInsideOffice: e.target.checked }))}
            colorScheme="brand"
          >
            <Text fontSize="sm" fontWeight="600" color="text.heading">Allow login only inside office</Text>
          </Checkbox>
          <Text mt={1} fontSize="xs" color="text.muted" ml={6}>
            When enabled, employee login is restricted to the specified office coordinates and radius.
          </Text>
        </Box>

        {form.allowLoginOnlyInsideOffice && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Field label="Office Latitude" required>
              <StyledInput type="number" step="any" placeholder="e.g., 28.6139" value={form.officeLatitude} onChange={(e) => setForm((p) => ({ ...p, officeLatitude: e.target.value }))} />
            </Field>
            <Field label="Office Longitude" required>
              <StyledInput type="number" step="any" placeholder="e.g., 77.2090" value={form.officeLongitude} onChange={(e) => setForm((p) => ({ ...p, officeLongitude: e.target.value }))} />
            </Field>
            <Field label="Allowed Radius (meters)" required>
              <StyledInput type="number" placeholder="e.g., 200" value={form.officeRadiusMeters} onChange={(e) => setForm((p) => ({ ...p, officeRadiusMeters: e.target.value }))} />
            </Field>
          </SimpleGrid>
        )}
      </SectionCard>

      <SectionCard>
        <Flex justify="flex-end" gap={3}>
          <SecondaryButton size="sm" onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton size="sm" onClick={handleSave} isLoading={saving}>
            {mode === "edit" ? "Update Employee" : "Create Employee"}
          </PrimaryButton>
        </Flex>
      </SectionCard>
    </Box>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [view, setView] = useState<"list" | "add" | "edit" | "created">("list");
  const [editRow, setEditRow] = useState<EmployeeRow | null>(null);
  const [viewEmployee, setViewEmployee] = useState<EmployeeFromAPI | null>(null);
  const [createdResult, setCreatedResult] = useState<{ empId: string; generatedPassword: string } | null>(null);
  const viewModal = useDisclosure();
  const toast = useToast();

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const result = await employeeApi.list();
      const mapped: EmployeeRow[] = result.data.map((emp) => ({
        profileId: emp.id,
        empId: emp.user.empId || emp.user.id.slice(0, 8),
        name: `${emp.user.firstName} ${emp.user.lastName}`,
        email: emp.user.email,
        department: emp.department,
        designation: emp.designation,
        status: emp.user.isActive ? "Active" : "Inactive",
        joinDate: emp.dateOfJoining,
        raw: emp,
      }));
      setEmployees(mapped);
    } catch {
      toast({ title: "Failed to load employees", status: "error", duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.empId.toLowerCase().includes(q);
    const matchDept = !deptFilter || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const handleView = (row: EmployeeRow) => {
    setViewEmployee(row.raw);
    viewModal.onOpen();
  };

  const handleEdit = (row: EmployeeRow) => {
    setEditRow(row);
    setView("edit");
  };

  const handleFormDone = (created?: { empId: string; generatedPassword: string }) => {
    if (created) {
      setCreatedResult(created);
      setView("created");
    } else {
      setView("list");
      setEditRow(null);
    }
    fetchEmployees();
  };

  const handleAddAnother = () => {
    setCreatedResult(null);
    setView("add");
  };

  const handleBackToList = () => {
    setCreatedResult(null);
    setEditRow(null);
    setView("list");
  };

  const columns: Column<EmployeeRow>[] = [
    {
      key: "empId",
      header: "Emp ID",
      width: "100px",
      render: (row) => (
        <Text fontWeight="600" fontSize="sm" color="brand.400">{row.empId}</Text>
      ),
    },
    {
      key: "name",
      header: "Employee Name",
      render: (row) => (
        <Box>
          <Text fontWeight="600" fontSize="sm">{row.name}</Text>
          <Text fontSize="xs" color="text.muted">{row.email}</Text>
        </Box>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (row) => <Text fontSize="sm">{row.department}</Text>,
    },
    {
      key: "designation",
      header: "Designation",
      render: (row) => <Text fontSize="sm">{row.designation}</Text>,
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "joinDate",
      header: "Join Date",
      width: "110px",
      render: (row) => <Text fontSize="sm">{row.joinDate}</Text>,
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

  /* ── Created success view ──────────────────────────────────────── */
  if (view === "created" && createdResult) {
    return (
      <Box>
        <PageHeader title="Employee Details" subtitle="Employee account has been registered successfully." />
        <SectionCard>
          <Alert status="success" borderRadius="xl" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" py={8}>
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">Employee Account Created!</AlertTitle>
            <AlertDescription maxWidth="sm">
              <Text mb={3}>Credentials have been sent to the employee&apos;s email. You can also share them manually:</Text>
              <Box bg="surface.bg" borderRadius="lg" p={4} textAlign="left">
                <Text fontSize="sm" mb={1}><strong>Employee ID:</strong> <Code>{createdResult.empId}</Code></Text>
                <Text fontSize="sm"><strong>Password:</strong> <Code>{createdResult.generatedPassword}</Code></Text>
              </Box>
            </AlertDescription>
          </Alert>
          <Flex mt={6} gap={3} justify="center">
            <PrimaryButton size="sm" onClick={handleAddAnother}>Add Another Employee</PrimaryButton>
            <SecondaryButton size="sm" onClick={handleBackToList}>Go to Employee List</SecondaryButton>
          </Flex>
        </SectionCard>
      </Box>
    );
  }

  /* ── Add view ──────────────────────────────────────────────────── */
  if (view === "add") {
    return (
      <Box>
        <PageHeader title="Employee Details" subtitle="Create a new employee account. Credentials will be auto-generated and emailed." />
        <EmployeeForm_ mode="add" onDone={handleFormDone} onCancel={handleBackToList} />
      </Box>
    );
  }

  /* ── Edit view ─────────────────────────────────────────────────── */
  if (view === "edit" && editRow) {
    return (
      <Box>
        <PageHeader title="Employee Details" subtitle="Update employee employment and access details." />
        <EmployeeForm_ mode="edit" editRow={editRow} onDone={handleFormDone} onCancel={() => { setView("list"); setEditRow(null); }} />
      </Box>
    );
  }

  /* ── List view ─────────────────────────────────────────────────── */
  return (
    <Box>
      <PageHeader
        title="Employee Details"
        subtitle="Manage your organization's workforce."
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
          <HStack spacing={3} flexWrap="wrap">
            <InputGroup maxW={{ base: "100%", md: "320px" }}>
              <InputLeftElement pointerEvents="none">
                <Search size={16} color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Search by name, email, or ID..."
                size="md"
                borderRadius="lg"
                fontSize="sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select
              maxW="200px"
              size="md"
              borderRadius="lg"
              fontSize="sm"
              placeholder="All Departments"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </HStack>
          <Text fontSize="sm" color="text.muted">
            {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
          </Text>
        </Flex>

        <DataTable
          columns={columns}
          data={filtered}
          keyField="profileId"
          emptyMessage={loading ? "Loading..." : "No employees found. Click 'Add New' to get started."}
        />
      </SectionCard>

      <ViewModal isOpen={viewModal.isOpen} onClose={viewModal.onClose} employee={viewEmployee} />
    </Box>
  );
}
