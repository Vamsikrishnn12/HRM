"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  Text,
} from "@chakra-ui/react";
import Link from "next/link"; // ✅ ADD THIS LINE
import { Search, Plus, Download } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { employees, type Employee } from "@/lib/mockData";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase());
      const matchDept = !deptFilter || e.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [search, deptFilter]);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))),
    []
  );

  const columns = useMemo<Column<Employee>[]>(
    () => [
      { key: "id", header: "Emp ID", width: "100px" },
      {
        key: "name",
        header: "Name",
        render: (row) => (
          <Box>
            <Text fontWeight="600" color="text.heading" fontSize="sm">
              {row.name}
            </Text>
            <Text fontSize="xs" color="text.muted">
              {row.designation}
            </Text>
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
    ],
    []
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

            {/* ✅ ONLY CHANGE: make it navigate */}
            <PrimaryButton
              as={Link}
              href="/admin/employees/add"
              leftIcon={<Plus size={16} />}
              size="sm"
            >
              Add Employee
            </PrimaryButton>
          </>
        }
      />

      <SectionCard noPadding>
        {/* Filters */}
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
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Flex>

        <Box p={5} pt={4}>
          <DataTable<Employee> columns={columns} data={filtered} keyField="id" />
        </Box>
      </SectionCard>
    </Box>
  );
}