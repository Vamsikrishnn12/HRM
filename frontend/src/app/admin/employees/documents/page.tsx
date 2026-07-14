"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  useToast,
  IconButton,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
} from "@chakra-ui/react";
import { Eye, Search, Plus, Trash2, Download, FileText } from "lucide-react";
import { documentsApi } from "@/api";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { Field, StyledSelect } from "@/components/ui/FormHelpers";
import UploadDropzone, { formatBytes } from "@/components/ui/UploadDropzone";
import EmployeeSelector from "@/components/ui/EmployeeSelector";
import type { DocumentRow } from "@/types";

/** Server origin (no /api suffix) — used for static file URLs */
const SERVER_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "https://hrm-lilac-one.vercel.app/api"
).replace(/\/api\/?$/, "");

const DOCUMENT_TYPES = [
  "Aadhaar",
  "PAN Card",
  "Passport",
  "Driving License",
  "Voter ID",
  "Resume",
  "Offer Letter",
  "Relieving Letter",
  "Experience Letter",
  "Salary Certificate",
  "Bank Statement",
  "Educational Certificate",
  "Photo",
  "Other",
];

function getTypeColor(type: string) {
  const map: Record<string, string> = {
    Aadhaar: "blue",
    "PAN Card": "orange",
    Passport: "brand",
    Resume: "teal",
    "Offer Letter": "green",
    "Relieving Letter": "pink",
    "Experience Letter": "cyan",
    Photo: "yellow",
  };
  return map[type] || "gray";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ── View Modal ─────────────────────────────────────────────────── */
function ViewModal({
  isOpen,
  onClose,
  record,
}: {
  isOpen: boolean;
  onClose: () => void;
  record: DocumentRow | null;
}) {
  if (!record) return null;
  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.50">
      <Text fontSize="sm" color="text.muted" fontWeight="500">{label}</Text>
      <Text fontSize="sm" color="text.body" fontWeight="500">{value || "—"}</Text>
    </Flex>
  );

  const isPreviewable = record.mimeType.startsWith("image/") || record.mimeType === "application/pdf";
  const fileUrl = `${SERVER_BASE}/${record.filePath}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader borderBottom="1px solid" borderColor="surface.border">
          <Text fontWeight="700">Document Details</Text>
          <Text fontSize="xs" color="text.muted">{record.empId} · {record.employeeName}</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={5}>
          <InfoRow label="Document Type" value={record.documentType} />
          <InfoRow label="Original Name" value={record.originalName} />
          <InfoRow label="Size" value={formatBytes(record.size)} />
          <InfoRow label="MIME Type" value={record.mimeType} />
          <InfoRow label="Uploaded At" value={formatDate(record.createdAt)} />
          <InfoRow label="Employee" value={`${record.employeeName} (${record.empId})`} />
          <InfoRow label="Email" value={record.email} />

          {isPreviewable && (
            <Box mt={4} border="1px solid" borderColor="surface.border" borderRadius="lg" overflow="hidden">
              {record.mimeType.startsWith("image/") ? (
                <Box as="img" src={fileUrl} alt={record.originalName} w="100%" maxH="400px" objectFit="contain" bg="gray.50" />
              ) : (
                <Box as="iframe" src={fileUrl} w="100%" h="400px" />
              )}
            </Box>
          )}

          <Flex mt={4} justify="flex-end">
            <Button
              as="a"
              href={fileUrl}
              download={record.originalName}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              colorScheme="brand"
              leftIcon={<Download size={14} />}
            >
              Download
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

/* ── Upload Form ────────────────────────────────────────────────── */
function UploadForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [documentType, setDocumentType] = useState("Other");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleUpload = async () => {
    if (!selectedUserId) {
      toast({ title: "Please select an employee", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    if (!files.length) {
      toast({ title: "No files selected", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      fd.append("documentType", documentType);
      await documentsApi.upload(selectedUserId, fd);
      toast({ title: "Documents uploaded successfully", status: "success", duration: 3000, isClosable: true });
      onDone();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Error", status: "error", duration: 4000, isClosable: true });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="700" color="text.heading">Upload Documents</Text>
        <SecondaryButton size="sm" onClick={onCancel}>Back to List</SecondaryButton>
      </Flex>

      <SectionCard mb={4}>
        <EmployeeSelector value={selectedUserId} onChange={setSelectedUserId} />
      </SectionCard>

      <SectionCard mb={4}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          <Field label="Document Type">
            <StyledSelect value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </StyledSelect>
          </Field>
        </SimpleGrid>

        <Field label="Select Files">
          <UploadDropzone files={files} onChange={setFiles} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" maxFiles={20} />
        </Field>
      </SectionCard>

      <SectionCard>
        <Flex justify="flex-end" gap={3}>
          <SecondaryButton size="sm" onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton size="sm" onClick={handleUpload} isLoading={uploading}>Upload Documents</PrimaryButton>
        </Flex>
      </SectionCard>
    </Box>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function DocumentsPage() {
  const [records, setRecords] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "upload">("list");
  const [viewRecord, setViewRecord] = useState<DocumentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const viewModal = useDisclosure();
  const deleteDisclosure = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await documentsApi.list();
      setRecords(res.data);
    } catch {
      toast({ title: "Failed to load documents", status: "error", duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.employeeName.toLowerCase().includes(q) ||
      r.empId.toLowerCase().includes(q) ||
      r.originalName.toLowerCase().includes(q) ||
      r.documentType.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    );
  });

  const handleView = (row: DocumentRow) => {
    setViewRecord(row);
    viewModal.onOpen();
  };

  const handleDeleteClick = (row: DocumentRow) => {
    setDeleteTarget(row);
    deleteDisclosure.onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await documentsApi.remove(deleteTarget.id);
      toast({ title: "Document deleted", status: "success", duration: 3000, isClosable: true });
      deleteDisclosure.onClose();
      setDeleteTarget(null);
      fetchRecords();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message || "Error", status: "error", duration: 4000, isClosable: true });
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadDone = () => {
    setView("list");
    fetchRecords();
  };

  const columns: Column<DocumentRow>[] = [
    {
      key: "empId",
      header: "Emp ID",
      width: "90px",
      render: (row) => (
        <Text fontWeight="600" fontSize="sm" color="brand.500">{row.empId}</Text>
      ),
    },
    {
      key: "employeeName",
      header: "Employee",
      render: (row) => (
        <Box>
          <Text fontWeight="600" fontSize="sm">{row.employeeName}</Text>
          <Text fontSize="xs" color="text.muted">{row.email}</Text>
        </Box>
      ),
    },
    {
      key: "originalName",
      header: "File Name",
      render: (row) => (
        <HStack spacing={2}>
          <Box color="brand.400"><FileText size={16} /></Box>
          <Box minW={0}>
            <Text fontWeight="600" fontSize="sm" noOfLines={1}>{row.originalName}</Text>
            <Text fontSize="xs" color="text.muted">{formatBytes(row.size)}</Text>
          </Box>
        </HStack>
      ),
    },
    {
      key: "documentType",
      header: "Type",
      width: "140px",
      render: (row) => (
        <Badge variant="subtle" colorScheme={getTypeColor(row.documentType)} fontSize="xs">
          {row.documentType}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Uploaded",
      width: "110px",
      render: (row) => <Text fontSize="sm">{formatDate(row.createdAt)}</Text>,
    },
    {
      key: "actions",
      header: "Actions",
      width: "120px",
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
            aria-label="Download"
            icon={<Download size={16} />}
            size="sm"
            variant="ghost"
            color="text.muted"
            _hover={{ color: "green.500", bg: "green.50" }}
            as="a"
            href={`${SERVER_BASE}/${row.filePath}`}
            download={row.originalName}
            target="_blank"
            rel="noopener noreferrer"
          />
          <IconButton
            aria-label="Delete"
            icon={<Trash2 size={16} />}
            size="sm"
            variant="ghost"
            color="text.muted"
            _hover={{ color: "red.500", bg: "red.50" }}
            onClick={() => handleDeleteClick(row)}
          />
        </HStack>
      ),
    },
  ];

  if (view === "upload") {
    return (
      <Box>
        <PageHeader title="Documents" subtitle="Upload employee documents." />
        <UploadForm onDone={handleUploadDone} onCancel={() => setView("list")} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Documents"
        subtitle="Upload and manage employee documents."
        actions={
          <PrimaryButton size="sm" leftIcon={<Plus size={16} />} onClick={() => setView("upload")}>
            Upload New
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
          <InputGroup maxW={{ base: "100%", md: "320px" }}>
            <InputLeftElement pointerEvents="none">
              <Search size={16} color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Search by name, ID, file, type..."
              size="md"
              borderRadius="lg"
              fontSize="sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <Text fontSize="sm" color="text.muted">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
          </Text>
        </Flex>

        <DataTable
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage={loading ? "Loading..." : "No documents found. Click 'Upload New' to add one."}
        />
      </SectionCard>

      <ViewModal isOpen={viewModal.isOpen} onClose={viewModal.onClose} record={viewRecord} />

      <AlertDialog
        isOpen={deleteDisclosure.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDisclosure.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="700">Delete Document</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete <Text as="span" fontWeight="600">{deleteTarget?.originalName}</Text>? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteDisclosure.onClose} size="sm">Cancel</Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} isLoading={deleting} ml={3} size="sm">Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
