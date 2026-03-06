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
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Badge,
} from "@chakra-ui/react";
import { Plus, Edit2, Trash2, CalendarDays, Clock, MapPin, CalendarOff } from "lucide-react";
import { settingsApi } from "@/api";
import type { OrgSettings, Holiday } from "@/api";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput, StyledSelect } from "@/components/ui/FormHelpers";

const WEEK_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // ── Settings state ──
  const [settings, setSettings] = useState<OrgSettings | null>(null);

  // ── Timings form ──
  const [timingsForm, setTimingsForm] = useState({
    workStartTime: "09:00",
    workEndTime: "18:00",
    lateGraceMinutes: 15,
    halfDayMinMinutes: 240,
    fullDayMinMinutes: 480,
  });

  // ── Weekly off form ──
  const [weekOffForm, setWeekOffForm] = useState({
    weekOffDays: "SUNDAY",
    alternateSaturdayOffRule: "NONE" as "NONE" | "SECOND_FOURTH" | "FIRST_THIRD",
  });

  // ── Location form ──
  const [locationForm, setLocationForm] = useState({
    officeLatitude: "",
    officeLongitude: "",
    officeRadiusMeters: "",
  });

  // ── Holidays ──
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayForm, setHolidayForm] = useState({ date: "", name: "" });
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ── Load data ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, h] = await Promise.all([
        settingsApi.get(),
        settingsApi.listHolidays(),
      ]);
      setSettings(s);
      setTimingsForm({
        workStartTime: s.workStartTime?.slice(0, 5) || "09:00",
        workEndTime: s.workEndTime?.slice(0, 5) || "18:00",
        lateGraceMinutes: s.lateGraceMinutes,
        halfDayMinMinutes: s.halfDayMinMinutes,
        fullDayMinMinutes: s.fullDayMinMinutes,
      });
      setWeekOffForm({
        weekOffDays: s.weekOffDays || "SUNDAY",
        alternateSaturdayOffRule: s.alternateSaturdayOffRule || "NONE",
      });
      setLocationForm({
        officeLatitude: s.officeLatitude != null ? String(s.officeLatitude) : "",
        officeLongitude: s.officeLongitude != null ? String(s.officeLongitude) : "",
        officeRadiusMeters: s.officeRadiusMeters != null ? String(s.officeRadiusMeters) : "",
      });
      setHolidays(h.data);
    } catch {
      toast({ title: "Failed to load settings", status: "error", duration: 3000, isClosable: true, position: "top-right" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Save helpers ──
  const saveSection = async (section: string, data: Record<string, unknown>) => {
    try {
      setSaving(section);
      const updated = await settingsApi.update(data);
      setSettings(updated);
      toast({ title: "Settings updated", status: "success", duration: 2000, isClosable: true, position: "top-right" });
    } catch {
      toast({ title: "Failed to save settings", status: "error", duration: 3000, isClosable: true, position: "top-right" });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveTimings = () =>
    saveSection("timings", timingsForm);

  const handleSaveWeekOff = () =>
    saveSection("weekoff", weekOffForm);

  const handleSaveLocation = () => {
    const data: Record<string, unknown> = {
      officeLatitude: locationForm.officeLatitude ? parseFloat(locationForm.officeLatitude) : null,
      officeLongitude: locationForm.officeLongitude ? parseFloat(locationForm.officeLongitude) : null,
      officeRadiusMeters: locationForm.officeRadiusMeters ? parseInt(locationForm.officeRadiusMeters) : null,
    };
    saveSection("location", data);
  };

  // ── Holiday CRUD ──
  const openAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({ date: "", name: "" });
    onOpen();
  };

  const openEditHoliday = (h: Holiday) => {
    setEditingHoliday(h);
    setHolidayForm({ date: h.date, name: h.name });
    onOpen();
  };

  const handleSaveHoliday = async () => {
    if (!holidayForm.date || !holidayForm.name.trim()) {
      toast({ title: "Date and name are required", status: "warning", duration: 2000, isClosable: true, position: "top-right" });
      return;
    }
    try {
      setSaving("holiday");
      if (editingHoliday) {
        await settingsApi.updateHoliday(editingHoliday.id, holidayForm);
      } else {
        await settingsApi.createHoliday(holidayForm);
      }
      const h = await settingsApi.listHolidays();
      setHolidays(h.data);
      onClose();
      toast({ title: editingHoliday ? "Holiday updated" : "Holiday added", status: "success", duration: 2000, isClosable: true, position: "top-right" });
    } catch (err: any) {
      toast({ title: err?.message || "Failed to save holiday", status: "error", duration: 3000, isClosable: true, position: "top-right" });
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await settingsApi.deleteHoliday(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      toast({ title: "Holiday deleted", status: "success", duration: 2000, isClosable: true, position: "top-right" });
    } catch {
      toast({ title: "Failed to delete holiday", status: "error", duration: 3000, isClosable: true, position: "top-right" });
    }
  };

  // ── Week off day toggle ──
  const selectedDays = weekOffForm.weekOffDays ? weekOffForm.weekOffDays.split(",") : [];
  const toggleDay = (day: string) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setWeekOffForm((f) => ({ ...f, weekOffDays: next.join(",") }));
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="Settings" subtitle="Manage organisation preferences" />
        <Flex justify="center" py={20}><Spinner size="lg" color="brand.400" /></Flex>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Manage organisation preferences" />

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        {/* ── Office Timings ── */}
        <SectionCard
          title="Office Timings"
          actions={
            <Flex align="center" gap={1.5} color="brand.400">
              <Clock size={15} />
              <Text fontSize="xs" fontWeight="600">Attendance Rules</Text>
            </Flex>
          }
        >
          <Flex direction="column" gap={4}>
            <SimpleGrid columns={2} spacing={4}>
              <Field label="Work Start Time" required>
                <StyledInput
                  type="time"
                  value={timingsForm.workStartTime}
                  onChange={(e) => setTimingsForm((f) => ({ ...f, workStartTime: e.target.value }))}
                />
              </Field>
              <Field label="Work End Time" required>
                <StyledInput
                  type="time"
                  value={timingsForm.workEndTime}
                  onChange={(e) => setTimingsForm((f) => ({ ...f, workEndTime: e.target.value }))}
                />
              </Field>
            </SimpleGrid>
            <Field label="Late Grace (minutes)">
              <StyledInput
                type="number"
                value={timingsForm.lateGraceMinutes}
                onChange={(e) => setTimingsForm((f) => ({ ...f, lateGraceMinutes: parseInt(e.target.value) || 0 }))}
                maxW="140px"
              />
            </Field>
            <SimpleGrid columns={2} spacing={4}>
              <Field label="Half Day Min (minutes)">
                <StyledInput
                  type="number"
                  value={timingsForm.halfDayMinMinutes}
                  onChange={(e) => setTimingsForm((f) => ({ ...f, halfDayMinMinutes: parseInt(e.target.value) || 0 }))}
                />
              </Field>
              <Field label="Full Day Min (minutes)">
                <StyledInput
                  type="number"
                  value={timingsForm.fullDayMinMinutes}
                  onChange={(e) => setTimingsForm((f) => ({ ...f, fullDayMinMinutes: parseInt(e.target.value) || 0 }))}
                />
              </Field>
            </SimpleGrid>
            <PrimaryButton
              size="sm"
              alignSelf="flex-start"
              mt={1}
              onClick={handleSaveTimings}
              isLoading={saving === "timings"}
            >
              Save Timings
            </PrimaryButton>
          </Flex>
        </SectionCard>

        {/* ── Weekly Off Rules ── */}
        <SectionCard
          title="Weekly Off Rules"
          actions={
            <Flex align="center" gap={1.5} color="brand.400">
              <CalendarOff size={15} />
              <Text fontSize="xs" fontWeight="600">Week Days</Text>
            </Flex>
          }
        >
          <Flex direction="column" gap={4}>
            <Field label="Weekly Off Days">
              <Flex gap={2} flexWrap="wrap">
                {WEEK_DAYS.map((day) => (
                  <Box
                    key={day}
                    as="button"
                    type="button"
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="600"
                    border="1px solid"
                    borderColor={selectedDays.includes(day) ? "brand.400" : "surface.border"}
                    bg={selectedDays.includes(day) ? "brand.50" : "white"}
                    color={selectedDays.includes(day) ? "brand.600" : "text.muted"}
                    _hover={{ borderColor: "brand.300", bg: "brand.50" }}
                    transition="all 0.15s"
                    onClick={() => toggleDay(day)}
                  >
                    {day.slice(0, 3)}
                  </Box>
                ))}
              </Flex>
            </Field>
            <Field label="Alternate Saturday Off">
              <StyledSelect
                value={weekOffForm.alternateSaturdayOffRule}
                onChange={(e) =>
                  setWeekOffForm((f) => ({
                    ...f,
                    alternateSaturdayOffRule: e.target.value as "NONE" | "SECOND_FOURTH" | "FIRST_THIRD",
                  }))
                }
                maxW="280px"
              >
                <option value="NONE">None</option>
                <option value="SECOND_FOURTH">2nd &amp; 4th Saturday Off</option>
                <option value="FIRST_THIRD">1st &amp; 3rd Saturday Off</option>
              </StyledSelect>
            </Field>
            <PrimaryButton
              size="sm"
              alignSelf="flex-start"
              mt={1}
              onClick={handleSaveWeekOff}
              isLoading={saving === "weekoff"}
            >
              Save Week Off Rules
            </PrimaryButton>
          </Flex>
        </SectionCard>

        {/* ── Office Location ── */}
        <SectionCard
          title="Office Location"
          actions={
            <Flex align="center" gap={1.5} color="brand.400">
              <MapPin size={15} />
              <Text fontSize="xs" fontWeight="600">Geo-fence</Text>
            </Flex>
          }
        >
          <Flex direction="column" gap={4}>
            <SimpleGrid columns={2} spacing={4}>
              <Field label="Latitude">
                <StyledInput
                  type="number"
                  step="any"
                  placeholder="e.g. 28.6139"
                  value={locationForm.officeLatitude}
                  onChange={(e) => setLocationForm((f) => ({ ...f, officeLatitude: e.target.value }))}
                />
              </Field>
              <Field label="Longitude">
                <StyledInput
                  type="number"
                  step="any"
                  placeholder="e.g. 77.2090"
                  value={locationForm.officeLongitude}
                  onChange={(e) => setLocationForm((f) => ({ ...f, officeLongitude: e.target.value }))}
                />
              </Field>
            </SimpleGrid>
            <Field label="Radius (meters)">
              <StyledInput
                type="number"
                placeholder="e.g. 200"
                value={locationForm.officeRadiusMeters}
                onChange={(e) => setLocationForm((f) => ({ ...f, officeRadiusMeters: e.target.value }))}
                maxW="180px"
              />
            </Field>
            <PrimaryButton
              size="sm"
              alignSelf="flex-start"
              mt={1}
              onClick={handleSaveLocation}
              isLoading={saving === "location"}
            >
              Save Location
            </PrimaryButton>
          </Flex>
        </SectionCard>

        {/* ── Holidays ── */}
        <SectionCard
          title="Holidays"
          actions={
            <SecondaryButton size="xs" leftIcon={<Plus size={14} />} onClick={openAddHoliday}>
              Add Holiday
            </SecondaryButton>
          }
        >
          <Flex direction="column" gap={0}>
            {holidays.length === 0 ? (
              <Flex direction="column" align="center" py={8} color="text.muted">
                <CalendarDays size={32} />
                <Text fontSize="sm" mt={2}>No holidays added yet</Text>
              </Flex>
            ) : (
              holidays.map((h, i) => (
                <Flex
                  key={h.id}
                  align="center"
                  justify="space-between"
                  py={2.5}
                  px={1}
                  borderBottom={i < holidays.length - 1 ? "1px solid" : "none"}
                  borderColor="surface.border"
                  _hover={{ bg: "surface.bg" }}
                  borderRadius="md"
                  transition="background 0.1s"
                >
                  <Flex align="center" gap={3}>
                    <Flex
                      w={9}
                      h={9}
                      borderRadius="lg"
                      bg="brand.50"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <CalendarDays size={16} color="var(--chakra-colors-brand-400)" />
                    </Flex>
                    <Box>
                      <Text fontSize="sm" fontWeight="600" color="text.heading">
                        {h.name}
                      </Text>
                      <Text fontSize="xs" color="text.muted">
                        {new Date(h.date + "T00:00:00").toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </Box>
                  </Flex>
                  <HStack spacing={1}>
                    <IconButton
                      aria-label="Edit"
                      icon={<Edit2 size={14} />}
                      size="xs"
                      variant="ghost"
                      color="text.muted"
                      _hover={{ color: "brand.400", bg: "brand.50" }}
                      onClick={() => openEditHoliday(h)}
                    />
                    <IconButton
                      aria-label="Delete"
                      icon={<Trash2 size={14} />}
                      size="xs"
                      variant="ghost"
                      color="text.muted"
                      _hover={{ color: "red.500", bg: "red.50" }}
                      onClick={() => handleDeleteHoliday(h.id)}
                    />
                  </HStack>
                </Flex>
              ))
            )}
          </Flex>
        </SectionCard>
      </SimpleGrid>

      {/* ── Holiday Modal ── */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader borderBottom="1px solid" borderColor="surface.border" fontSize="md" fontWeight="700">
            {editingHoliday ? "Edit Holiday" : "Add Holiday"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5}>
            <Flex direction="column" gap={4}>
              <Field label="Date" required>
                <StyledInput
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, date: e.target.value }))}
                />
              </Field>
              <Field label="Holiday Name" required>
                <StyledInput
                  placeholder="e.g. Republic Day"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
            </Flex>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="surface.border" gap={2}>
            <SecondaryButton size="sm" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton size="sm" onClick={handleSaveHoliday} isLoading={saving === "holiday"}>
              {editingHoliday ? "Update" : "Add"}
            </PrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
