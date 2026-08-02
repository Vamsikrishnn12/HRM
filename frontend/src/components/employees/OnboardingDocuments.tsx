"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Box, Button, Flex, HStack, IconButton, SimpleGrid, Spinner, Text, useToast, VStack } from "@chakra-ui/react";
import { CheckCircle2, Download, FileCheck2, FileUp, Trash2 } from "lucide-react";
import { documentsApi } from "@/api";
import SectionCard from "@/components/ui/SectionCard";
import { formatBytes } from "@/components/ui/UploadDropzone";
import type { DocumentRow } from "@/types";

type Requirement = {
  type: string;
  title: string;
  description: string;
  experiencedOnly?: boolean;
  maxFiles?: number;
};

export const ONBOARDING_DOCUMENTS: Requirement[] = [
  { type: "Aadhaar Card", title: "Aadhaar card", description: "Clear front and back copy" },
  { type: "PAN Card", title: "PAN card", description: "Clear PAN card copy" },
  { type: "Signed Offer Letter", title: "Signed offer letter", description: "All signed pages" },
  { type: "Signed Appointment Letter", title: "Signed appointment letter", description: "All signed pages" },
  { type: "12th or Diploma Certificate", title: "12th or diploma certificate", description: "Upload whichever is applicable" },
  { type: "Consolidated Marksheet", title: "Consolidated marksheet", description: "College or university consolidated marksheet" },
  { type: "Degree or Course Completion Certificate", title: "Degree / course completion", description: "Final degree or completion certificate" },
  { type: "Resume", title: "Latest resume", description: "Current resume in PDF or DOCX" },
  { type: "Passport Photo", title: "Passport-size photo", description: "Recent clear photograph" },
  { type: "Previous 3 Months Payslips", title: "Previous three months' payslips", description: "Upload three separate files or one combined PDF", experiencedOnly: true, maxFiles: 3 },
  { type: "Previous 3 Months Bank Statements", title: "Previous salary bank statements", description: "Previous salary-account statements for three months", experiencedOnly: true, maxFiles: 3 },
  { type: "Experience Letter", title: "Experience letter", description: "From the previous employer", experiencedOnly: true },
  { type: "Relieving Letter", title: "Relieving letter", description: "From the previous employer", experiencedOnly: true },
];

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function OnboardingDocuments({ experienced }: { experienced: boolean }) {
  const [records, setRecords] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyType, setBusyType] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const toast = useToast();

  const requirements = useMemo(
    () => ONBOARDING_DOCUMENTS.filter((item) => !item.experiencedOnly || experienced),
    [experienced],
  );

  const load = useCallback(async () => {
    try {
      const result = await documentsApi.listMine();
      setRecords(result.data);
    } catch (error: any) {
      toast({ title: "Could not load documents", description: error?.message, status: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const upload = async (requirement: Requirement, selected: FileList | null) => {
    const files = Array.from(selected || []);
    if (!files.length) return;
    const existing = records.filter((record) => record.documentType === requirement.type);
    const maxFiles = requirement.maxFiles || 1;
    if (files.length + (maxFiles > 1 ? existing.length : 0) > maxFiles) {
      toast({ title: `Upload a maximum of ${maxFiles} files for ${requirement.title}`, status: "warning" });
      return;
    }
    const invalid = files.find((file) => !ACCEPTED_TYPES.includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) {
      toast({ title: "Use PDF, JPG, PNG, WEBP, DOC, or DOCX files up to 5 MB each", status: "warning" });
      return;
    }

    try {
      setBusyType(requirement.type);
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("documentType", requirement.type);
      await documentsApi.uploadMine(formData);
      if (maxFiles === 1) {
        await Promise.all(existing.map((record) => documentsApi.removeMine(record.id).catch(() => undefined)));
      }
      toast({ title: `${requirement.title} uploaded`, status: "success" });
      await load();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error?.message, status: "error" });
    } finally {
      setBusyType("");
      const input = inputRefs.current[requirement.type];
      if (input) input.value = "";
    }
  };

  const remove = async (record: DocumentRow) => {
    try {
      setBusyType(record.documentType);
      await documentsApi.removeMine(record.id);
      await load();
      toast({ title: "Document removed", status: "success" });
    } catch (error: any) {
      toast({ title: "Could not remove document", description: error?.message, status: "error" });
    } finally {
      setBusyType("");
    }
  };

  const completed = requirements.filter((item) => records.some((record) => record.documentType === item.type)).length;

  return (
    <Box id="documents" scrollMarginTop="90px">
      <SectionCard mb={5}>
        <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} mb={2}>
          <Box>
            <Text fontWeight="800" color="text.heading">Onboarding documents</Text>
            <Text fontSize="sm" color="text.muted" mt={1}>Upload clear, readable documents. PDF or image is recommended; maximum 5 MB per file.</Text>
          </Box>
          <Badge colorScheme={completed === requirements.length ? "green" : "blue"} px={3} py={1.5} borderRadius="full">
            {completed}/{requirements.length} completed
          </Badge>
        </Flex>
        {experienced && <Text fontSize="sm" color="orange.700" bg="orange.50" p={3} borderRadius="lg" mt={3}>Previous-employment documents are required because your profile is marked as experienced.</Text>}

        {loading ? <Flex py={12} justify="center"><Spinner color="brand.500" /></Flex> : (
          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3} mt={5}>
            {requirements.map((requirement) => {
              const uploaded = records.filter((record) => record.documentType === requirement.type);
              const complete = uploaded.length > 0;
              const atLimit = uploaded.length >= (requirement.maxFiles || 1);
              return (
                <Box key={requirement.type} border="1px solid" borderColor={complete ? "green.200" : "surface.border"} bg={complete ? "green.50" : "white"} borderRadius="xl" p={4}>
                  <Flex gap={3} align="flex-start">
                    <Flex w={9} h={9} align="center" justify="center" borderRadius="lg" bg={complete ? "green.100" : "brand.50"} color={complete ? "green.600" : "brand.600"} flexShrink={0}>
                      {complete ? <FileCheck2 size={18} /> : <FileUp size={18} />}
                    </Flex>
                    <Box flex={1} minW={0}>
                      <HStack><Text fontWeight="800" fontSize="sm" color="text.heading">{requirement.title}</Text>{complete && <CheckCircle2 size={15} color="#17865c" />}</HStack>
                      <Text fontSize="xs" color="text.muted" mt={0.5}>{requirement.description}</Text>
                    </Box>
                    {!atLimit && <Button size="xs" colorScheme="blue" variant={complete ? "outline" : "solid"} isLoading={busyType === requirement.type} onClick={() => inputRefs.current[requirement.type]?.click()}>{complete ? "Add" : "Upload"}</Button>}
                    {complete && !requirement.maxFiles && <Button size="xs" variant="outline" isLoading={busyType === requirement.type} onClick={() => inputRefs.current[requirement.type]?.click()}>Replace</Button>}
                    <input ref={(node) => { inputRefs.current[requirement.type] = node; }} type="file" hidden multiple={(requirement.maxFiles || 1) > 1} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(event) => void upload(requirement, event.target.files)} />
                  </Flex>
                  {uploaded.length > 0 && <VStack align="stretch" spacing={1.5} mt={3}>{uploaded.map((record) => (
                    <Flex key={record.id} align="center" gap={2} bg="white" borderRadius="lg" px={3} py={2} border="1px solid" borderColor="green.100">
                      <Box flex={1} minW={0}><Text fontSize="xs" fontWeight="700" noOfLines={1}>{record.originalName}</Text><Text fontSize="10px" color="text.muted">{formatBytes(record.size)}</Text></Box>
                      <IconButton aria-label="Download document" icon={<Download size={14} />} size="xs" variant="ghost" onClick={() => documentsApi.downloadMine(record.id, record.originalName)} />
                      <IconButton aria-label="Remove document" icon={<Trash2 size={14} />} size="xs" variant="ghost" colorScheme="red" onClick={() => void remove(record)} isLoading={busyType === requirement.type} />
                    </Flex>
                  ))}</VStack>}
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </SectionCard>
    </Box>
  );
}
