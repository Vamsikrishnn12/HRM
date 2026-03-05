"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  Spinner,
  Center,
  IconButton,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import Link from "next/link";
import { Search, Plus, Download, Eye, Pencil } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import EmployeeViewModal from "@/components/employees/EmployeeViewModal";
import EmployeeEditModal from "@/components/employees/EmployeeEditModal";
import { employeeApi } from "@/api";
import type { EmployeeFromAPI, EmployeeRow } from "@/types";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EmployeeFromAPI | null>(null);
  const toast = useToast();

  const viewModal = useDisclosure();
  const editModal = useDisclosure();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
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
      setDepartments(Array.from(new Set(mapped.map((e) => e.department))));
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const openView = (row: EmployeeRow) => {
    setSelected(row.raw);
    viewModal.onOpen();
  };

  const openEdit = (row: EmployeeRow) => {
    setSelected(row.raw);
    editModal.onOpen();
  };

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.empId.toLowerCase().includes(search.toLowerCase());
      const matchDept = !deptFilter || e.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [search, deptFilter, employees]);

  const columns = useMemo<Column<EmployeeRow>[]>(
    () => [
      { key: "empId", header: "Emp ID", width: "100px" },
      {
        key: "name",
        header: "Name",
        render: (row) => (
          <Box>
            <Text fontWeight="600" color="text.heading" fontSize="sm">{row.name}</Text>
            <Text fontSize="xs" color="text.muted">{row.designation}</Text>
          </Box>
        ),
      },
      { key: "email", header: "Email" },
      { key: "department", header: "Department" },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
      { key: "joinDate", header: "Join Date", width: "110px" },
      {
        key: "actions",
        header: "Actions",
        width: "100px",
        render: (row) => (
          <Flex gap={1}>
            <IconButton
              aria-label="View employee"
              icon={<Eye size={15} />}
              size="xs"
              variant="ghost"
              color="brand.500"
              onClick={() => openView(row)}
            />
            <IconButton
              aria-label="Edit employee"
              icon={<Pencil size={15} />}
              size="xs"
              variant="ghost"
              color="text.muted"
              onClick={() => openEdit(row)}
            />
          </Flex>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  return (
    <Box>
      <PageHeader
        title="Employees"
        subtitle="Manage your organization's workforce"
        actions={
          <>
            <SecondaryButton leftIcon={<Download size={16} />} size="sm">
              Export
            </SecondaryButton>
            <Link href="/admin/employees/add">
              <PrimaryButton leftIcon={<Plus size={16} />} size="sm">
                Add Employee
              </PrimaryButton>
            </Link>
          </>
        }
      />

      <SectionCard noPadding>
        <Flex gap={3} p={5} pb={0} flexWrap="wrap">
          <InputGroup maxW="320px" size="sm">
            <InputLeftElement>
              <Search size={14} color="#516079" aria-hidden="true" />
            </InputLeftElement>
            <Input
              placeholder="Search by name, email, or ID..."
              borderRadius="lg"
              bg="surface.bg"
              border="1px solid"
              borderColor="surface.border"
              _focus={{ borderColor: "brand.400" }}
              fontSize="sm"
              value={search}
              onChange={handleSearch}
            />
          </InputGroup>
          <Select
            maxW="200px"
            size="sm"
            borderRadius="lg"
            bg="surface.bg"
            border="1px solid"
            borderColor="surface.border"
            fontSize="sm"
            placeholder="All Departments"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </Flex>

        <Box p={5} pt={4}>
          {loading ? (
            <Center py={10}>
              <Spinner color="brand.500" />
            </Center>
          ) : filtered.length === 0 ? (
            <Center py={10}>
              <Text color="text.muted" fontSize="sm">
                No employees found. Add your first employee to get started.
              </Text>
            </Center>
          ) : (
            <DataTable<EmployeeRow> columns={columns} data={filtered} keyField="profileId" />
          )}
        </Box>
      </SectionCard>

      <EmployeeViewModal isOpen={viewModal.isOpen} onClose={viewModal.onClose} employee={selected} />
      <EmployeeEditModal isOpen={editModal.isOpen} onClose={editModal.onClose} employee={selected} onSaved={fetchEmployees} />
    </Box>
  );
}
