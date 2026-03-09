"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Box,
  Text,
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";
import { MapPin } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import DetailItem from "@/components/ui/DetailItem";
import type { EmployeeFromAPI } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeFromAPI | null;
}

export default function EmployeeViewModal({ isOpen, onClose, employee }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "lg" }} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius={{ base: 0, md: "xl" }}>
        <ModalHeader fontSize="lg" fontWeight="700" color="text.heading">Employee Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {employee && (
            <>
              <Flex align="center" gap={3} mb={4}>
                <Flex w={12} h={12} borderRadius="xl" bg="brand.50" align="center" justify="center" flexShrink={0}>
                  <Text fontSize="lg" fontWeight="700" color="brand.500">
                    {employee.user.firstName[0]}{employee.user.lastName[0]}
                  </Text>
                </Flex>
                <Box>
                  <Text fontWeight="700" color="text.heading">{employee.user.firstName} {employee.user.lastName}</Text>
                  <Text fontSize="sm" color="text.muted">{employee.user.email}</Text>
                </Box>
                <Box ml="auto">
                  <StatusBadge status={employee.user.isActive ? "Active" : "Inactive"} />
                </Box>
              </Flex>

              <Divider mb={4} />

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <DetailItem label="Employee ID" value={employee.user.empId || "—"} />
                <DetailItem label="Department" value={employee.department} />
                <DetailItem label="Designation" value={employee.designation} />
                <DetailItem label="Employment Type" value={employee.employmentType} />
                <DetailItem label="Date of Joining" value={employee.dateOfJoining} />
                <DetailItem label="Reporting Manager" value={employee.reportingManager} />
                <DetailItem label="Shift Schedule" value={employee.shiftSchedule} />
                <DetailItem label="Last Login" value={employee.user.lastLoginAt ? new Date(employee.user.lastLoginAt).toLocaleString() : "Never"} />
              </SimpleGrid>

              {employee.user.officeLocationRequired && (
                <>
                  <Divider my={4} />
                  <Flex align="center" gap={2} mb={2}>
                    <MapPin size={14} color="#30B8E9" />
                    <Text fontSize="sm" fontWeight="600" color="text.heading">Location-Based Login Enabled</Text>
                  </Flex>
                  <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                    <DetailItem label="Latitude" value={employee.user.officeLatitude != null ? String(employee.user.officeLatitude) : "—"} />
                    <DetailItem label="Longitude" value={employee.user.officeLongitude != null ? String(employee.user.officeLongitude) : "—"} />
                    <DetailItem label="Radius (m)" value={employee.user.officeRadiusMeters != null ? String(employee.user.officeRadiusMeters) : "—"} />
                  </SimpleGrid>
                </>
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
