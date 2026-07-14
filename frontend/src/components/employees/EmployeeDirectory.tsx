"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
  Badge,
  Box,
  Center,
  Checkbox,
  Code,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Edit2,
  Eye,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Plus,
  Search,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { documentsApi, employeeApi } from "@/api";
import { getAssetUrl } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput, StyledSelect } from "@/components/ui/FormHelpers";
import type { AddEmployeeFormState, EmployeeFromAPI, EmployeeRow } from "@/types";

const initialFormState: AddEmployeeFormState = {
  firstName: "",
  lastName: "",
  email: "",
  department: "",
  designation: "",
  employmentType: "Fresher",
  dateOfJoining: "",
  reportingManager: "",
  shiftSchedule: "",
  allowLoginOnlyInsideOffice: false,
  officeLatitude: "",
  officeLongitude: "",
  officeRadiusMeters: "",
};

function PhotoPicker({
  name,
  currentPhoto,
  onChange,
}: {
  name: string;
  currentPhoto?: string;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentPhoto);
  const toast = useToast();

  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Use a JPG, PNG, or WEBP photo", status: "warning" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Photo must be smaller than 5 MB", status: "warning" });
      return;
    }
    const nextPreview = URL.createObjectURL(file);
    setPreview(nextPreview);
    onChange(file);
  };

  const clearPhoto = () => {
    setPreview(currentPhoto);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Flex
      align={{ base: "flex-start", sm: "center" }}
      direction={{ base: "column", sm: "row" }}
      gap={5}
      p={5}
      border="1px dashed"
      borderColor="brand.200"
      bgGradient="linear(to-r, brand.50, accent.50)"
      borderRadius="xl"
    >
      <Box position="relative">
        <Avatar
          size="xl"
          name={name || "New employee"}
          src={preview}
          bg="brand.100"
          color="brand.700"
          border="4px solid white"
          boxShadow="soft"
        />
        <Center position="absolute" right="-2px" bottom="-2px" w="30px" h="30px" bg="accent.500" color="white" borderRadius="full" border="3px solid white">
          <Camera size={14} />
        </Center>
      </Box>
      <Box flex={1}>
        <Text fontWeight="800" color="text.heading">Profile photo</Text>
        <Text fontSize="sm" color="text.muted" mt={1}>This photo appears on the employee card and details window.</Text>
        <HStack mt={3} spacing={2}>
          <SecondaryButton size="sm" leftIcon={<Upload size={15} />} onClick={() => inputRef.current?.click()}>
            {preview ? "Change photo" : "Upload photo"}
          </SecondaryButton>
          {preview && preview !== currentPhoto && (
            <IconButton aria-label="Discard selected photo" icon={<X size={15} />} size="sm" variant="ghost" onClick={clearPhoto} />
          )}
        </HStack>
        <Input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" display="none" onChange={(e) => choosePhoto(e.target.files?.[0])} />
      </Box>
    </Flex>
  );
}

const documentOptions = [
  { key: "Government ID", title: "Government ID", description: "Aadhaar, PAN, passport, or driving licence" },
  { key: "Offer Letter", title: "Offer letter", description: "Signed or issued employment offer" },
  { key: "Appointment Letter", title: "Appointment letter", description: "Final appointment confirmation" },
] as const;

type EmployeeDocuments = Record<(typeof documentOptions)[number]["key"], File | null>;

function DocumentPicker({ option, file, onChange }: { option: (typeof documentOptions)[number]; file: File | null; onChange: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const selectFile = (nextFile?: File) => {
    if (!nextFile) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(nextFile.type)) {
      toast({ title: "Use a PDF, JPG, PNG, or WEBP document", status: "warning" });
      return;
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      toast({ title: "Document must be smaller than 5 MB", status: "warning" });
      return;
    }
    onChange(nextFile);
  };

  return (
    <Box border="1px solid" borderColor={file ? "accent.200" : "surface.border"} bg={file ? "accent.50" : "white"} borderRadius="xl" p={4}>
      <Flex gap={3} align="flex-start">
        <Center w="40px" h="40px" borderRadius="lg" bg={file ? "accent.100" : "brand.50"} color={file ? "accent.700" : "brand.600"} flexShrink={0}>
          {file ? <FileCheck2 size={19} /> : <FileText size={19} />}
        </Center>
        <Box flex={1} minW={0}>
          <Text fontWeight="800" color="text.heading">{option.title}</Text>
          <Text fontSize="xs" color="text.muted" mt={0.5}>{option.description}</Text>
          {file && <Text fontSize="xs" fontWeight="700" color="accent.700" mt={2} noOfLines={1}>{file.name}</Text>}
        </Box>
      </Flex>
      <HStack mt={4}>
        <SecondaryButton size="sm" leftIcon={<Upload size={14} />} onClick={() => inputRef.current?.click()}>{file ? "Change" : "Choose file"}</SecondaryButton>
        {file && <IconButton aria-label={`Remove ${option.title}`} icon={<X size={14} />} size="sm" variant="ghost" onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }} />}
      </HStack>
      <Input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" display="none" onChange={(event) => selectFile(event.target.files?.[0])} />
    </Box>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <Flex gap={3} p={3.5} bg="surface.bg" borderRadius="lg" align="flex-start">
      <Center w="34px" h="34px" borderRadius="lg" bg="white" color="brand.500" border="1px solid" borderColor="surface.border" flexShrink={0}>
        {icon}
      </Center>
      <Box minW={0}>
        <Text fontSize="11px" textTransform="uppercase" letterSpacing="wide" fontWeight="700" color="text.muted">{label}</Text>
        <Text fontSize="sm" fontWeight="700" color="text.heading" mt={0.5} wordBreak="break-word">{value || "—"}</Text>
      </Box>
    </Flex>
  );
}

function EmployeeDetailsModal({ isOpen, onClose, employee }: { isOpen: boolean; onClose: () => void; employee: EmployeeFromAPI | null }) {
  if (!employee) return null;
  const fullName = `${employee.user.firstName} ${employee.user.lastName}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside" isCentered>
      <ModalOverlay bg="rgba(6,31,58,.58)" backdropFilter="blur(5px)" />
      <ModalContent overflow="hidden" borderRadius="2xl">
        <Box h="112px" bgGradient="linear(120deg, #082B4C, #0B72E7 58%, #20C997)" />
        <ModalCloseButton color="white" bg="whiteAlpha.200" _hover={{ bg: "whiteAlpha.300" }} />
        <ModalHeader pt={0} px={{ base: 5, md: 7 }}>
          <Flex align={{ base: "flex-start", sm: "flex-end" }} direction={{ base: "column", sm: "row" }} gap={4} mt="-48px">
            <Avatar
              size="2xl"
              name={fullName}
              src={getAssetUrl(employee.user.profilePhotoUrl)}
              bg="brand.100"
              color="brand.700"
              border="5px solid white"
              boxShadow="elevated"
            />
            <Box pb={1}>
              <HStack flexWrap="wrap">
                <Text fontSize="xl" fontWeight="800" color="text.heading">{fullName}</Text>
                <Badge bg={employee.user.isActive ? "accent.50" : "red.50"} color={employee.user.isActive ? "accent.700" : "red.600"}>
                  {employee.user.isActive ? "Active" : "Inactive"}
                </Badge>
              </HStack>
              <Text fontSize="sm" color="text.muted" mt={1}>{employee.designation} · {employee.department}</Text>
            </Box>
          </Flex>
        </ModalHeader>
        <ModalBody px={{ base: 5, md: 7 }} pb={7}>
          <Text fontWeight="800" color="text.heading" mb={3}>Employee overview</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <DetailItem icon={<UserRound size={16} />} label="Employee ID" value={employee.user.empId} />
            <DetailItem icon={<Mail size={16} />} label="Work email" value={employee.user.email} />
            <DetailItem icon={<BriefcaseBusiness size={16} />} label="Employment type" value={employee.employmentType} />
            <DetailItem icon={<CalendarDays size={16} />} label="Date of joining" value={employee.dateOfJoining} />
            <DetailItem icon={<UserRound size={16} />} label="Reporting manager" value={employee.reportingManager} />
            <DetailItem icon={<CalendarDays size={16} />} label="Shift schedule" value={employee.shiftSchedule} />
          </SimpleGrid>

          <Divider my={5} />
          <Text fontWeight="800" color="text.heading" mb={3}>Access and location</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <DetailItem icon={<MapPin size={16} />} label="Office-only login" value={employee.user.officeLocationRequired ? "Enabled" : "Not required"} />
            <DetailItem icon={<CalendarDays size={16} />} label="Last login" value={employee.user.lastLoginAt ? new Date(employee.user.lastLoginAt).toLocaleString() : "Never logged in"} />
          </SimpleGrid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function EmployeeForm({
  mode,
  editRow,
  onDone,
  onCancel,
}: {
  mode: "add" | "edit";
  editRow?: EmployeeRow | null;
  onDone: (created?: { empId: string; generatedPassword: string }) => void;
  onCancel: () => void;
}) {
  const emp = editRow?.raw;
  const [form, setForm] = useState<AddEmployeeFormState>(emp ? {
    firstName: emp.user.firstName,
    lastName: emp.user.lastName,
    email: emp.user.email,
    department: emp.department,
    designation: emp.designation,
    employmentType: emp.employmentType,
    dateOfJoining: emp.dateOfJoining,
    reportingManager: emp.reportingManager,
    shiftSchedule: emp.shiftSchedule,
    allowLoginOnlyInsideOffice: emp.user.officeLocationRequired,
    officeLatitude: emp.user.officeLatitude != null ? String(emp.user.officeLatitude) : "",
    officeLongitude: emp.user.officeLongitude != null ? String(emp.user.officeLongitude) : "",
    officeRadiusMeters: emp.user.officeRadiusMeters != null ? String(emp.user.officeRadiusMeters) : "",
  } : { ...initialFormState });
  const [photo, setPhoto] = useState<File | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocuments>({
    "Government ID": null,
    "Offer Letter": null,
    "Appointment Letter": null,
  });
  const [isActive, setIsActive] = useState(emp?.user.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const updateForm = (key: keyof AddEmployeeFormState, value: string | boolean) => setForm((old) => ({ ...old, [key]: value }));

  const uploadSelectedDocuments = async (userId: string) => {
    for (const [documentType, file] of Object.entries(documents)) {
      if (!file) continue;
      const formData = new FormData();
      formData.append("files", file);
      formData.append("documentType", documentType);
      await documentsApi.upload(userId, formData);
    }
  };

  const save = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.department || !form.designation || !form.dateOfJoining || !form.reportingManager || !form.shiftSchedule) {
      toast({ title: "Please complete all required fields", status: "warning" });
      return;
    }
    if (form.allowLoginOnlyInsideOffice && (!form.officeLatitude || !form.officeLongitude || !form.officeRadiusMeters)) {
      toast({ title: "Office coordinates and radius are required", status: "warning" });
      return;
    }

    setSaving(true);
    try {
      const location = form.allowLoginOnlyInsideOffice ? {
        officeLatitude: Number(form.officeLatitude),
        officeLongitude: Number(form.officeLongitude),
        officeRadiusMeters: Number(form.officeRadiusMeters),
      } : {};

      if (mode === "edit" && emp) {
        await employeeApi.update(emp.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          department: form.department,
          designation: form.designation,
          employmentType: form.employmentType,
          dateOfJoining: form.dateOfJoining,
          reportingManager: form.reportingManager,
          shiftSchedule: form.shiftSchedule,
          isActive,
          officeLocationRequired: form.allowLoginOnlyInsideOffice,
          ...(form.allowLoginOnlyInsideOffice ? location : { officeLatitude: null, officeLongitude: null, officeRadiusMeters: null }),
        });
        if (photo) await employeeApi.uploadPhoto(emp.id, photo);
        await uploadSelectedDocuments(emp.user.id);
        toast({ title: "Employee updated", status: "success" });
        onDone();
      } else {
        const result = await employeeApi.create({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          department: form.department,
          designation: form.designation,
          employmentType: form.employmentType,
          dateOfJoining: form.dateOfJoining,
          reportingManager: form.reportingManager,
          shiftSchedule: form.shiftSchedule,
          allowLoginOnlyInsideOffice: form.allowLoginOnlyInsideOffice,
          ...location,
        });
        if (photo) await employeeApi.uploadPhoto(result.profile.id, photo);
        await uploadSelectedDocuments(result.profile.userId);
        toast({ title: "Employee created", status: "success" });
        onDone({ empId: result.empId, generatedPassword: result.generatedPassword });
      }
    } catch (error: any) {
      toast({ title: "Could not save employee", description: error?.message, status: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontSize="lg" fontWeight="800" color="text.heading">{mode === "edit" ? `Edit ${editRow?.name}` : "Add new employee"}</Text>
          <Text fontSize="sm" color="text.muted">Add a clear headshot so the employee is easy to recognize.</Text>
        </Box>
        <SecondaryButton size="sm" onClick={onCancel}>Back to directory</SecondaryButton>
      </Flex>

      <SectionCard mb={4}>
        <PhotoPicker
          name={`${form.firstName} ${form.lastName}`.trim()}
          currentPhoto={getAssetUrl(emp?.user.profilePhotoUrl)}
          onChange={setPhoto}
        />
        <Divider my={6} />
        <Text fontWeight="800" color="text.heading" mb={4}>Basic information</Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Field label="First name" required><StyledInput value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} /></Field>
          <Field label="Last name" required><StyledInput value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} /></Field>
          <Field label="Work email" required><StyledInput type="email" value={form.email} isReadOnly={mode === "edit"} bg={mode === "edit" ? "surface.bg" : "white"} onChange={(e) => updateForm("email", e.target.value)} /></Field>
          <Field label="Department" required>
            <StyledSelect placeholder="Select department" value={form.department} onChange={(e) => updateForm("department", e.target.value)}>
              {["Developer", "Digital Marketing", "Human Resources", "Business Development", "Design", "Quality Assurance", "DevOps", "Finance"].map((item) => <option key={item} value={item}>{item}</option>)}
            </StyledSelect>
          </Field>
          <Field label="Designation" required><StyledInput value={form.designation} onChange={(e) => updateForm("designation", e.target.value)} /></Field>
          <Field label="Employment type" required>
            <StyledSelect value={form.employmentType} onChange={(e) => updateForm("employmentType", e.target.value)}><option value="Fresher">Fresher</option><option value="Experienced">Experienced</option></StyledSelect>
          </Field>
          <Field label="Date of joining" required><StyledInput type="date" value={form.dateOfJoining} onChange={(e) => updateForm("dateOfJoining", e.target.value)} /></Field>
          <Field label="Reporting manager" required><StyledInput value={form.reportingManager} onChange={(e) => updateForm("reportingManager", e.target.value)} /></Field>
          <Field label="Shift / work schedule" required>
            <StyledSelect placeholder="Select shift" value={form.shiftSchedule} onChange={(e) => updateForm("shiftSchedule", e.target.value)}><option value="General">General</option><option value="Night Shift">Night Shift</option><option value="Rotational">Rotational</option></StyledSelect>
          </Field>
        </SimpleGrid>
      </SectionCard>

      <SectionCard mb={4}>
        <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3} mb={1}>
          <Box>
            <Text fontWeight="800" color="text.heading">Employee documents</Text>
            <Text fontSize="sm" color="text.muted" mt={1}>Upload the employee&apos;s official onboarding documents. You can also add these later.</Text>
          </Box>
          <Badge bg="brand.50" color="brand.700">Optional</Badge>
        </Flex>
        <Text fontSize="xs" color="text.muted" mb={5}>Accepted formats: PDF, JPG, PNG, or WEBP · Maximum 5 MB each</Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {documentOptions.map((option) => (
            <DocumentPicker
              key={option.key}
              option={option}
              file={documents[option.key]}
              onChange={(file) => setDocuments((current) => ({ ...current, [option.key]: file }))}
            />
          ))}
        </SimpleGrid>
      </SectionCard>

      <SectionCard mb={4}>
        <Text fontWeight="800" color="text.heading" mb={4}>Login access</Text>
        {mode === "edit" && (
          <FormControl display="flex" alignItems="center" justifyContent="space-between" mb={4} p={4} bg="surface.bg" borderRadius="lg">
            <Box><FormLabel mb={0}>Account active</FormLabel><Text fontSize="xs" color="text.muted">Allow this employee to sign in</Text></Box>
            <Switch isChecked={isActive} onChange={(e) => setIsActive(e.target.checked)} colorScheme="brand" />
          </FormControl>
        )}
        <Checkbox isChecked={form.allowLoginOnlyInsideOffice} onChange={(e) => updateForm("allowLoginOnlyInsideOffice", e.target.checked)} colorScheme="brand">
          <Text fontSize="sm" fontWeight="700">Allow login only inside office</Text>
        </Checkbox>
        {form.allowLoginOnlyInsideOffice && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
            <Field label="Office latitude" required><StyledInput type="number" value={form.officeLatitude} onChange={(e) => updateForm("officeLatitude", e.target.value)} /></Field>
            <Field label="Office longitude" required><StyledInput type="number" value={form.officeLongitude} onChange={(e) => updateForm("officeLongitude", e.target.value)} /></Field>
            <Field label="Radius (meters)" required><StyledInput type="number" value={form.officeRadiusMeters} onChange={(e) => updateForm("officeRadiusMeters", e.target.value)} /></Field>
          </SimpleGrid>
        )}
      </SectionCard>

      <SectionCard>
        <Flex justify="flex-end" gap={3}><SecondaryButton onClick={onCancel}>Cancel</SecondaryButton><PrimaryButton onClick={save} isLoading={saving}>{mode === "edit" ? "Save changes" : "Create employee"}</PrimaryButton></Flex>
      </SectionCard>
    </Box>
  );
}

function EmployeeCard({ row, onView, onEdit }: { row: EmployeeRow; onView: () => void; onEdit: () => void }) {
  const employee = row.raw;
  return (
    <Box bg="white" border="1px solid" borderColor="surface.border" borderRadius="xl" overflow="hidden" boxShadow="card" transition="all .22s ease" _hover={{ transform: "translateY(-3px)", boxShadow: "card-hover", borderColor: "brand.200" }}>
      <Box h="4px" bgGradient="linear(to-r, brand.600, brand.400, accent.400)" />
      <Box p={5}>
        <Flex gap={3.5} align="flex-start">
          <Avatar size="lg" name={row.name} src={getAssetUrl(employee.user.profilePhotoUrl)} bg="brand.100" color="brand.700" border="3px solid" borderColor="brand.50" />
          <Box flex={1} minW={0}>
            <Text fontWeight="800" color="text.heading" noOfLines={1}>{row.name}</Text>
            <Text fontSize="sm" color="text.muted" noOfLines={1}>{row.designation}</Text>
            <HStack mt={2} spacing={2} flexWrap="wrap">
              <Badge bg={row.status === "Active" ? "accent.50" : "red.50"} color={row.status === "Active" ? "accent.700" : "red.600"}>{row.status}</Badge>
              <Badge variant="outline" borderColor="brand.200" color="brand.700">{row.department}</Badge>
            </HStack>
          </Box>
        </Flex>
        <VStack align="stretch" spacing={2.5} mt={5} color="text.body">
          <HStack><BriefcaseBusiness size={15} color="#708399" /><Text fontSize="sm"><Text as="span" color="text.muted">ID: </Text>{row.empId}</Text></HStack>
          <HStack><Mail size={15} color="#708399" /><Text fontSize="sm" noOfLines={1}>{row.email}</Text></HStack>
          <HStack><CalendarDays size={15} color="#708399" /><Text fontSize="sm"><Text as="span" color="text.muted">Joined: </Text>{row.joinDate}</Text></HStack>
        </VStack>
        <SimpleGrid columns={2} spacing={2.5} mt={5}>
          <PrimaryButton size="sm" leftIcon={<Eye size={15} />} onClick={onView}>View</PrimaryButton>
          <SecondaryButton size="sm" leftIcon={<Edit2 size={15} />} onClick={onEdit}>Edit</SecondaryButton>
        </SimpleGrid>
      </Box>
    </Box>
  );
}

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [sort, setSort] = useState("name");
  const [screen, setScreen] = useState<"list" | "add" | "edit" | "created">("list");
  const [editRow, setEditRow] = useState<EmployeeRow | null>(null);
  const [selected, setSelected] = useState<EmployeeFromAPI | null>(null);
  const [created, setCreated] = useState<{ empId: string; generatedPassword: string } | null>(null);
  const modal = useDisclosure();
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await employeeApi.list();
      setEmployees(result.data.map((employee) => ({
        profileId: employee.id,
        empId: employee.user.empId || employee.user.id.slice(0, 8),
        name: `${employee.user.firstName} ${employee.user.lastName}`,
        email: employee.user.email,
        department: employee.department,
        designation: employee.designation,
        status: employee.user.isActive ? "Active" : "Inactive",
        joinDate: employee.dateOfJoining,
        raw: employee,
      })));
    } catch (error: any) {
      toast({ title: "Could not load employees", description: error?.message, status: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const departments = useMemo(() => Array.from(new Set(employees.map((item) => item.department))).sort(), [employees]);
  const visible = useMemo(() => employees
    .filter((item) => {
      const query = search.trim().toLowerCase();
      return (!query || [item.name, item.email, item.empId].some((value) => value.toLowerCase().includes(query))) && (!department || item.department === department);
    })
    .sort((a, b) => sort === "joined" ? b.joinDate.localeCompare(a.joinDate) : a.name.localeCompare(b.name)), [employees, search, department, sort]);

  const done = (result?: { empId: string; generatedPassword: string }) => {
    setEditRow(null);
    if (result) { setCreated(result); setScreen("created"); }
    else setScreen("list");
    load();
  };

  if (screen === "add" || (screen === "edit" && editRow)) {
    return <Box><PageHeader title={screen === "add" ? "Add employee" : "Edit employee"} subtitle="Employee account, photo, employment, and access details." /><EmployeeForm mode={screen} editRow={editRow} onDone={done} onCancel={() => { setEditRow(null); setScreen("list"); }} /></Box>;
  }

  if (screen === "created" && created) {
    return (
      <Box><PageHeader title="Employee created" subtitle="The new employee is ready to use Connect HR." />
        <SectionCard><Alert status="success" borderRadius="xl" variant="subtle" flexDirection="column" textAlign="center" py={9}><AlertIcon boxSize="40px" mr={0} /><AlertTitle mt={4}>Account created successfully</AlertTitle><AlertDescription mt={2}><Text mb={3}>Credentials were sent by email and can also be shared manually.</Text><Box bg="white" p={4} borderRadius="lg" textAlign="left"><Text><strong>Employee ID:</strong> <Code>{created.empId}</Code></Text><Text mt={1}><strong>Password:</strong> <Code>{created.generatedPassword}</Code></Text></Box></AlertDescription></Alert><Flex justify="center" gap={3} mt={6}><PrimaryButton onClick={() => { setCreated(null); setScreen("add"); }}>Add another</PrimaryButton><SecondaryButton onClick={() => { setCreated(null); setScreen("list"); }}>View directory</SecondaryButton></Flex></SectionCard>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Employee directory" subtitle="Find, view, and manage everyone in your organization." actions={<PrimaryButton leftIcon={<Plus size={16} />} onClick={() => setScreen("add")}>Add employee</PrimaryButton>} />
      <SectionCard>
        <Flex gap={3} direction={{ base: "column", lg: "row" }} justify="space-between" mb={6}>
          <InputGroup flex={1} maxW={{ lg: "560px" }}><InputLeftElement><Search size={17} color="#708399" /></InputLeftElement><Input placeholder="Search employees by name, ID, or email..." value={search} onChange={(e) => setSearch(e.target.value)} /></InputGroup>
          <HStack spacing={3} align="stretch">
            <Select value={department} onChange={(e) => setDepartment(e.target.value)} minW="180px"><option value="">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} minW="145px"><option value="name">Name A–Z</option><option value="joined">Newest joined</option></Select>
          </HStack>
        </Flex>
        <Flex justify="space-between" mb={4}><Text fontWeight="800" color="text.heading">Team members</Text><Text fontSize="sm" color="text.muted">{visible.length} employee{visible.length === 1 ? "" : "s"}</Text></Flex>
        {loading ? <Center py={16}><Spinner color="brand.500" size="lg" /></Center> : visible.length === 0 ? <Center py={16} flexDirection="column"><UserRound size={32} color="#708399" /><Text mt={3} color="text.muted">No employees match your search.</Text></Center> : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>{visible.map((row) => <EmployeeCard key={row.profileId} row={row} onView={() => { setSelected(row.raw); modal.onOpen(); }} onEdit={() => { setEditRow(row); setScreen("edit"); }} />)}</SimpleGrid>
        )}
      </SectionCard>
      <EmployeeDetailsModal isOpen={modal.isOpen} onClose={modal.onClose} employee={selected} />
    </Box>
  );
}
