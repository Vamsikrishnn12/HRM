"use client";

import React, { useState, useEffect } from "react";
import { Box, Flex, Text, useToast } from "@chakra-ui/react";
import { api } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { PrimaryButton } from "@/components/ui/Buttons";
import { Field } from "@/components/ui/FormHelpers";
import UploadDropzone, { formatBytes } from "@/components/ui/UploadDropzone";
import EmployeeSelector from "@/components/ui/EmployeeSelector";

interface ExistingDoc {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  documentType: string | null;
  uploadedAt: string;
}

export default function DocumentsPage() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<ExistingDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!selectedUserId) { setExisting([]); setFiles([]); return; }
    api.get<any>(`/employees/user/${selectedUserId}`)
      .then((data) => setExisting(data.documents || []))
      .catch(() => {});
  }, [selectedUserId]);

  const handleUpload = async () => {
    if (!files.length) {
      toast({ title: "No files selected", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      await api.postFormData(`/employees/${selectedUserId}/documents`, fd);
      toast({ title: "Documents uploaded", status: "success", duration: 3000, isClosable: true });
      setFiles([]);
      // Refresh existing
      const data = await api.get<any>(`/employees/user/${selectedUserId}`);
      setExisting(data.documents || []);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Error", status: "error", duration: 4000, isClosable: true });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Documents" subtitle="Upload and manage employee documents." />

      <SectionCard>
        <EmployeeSelector value={selectedUserId} onChange={setSelectedUserId} />
      </SectionCard>

      {selectedUserId && (
        <>
          {existing.length > 0 && (
            <SectionCard>
              <Text fontWeight="800" color="text.heading" mb={3}>Existing Documents</Text>
              <Box border="1px solid" borderColor="surface.border" borderRadius="xl" overflow="hidden">
                {existing.map((doc, idx) => (
                  <Flex key={doc.id} align="center" justify="space-between" px={3} py={2.5} borderTop={idx === 0 ? "none" : "1px solid"} borderColor="surface.border" bg="white">
                    <Box minW={0}>
                      <Text fontSize="sm" fontWeight="700" color="text.heading" noOfLines={1}>{doc.fileName}</Text>
                      <Text fontSize="xs" color="text.muted">{formatBytes(doc.size)} {doc.documentType ? `- ${doc.documentType}` : ""}</Text>
                    </Box>
                    <Text fontSize="xs" color="text.muted">{new Date(doc.uploadedAt).toLocaleDateString()}</Text>
                  </Flex>
                ))}
              </Box>
            </SectionCard>
          )}

          <SectionCard>
            <Text fontWeight="800" color="text.heading" mb={3}>Upload New Documents</Text>
            <Field label="Select Files">
              <UploadDropzone files={files} onChange={setFiles} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" maxFiles={20} />
            </Field>
          </SectionCard>

          <SectionCard>
            <Flex justify="flex-end">
              <PrimaryButton size="sm" onClick={handleUpload} isLoading={uploading}>Upload Documents</PrimaryButton>
            </Flex>
          </SectionCard>
        </>
      )}
    </Box>
  );
}
