"use client";

import { useState, useMemo } from "react";
import { Box, Flex, Button, Text, HStack } from "@chakra-ui/react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { leaveRequests, type LeaveRequest } from "@/lib/mockData";

type TabKey = "All" | "Pending" | "Approved" | "Rejected";

const tabs: TabKey[] = ["All", "Pending", "Approved", "Rejected"];

export default function LeavePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("All");

  const filtered = useMemo(() => {
    if (activeTab === "All") return leaveRequests;
    return leaveRequests.filter((r) => r.status === activeTab);
  }, [activeTab]);

  const columns = useMemo<Column<LeaveRequest>[]>(
    () => [
      { key: "id", header: "ID", width: "80px" },
      {
        key: "employeeName",
        header: "Employee",
        render: (row) => (
          <Text fontWeight="600" color="text.heading" fontSize="sm">
            {row.employeeName}
          </Text>
        ),
      },
      { key: "type", header: "Leave Type" },
      {
        key: "from",
        header: "Duration",
        render: (row) => (
          <Text fontSize="sm">
            {row.from} — {row.to}{" "}
            <Text as="span" color="text.muted">
              ({row.days}d)
            </Text>
          </Text>
        ),
      },
      { key: "reason", header: "Reason" },
      { key: "appliedOn", header: "Applied", width: "90px" },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    []
  );

  return (
    <Box>
      <PageHeader title="Leave Management" subtitle="Review and manage leave requests" />

      <SectionCard noPadding>
        {/* Tabs */}
        <HStack spacing={0} px={5} pt={4} pb={0} borderBottom="1px solid" borderColor="surface.border">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              size="sm"
              fontWeight="600"
              fontSize="sm"
              borderRadius="0"
              borderBottom="2px solid"
              borderColor={activeTab === tab ? "brand.400" : "transparent"}
              color={activeTab === tab ? "brand.400" : "text.muted"}
              _hover={{ color: "brand.400" }}
              onClick={() => setActiveTab(tab)}
              pb={3}
              px={4}
            >
              {tab}
              {tab !== "All" && (
                <Text
                  as="span"
                  ml={1.5}
                  px={1.5}
                  py={0.5}
                  borderRadius="full"
                  bg={activeTab === tab ? "brand.50" : "surface.bg"}
                  fontSize="xs"
                >
                  {leaveRequests.filter((r) => tab === ("All" as string) || r.status === tab).length}
                </Text>
              )}
            </Button>
          ))}
        </HStack>

        <Box p={5}>
          <DataTable<LeaveRequest> columns={columns} data={filtered} keyField="id" />
        </Box>
      </SectionCard>
    </Box>
  );
}
