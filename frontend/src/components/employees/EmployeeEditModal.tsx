"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  Text,
  SimpleGrid,
  Divider,
  Switch,
  FormControl,
  FormLabel,
  Checkbox,
  useToast,
} from "@chakra-ui/react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput } from "@/components/ui/FormHelpers";
import { employeeApi } from "@/api";
import type { EmployeeFromAPI } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeFromAPI | null;
  onSaved: () => void;
}

export default function EmployeeEditModal({ isOpen, onClose, employee, onSaved }: Props) {
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLocationRequired, setEditLocationRequired] = useState(false);
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [editRadius, setEditRadius] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (employee) {
      setEditIsActive(employee.user.isActive);
      setEditLocationRequired(employee.user.officeLocationRequired);
      setEditLat(employee.user.officeLatitude != null ? String(employee.user.officeLatitude) : "");
      setEditLng(employee.user.officeLongitude != null ? String(employee.user.officeLongitude) : "");
      setEditRadius(employee.user.officeRadiusMeters != null ? String(employee.user.officeRadiusMeters) : "");
    }
  }, [employee]);

  const handleSave = async () => {
    if (!employee) return;
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        isActive: editIsActive,
        officeLocationRequired: editLocationRequired,
      };
      if (editLocationRequired) {
        if (!editLat || !editLng || !editRadius) {
          toast({ title: "Please fill latitude, longitude, and radius", status: "warning", duration: 3000, isClosable: true });
          return;
        }
        payload.officeLatitude = parseFloat(editLat);
        payload.officeLongitude = parseFloat(editLng);
        payload.officeRadiusMeters = parseInt(editRadius, 10);
      } else {
        payload.officeLatitude = null;
        payload.officeLongitude = null;
        payload.officeRadiusMeters = null;
      }

      await employeeApi.update(employee.id, payload);
      toast({ title: "Employee updated", status: "success", duration: 3000, isClosable: true });
      onClose();
      onSaved();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update", status: "error", duration: 4000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "md" }} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius={{ base: 0, md: "xl" }}>
        <ModalHeader fontSize="lg" fontWeight="700" color="text.heading">
          Edit Employee {employee?.user.empId && `— ${employee.user.empId}`}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {employee && (
            <>
              <Text fontSize="sm" color="text.muted" mb={4}>
                {employee.user.firstName} {employee.user.lastName} &middot; {employee.user.email}
              </Text>

              <FormControl display="flex" alignItems="center" justifyContent="space-between" mb={4} p={3} bg="surface.bg" borderRadius="lg">
                <Box>
                  <FormLabel htmlFor="status-switch" mb={0} fontSize="sm" fontWeight="600" color="text.heading">Account Status</FormLabel>
                  <Text fontSize="xs" color="text.muted">
                    {editIsActive ? "Employee can log in" : "Login is blocked"}
                  </Text>
                </Box>
                <Switch id="status-switch" isChecked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} colorScheme="brand" size="md" />
              </FormControl>

              <Divider mb={4} />

              <Checkbox isChecked={editLocationRequired} onChange={(e) => setEditLocationRequired(e.target.checked)} colorScheme="brand" mb={3}>
                <Text fontSize="sm" fontWeight="600" color="text.heading">Enable location-based login</Text>
              </Checkbox>

              {editLocationRequired && (
                <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} mb={2}>
                  <Field label="Latitude" required>
                    <StyledInput type="number" step="any" placeholder="e.g., 28.6139" value={editLat} onChange={(e) => setEditLat(e.target.value)} />
                  </Field>
                  <Field label="Longitude" required>
                    <StyledInput type="number" step="any" placeholder="e.g., 77.2090" value={editLng} onChange={(e) => setEditLng(e.target.value)} />
                  </Field>
                  <Field label="Radius (m)" required>
                    <StyledInput type="number" placeholder="e.g., 200" value={editRadius} onChange={(e) => setEditRadius(e.target.value)} />
                  </Field>
                </SimpleGrid>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter gap={2}>
          <SecondaryButton size="sm" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton size="sm" onClick={handleSave} isLoading={saving}>Save Changes</PrimaryButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
