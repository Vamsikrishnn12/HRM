"use client";

import React, { useRef, useState } from "react";
import { Box, Flex, Text, Input, IconButton, useToast } from "@chakra-ui/react";
import { UploadCloud, X } from "lucide-react";

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function fileKey(f: File) {
  return `${f.name}-${f.size}-${f.lastModified}`;
}

export default function UploadDropzone({
  files,
  onChange,
  accept,
  maxFiles = 20,
}: {
  files: File[];
  onChange: (nextFiles: File[]) => void;
  accept?: string;
  maxFiles?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const toast = useToast();

  const addFiles = (incoming: File[]) => {
    if (!incoming.length) return;
    const map = new Map<string, File>();
    for (const f of files) map.set(fileKey(f), f);
    for (const f of incoming) map.set(fileKey(f), f);
    const merged = Array.from(map.values());
    if (merged.length > maxFiles) {
      toast({ title: "Too many files", description: `Max ${maxFiles} files.`, status: "warning", duration: 2500, isClosable: true });
      onChange(merged.slice(0, maxFiles));
      return;
    }
    onChange(merged);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (idx: number) => onChange(files.filter((_, i) => i !== idx));

  return (
    <Box>
      <Input ref={inputRef} type="file" multiple accept={accept} display="none" onChange={(e) => addFiles(Array.from(e.target.files || []))} />
      <Box
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files || [])); }}
        borderRadius="xl"
        border="1px solid"
        borderColor={isDragging ? "brand.400" : "surface.border"}
        bg={isDragging ? "purple.50" : "surface.bg"}
        px={{ base: 4, md: 6 }}
        py={{ base: 6, md: 7 }}
        cursor="pointer"
        transition="all 0.15s ease"
        _hover={{ borderColor: "brand.400" }}
      >
        <Flex direction="column" align="center" justify="center" gap={2}>
          <Box w="44px" h="44px" borderRadius="full" display="flex" alignItems="center" justifyContent="center" bg={isDragging ? "brand.500" : "white"} border="1px solid" borderColor={isDragging ? "brand.500" : "surface.border"} color={isDragging ? "white" : "brand.500"}>
            <UploadCloud size={20} />
          </Box>
          <Text fontSize="sm" fontWeight="700" color="text.heading" textAlign="center">
            Drag & drop files here <Text as="span" color="brand.500">or click to upload</Text>
          </Text>
          <Text fontSize="xs" color="text.muted" textAlign="center">
            Accepted: PDF, JPG, PNG, DOCX
          </Text>
        </Flex>
      </Box>

      {files.length > 0 && (
        <Box mt={4}>
          <Flex align="center" justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="800" color="text.heading">Uploaded Files</Text>
            <Text fontSize="xs" color="text.muted">{files.length} file{files.length > 1 ? "s" : ""}</Text>
          </Flex>
          <Box border="1px solid" borderColor="surface.border" borderRadius="xl" overflow="hidden">
            {files.map((f, idx) => (
              <Flex key={fileKey(f)} align="center" justify="space-between" px={3} py={2.5} borderTop={idx === 0 ? "none" : "1px solid"} borderColor="surface.border" bg="white">
                <Box minW={0}>
                  <Text fontSize="sm" fontWeight="700" color="text.heading" noOfLines={1}>{f.name}</Text>
                  <Text fontSize="xs" color="text.muted">{formatBytes(f.size)}</Text>
                </Box>
                <IconButton aria-label="Remove file" icon={<X size={16} />} size="sm" variant="ghost" onClick={() => removeAt(idx)} />
              </Flex>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
