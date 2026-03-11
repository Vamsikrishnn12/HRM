"use client";

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Text,
} from "@chakra-ui/react";
import { useMemo, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  emptyMessage = "No records found",
}: DataTableProps<T>) {
  const rows = useMemo(() => data, [data]);

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            {columns.map((col) => (
              <Th
                key={col.key}
                fontSize="11px"
                color="text.muted"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="wider"
                py={3.5}
                borderColor="surface.border"
                bg="surface.bg"
                width={col.width}
                fontFamily="'Plus Jakarta Sans', 'Manrope', system-ui, sans-serif"
              >
                {col.header}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {rows.length === 0 ? (
            <Tr>
              <Td colSpan={columns.length} textAlign="center" py={12}>
                <Text color="text.muted" fontSize="sm" fontWeight="500">
                  {emptyMessage}
                </Text>
              </Td>
            </Tr>
          ) : (
            rows.map((row) => (
              <Tr
                key={String(row[keyField])}
                _hover={{ bg: "brand.50" }}
                transition="all 0.2s cubic-bezier(.4,0,.2,1)"
              >
                {columns.map((col) => (
                  <Td
                    key={col.key}
                    py={4}
                    fontSize="sm"
                    color="text.body"
                    borderColor="surface.border"
                    fontWeight="500"
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? "")}
                  </Td>
                ))}
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Box>
  );
}
