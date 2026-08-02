"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge, Box, Button, Flex, FormControl, FormLabel, Input, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select,
  Spinner, Table, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast,
} from "@chakra-ui/react";
import { KeyRound, Plus, ShieldCheck, UserX } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { employeeApi, hrAccessApi, type HrAccessRecord } from "@/api";
import { useAuth } from "@/context/AuthContext";
import type { EmployeeFromAPI } from "@/types";

const makePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => chars[value % chars.length]).join("");
};

export default function AdministrationPage() {
  const { user } = useAuth();
  const toast = useToast();
  const modal = useDisclosure();
  const [records, setRecords] = useState<HrAccessRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employeeId: "", loginEmail: "", password: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [access, employeeResult] = await Promise.all([hrAccessApi.list(), employeeApi.list()]);
      setRecords(access);
      setEmployees(employeeResult.data.filter((item) => item.user.isActive && item.employmentStatus === "ACTIVE"));
    } catch (error: any) {
      toast({ title: "Unable to load portal access", description: error?.message, status: "error", position: "top-right" });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.role === "admin") void load(); }, [user?.role]);

  const activeCount = useMemo(() => records.filter((item) => item.isActive).length, [records]);
  const chooseEmployee = (employeeId: string) => {
    const selected = employees.find((item) => item.user.id === employeeId);
    setForm({ employeeId, loginEmail: selected?.user.email || "", password: makePassword() });
  };

  const grant = async () => {
    if (!form.employeeId || !form.loginEmail || form.password.length < 8) {
      toast({ title: "Complete all fields", description: "Password must have at least 8 characters.", status: "warning", position: "top-right" });
      return;
    }
    setSaving(true);
    try {
      const result = await hrAccessApi.grant(form);
      toast({
        title: "HR portal access granted",
        description: result.emailSent ? "Login details were emailed to the employee." : `Access was saved, but email failed: ${result.emailError}`,
        status: result.emailSent ? "success" : "warning", duration: 6000, isClosable: true, position: "top-right",
      });
      modal.onClose();
      setForm({ employeeId: "", loginEmail: "", password: "" });
      await load();
    } catch (error: any) {
      toast({ title: "Access could not be granted", description: error?.message, status: "error", position: "top-right" });
    } finally { setSaving(false); }
  };

  const revoke = async (record: HrAccessRecord) => {
    if (!window.confirm(`Remove HR portal access for ${record.employee.firstName} ${record.employee.lastName}?`)) return;
    try {
      await hrAccessApi.revoke(record.id);
      toast({ title: "HR access revoked", description: "Existing HR sessions are no longer valid.", status: "success", position: "top-right" });
      await load();
    } catch (error: any) {
      toast({ title: "Access could not be revoked", description: error?.message, status: "error", position: "top-right" });
    }
  };

  if (user?.role !== "admin") return <Text>You do not have permission to manage HR portal access.</Text>;

  return (
    <Box>
      <PageHeader title="Administration" subtitle="Main administrator only: grant, review, and revoke HR portal access." actions={
        <Button leftIcon={<Plus size={17} />} variant="primary" onClick={() => { setForm({ employeeId: "", loginEmail: "", password: makePassword() }); modal.onOpen(); }}>Grant HR Access</Button>
      } />
      <Flex gap={4} mb={6} flexWrap="wrap">
        <Flex bg="blue.50" color="blue.700" borderRadius="xl" p={4} align="center" gap={3}><ShieldCheck size={22} /><Box><Text fontWeight="800" fontSize="xl">{activeCount}</Text><Text fontSize="xs">Active HR users</Text></Box></Flex>
        <Flex bg="teal.50" color="teal.700" borderRadius="xl" p={4} align="center" gap={3}><KeyRound size={22} /><Text fontSize="sm" maxW="520px">Employees keep their normal Employee Login. HR Login uses separately issued credentials and can be revoked immediately.</Text></Flex>
      </Flex>
      <SectionCard>
        {loading ? <Flex justify="center" py={14}><Spinner /></Flex> : records.length === 0 ? (
          <Flex direction="column" align="center" py={14} color="text.muted"><ShieldCheck size={36} /><Text mt={3}>No HR portal access has been granted yet.</Text></Flex>
        ) : (
          <Box overflowX="auto"><Table size="sm">
            <Thead><Tr><Th>Employee</Th><Th>HR Login Email</Th><Th>Status</Th><Th>Granted</Th><Th>Last HR Login</Th><Th textAlign="right">Action</Th></Tr></Thead>
            <Tbody>{records.map((record) => <Tr key={record.id}>
              <Td><Text fontWeight="700">{record.employee.firstName} {record.employee.lastName}</Text><Text fontSize="xs" color="text.muted">{record.employee.empId || "—"} · {record.employee.email}</Text></Td>
              <Td>{record.loginEmail}</Td><Td><Badge colorScheme={record.isActive ? "green" : "red"}>{record.isActive ? "Active" : "Revoked"}</Badge></Td>
              <Td>{new Date(record.grantedAt).toLocaleDateString()}</Td><Td>{record.lastLoginAt ? new Date(record.lastLoginAt).toLocaleString() : "Never"}</Td>
              <Td textAlign="right">{record.isActive && <Button size="sm" colorScheme="red" variant="outline" leftIcon={<UserX size={15} />} onClick={() => void revoke(record)}>Revoke</Button>}</Td>
            </Tr>)}</Tbody>
          </Table></Box>
        )}
      </SectionCard>

      <Modal isOpen={modal.isOpen} onClose={modal.onClose} isCentered>
        <ModalOverlay /><ModalContent><ModalHeader>Grant HR Portal Access</ModalHeader><ModalCloseButton /><ModalBody>
          <FormControl isRequired mb={4}><FormLabel>Employee</FormLabel><Select placeholder="Select employee" value={form.employeeId} onChange={(e) => chooseEmployee(e.target.value)}>
            {employees.map((item) => <option key={item.user.id} value={item.user.id}>{item.user.firstName} {item.user.lastName} ({item.user.empId})</option>)}
          </Select></FormControl>
          <FormControl isRequired mb={4}><FormLabel>HR Login Email</FormLabel><Input type="email" value={form.loginEmail} onChange={(e) => setForm((old) => ({ ...old, loginEmail: e.target.value }))} /><Text fontSize="xs" mt={1} color="text.muted">Using the employee email allows both Employee Login and HR Login to appear for the same address.</Text></FormControl>
          <FormControl isRequired><FormLabel>HR Login Password</FormLabel><Flex gap={2}><Input value={form.password} onChange={(e) => setForm((old) => ({ ...old, password: e.target.value }))} /><Button variant="outline" onClick={() => setForm((old) => ({ ...old, password: makePassword() }))}>Generate</Button></Flex></FormControl>
        </ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={modal.onClose}>Cancel</Button><Button variant="primary" isLoading={saving} onClick={() => void grant()}>Grant & Send Email</Button></ModalFooter></ModalContent>
      </Modal>
    </Box>
  );
}
