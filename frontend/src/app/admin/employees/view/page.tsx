"use client";

import React, { useState, useEffect } from "react";
import { Box, Flex, Text, SimpleGrid, Divider, Badge, Spinner, useToast } from "@chakra-ui/react";
import { employeeApi } from "@/api";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import EmployeeSelector from "@/components/ui/EmployeeSelector";
import { InfoRow } from "@/components/ui/DetailItem";
import { formatBytes } from "@/components/ui/UploadDropzone";

export default function ViewEmployeePage() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!selectedUserId) { setData(null); return; }
    setLoading(true);
    employeeApi.getByUserId(selectedUserId)
      .then(setData)
      .catch(() => toast({ title: "Failed to load employee", status: "error", duration: 3000, isClosable: true }))
      .finally(() => setLoading(false));
  }, [selectedUserId, toast]);

  return (
    <Box>
      <PageHeader title="View Employee" subtitle="View complete employee details." />

      <SectionCard>
        <EmployeeSelector value={selectedUserId} onChange={setSelectedUserId} />
      </SectionCard>

      {loading && (
        <Flex justify="center" py={10}><Spinner color="brand.400" /></Flex>
      )}

      {data && !loading && (
        <>
          {/* Employment */}
          <SectionCard>
            <Flex align="center" gap={2} mb={4}>
              <Text fontSize="lg" fontWeight="800" color="text.heading">Employment Details</Text>
              {data.user?.empId && <Badge colorScheme="purple">{data.user.empId}</Badge>}
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <InfoRow label="Name" value={`${data.user?.firstName || ""} ${data.user?.lastName || ""}`} />
              <InfoRow label="Email" value={data.user?.email} />
              <InfoRow label="Department" value={data.department} />
              <InfoRow label="Designation" value={data.designation} />
              <InfoRow label="Employment Type" value={data.employmentType} />
              <InfoRow label="Date of Joining" value={data.dateOfJoining} />
              <InfoRow label="Reporting Manager" value={data.reportingManager} />
              <InfoRow label="Shift Schedule" value={data.shiftSchedule} />
              <InfoRow label="Status" value={data.user?.isActive ? "Active" : "Inactive"} />
            </SimpleGrid>
          </SectionCard>

          {/* Personal */}
          <SectionCard>
            <Text fontSize="lg" fontWeight="800" color="text.heading" mb={4}>Personal Information</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <InfoRow label="Aadhaar Number" value={data.aadhaarNumber} />
              <InfoRow label="Mobile" value={data.mobileNumber} />
              <InfoRow label="WhatsApp" value={data.whatsappNumber} />
              <InfoRow label="Date of Birth" value={data.dateOfBirth} />
              <InfoRow label="Gender" value={data.gender} />
              <InfoRow label="Marital Status" value={data.maritalStatus} />
              <InfoRow label="Nationality" value={data.nationality} />
            </SimpleGrid>
            <Divider my={4} />
            <Text fontWeight="700" color="text.heading" mb={3}>Current Address</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <InfoRow label="Address" value={data.currentAddressLine1} />
              <InfoRow label="City" value={data.currentCity} />
              <InfoRow label="State" value={data.currentState} />
              <InfoRow label="Pincode" value={data.currentPincode} />
              <InfoRow label="Country" value={data.currentCountry} />
            </SimpleGrid>
            {!data.permanentSameAsCurrent && (
              <>
                <Divider my={4} />
                <Text fontWeight="700" color="text.heading" mb={3}>Permanent Address</Text>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <InfoRow label="Address" value={data.permanentAddressLine1} />
                  <InfoRow label="City" value={data.permanentCity} />
                  <InfoRow label="State" value={data.permanentState} />
                  <InfoRow label="Pincode" value={data.permanentPincode} />
                  <InfoRow label="Country" value={data.permanentCountry} />
                </SimpleGrid>
              </>
            )}
          </SectionCard>

          {/* Education & Experience */}
          <SectionCard>
            <Text fontSize="lg" fontWeight="800" color="text.heading" mb={4}>Education</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <InfoRow label="Highest Qualification" value={data.education?.highestQualification} />
              <InfoRow label="Institution" value={data.education?.institutionName} />
              <InfoRow label="Graduation Year" value={data.education?.graduationYear} />
            </SimpleGrid>
            {data.employmentType?.toLowerCase() === "experienced" && (
              <>
                <Divider my={4} />
                <Text fontWeight="700" color="text.heading" mb={3}>Previous Employment</Text>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <InfoRow label="Total Experience" value={data.totalExperienceYears ? `${data.totalExperienceYears} years` : null} />
                  <InfoRow label="Last Company" value={data.lastCompany} />
                  <InfoRow label="Last Designation" value={data.lastDesignation} />
                  <InfoRow label="Reason for Leaving" value={data.reasonForLeaving} />
                </SimpleGrid>
              </>
            )}
          </SectionCard>

          {/* Salary */}
          <SectionCard>
            <Text fontSize="lg" fontWeight="800" color="text.heading" mb={4}>Salary Structure</Text>
            {data.salaryStructure ? (
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <InfoRow label="CTC" value={data.salaryStructure.ctc} />
                <InfoRow label="Basic" value={data.salaryStructure.basic} />
                <InfoRow label="HRA" value={data.salaryStructure.hra} />
                <InfoRow label="Allowances" value={data.salaryStructure.allowances} />
                <InfoRow label="PF Applicable" value={data.salaryStructure.pfApplicable ? "Yes" : "No"} />
                <InfoRow label="PF Employee" value={data.salaryStructure.pfEmployeeContribution} />
                <InfoRow label="PF Employer" value={data.salaryStructure.pfEmployerContribution} />
                <InfoRow label="Tax Regime" value={data.salaryStructure.taxRegime} />
              </SimpleGrid>
            ) : (
              <Text fontSize="sm" color="text.muted">No salary information available.</Text>
            )}
          </SectionCard>

          {/* Banking */}
          <SectionCard>
            <Text fontSize="lg" fontWeight="800" color="text.heading" mb={4}>Banking Details</Text>
            {data.bankAccount ? (
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <InfoRow label="Account Number" value={data.bankAccount.accountNumber} />
                <InfoRow label="IFSC Code" value={data.bankAccount.ifscCode} />
                <InfoRow label="Bank Name" value={data.bankAccount.bankName} />
                <InfoRow label="Branch" value={data.bankAccount.branchName} />
                <InfoRow label="PAN Number" value={data.bankAccount.panNumber} />
                <InfoRow label="UAN Number" value={data.bankAccount.uanNumber} />
              </SimpleGrid>
            ) : (
              <Text fontSize="sm" color="text.muted">No banking information available.</Text>
            )}
          </SectionCard>

          {/* Documents */}
          <SectionCard>
            <Text fontSize="lg" fontWeight="800" color="text.heading" mb={4}>Documents</Text>
            {data.documents?.length > 0 ? (
              <Box border="1px solid" borderColor="surface.border" borderRadius="xl" overflow="hidden">
                {data.documents.map((doc: any, idx: number) => (
                  <Flex key={doc.id} align="center" justify="space-between" px={3} py={2.5} borderTop={idx === 0 ? "none" : "1px solid"} borderColor="surface.border" bg="white">
                    <Box minW={0}>
                      <Text fontSize="sm" fontWeight="700" color="text.heading" noOfLines={1}>{doc.fileName}</Text>
                      <Text fontSize="xs" color="text.muted">{formatBytes(doc.size)}</Text>
                    </Box>
                    <Text fontSize="xs" color="text.muted">{new Date(doc.uploadedAt).toLocaleDateString()}</Text>
                  </Flex>
                ))}
              </Box>
            ) : (
              <Text fontSize="sm" color="text.muted">No documents uploaded.</Text>
            )}
          </SectionCard>
        </>
      )}
    </Box>
  );
}
