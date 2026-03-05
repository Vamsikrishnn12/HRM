"use client";

import { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { api } from "@/lib/api";
import { StyledSelect } from "./FormHelpers";

interface DropdownEmployee {
  userId: string;
  empId: string;
  firstName: string;
  lastName: string;
}

export default function EmployeeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (userId: string) => void;
}) {
  const [employees, setEmployees] = useState<DropdownEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DropdownEmployee[]>("/employees/dropdown")
      .then(setEmployees)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box mb={6}>
      <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>
        Select Employee
      </Text>
      <StyledSelect
        placeholder={loading ? "Loading employees..." : "Select an employee"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxW="400px"
      >
        {employees.map((emp) => (
          <option key={emp.userId} value={emp.userId}>
            {emp.empId} - {emp.firstName} {emp.lastName}
          </option>
        ))}
      </StyledSelect>
    </Box>
  );
}
