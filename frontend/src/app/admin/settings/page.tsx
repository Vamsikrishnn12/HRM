"use client";

import {
  Box,
  Flex,
  Text,
  Input,
  FormControl,
  FormLabel,
  Switch,
  SimpleGrid,
  Divider,
  Select,
} from "@chakra-ui/react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { PrimaryButton } from "@/components/ui/Buttons";

export default function SettingsPage() {
  return (
    <Box>
      <PageHeader title="Settings" subtitle="Manage your application preferences" />

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        {/* Company Info */}
        <SectionCard title="Company Information">
          <Flex direction="column" gap={4}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="text.heading">
                Company Name
              </FormLabel>
              <Input
                defaultValue="HRMS Corp"
                size="sm"
                borderRadius="lg"
                bg="surface.bg"
                border="1px solid"
                borderColor="surface.border"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="text.heading">
                Company Email
              </FormLabel>
              <Input
                defaultValue="contact@hrms.com"
                size="sm"
                borderRadius="lg"
                bg="surface.bg"
                border="1px solid"
                borderColor="surface.border"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="text.heading">
                Timezone
              </FormLabel>
              <Select
                defaultValue="UTC+5:30"
                size="sm"
                borderRadius="lg"
                bg="surface.bg"
                border="1px solid"
                borderColor="surface.border"
              >
                <option value="UTC+0">UTC+0 (London)</option>
                <option value="UTC+5:30">UTC+5:30 (Mumbai)</option>
                <option value="UTC-5">UTC-5 (New York)</option>
                <option value="UTC-8">UTC-8 (Los Angeles)</option>
              </Select>
            </FormControl>
            <PrimaryButton size="sm" alignSelf="flex-start" mt={2}>
              Save Changes
            </PrimaryButton>
          </Flex>
        </SectionCard>

        {/* Notifications */}
        <SectionCard title="Notification Preferences">
          <Flex direction="column" gap={5}>
            {[
              { label: "Email Notifications", desc: "Receive email alerts for important updates", defaultChecked: true },
              { label: "Leave Request Alerts", desc: "Get notified when new leave requests are submitted", defaultChecked: true },
              { label: "Payroll Reminders", desc: "Reminder before payroll processing date", defaultChecked: false },
              { label: "Attendance Alerts", desc: "Daily attendance summary notifications", defaultChecked: true },
              { label: "System Updates", desc: "Notifications about system maintenance and updates", defaultChecked: false },
            ].map((item) => (
              <Flex key={item.label} justify="space-between" align="center">
                <Box>
                  <Text fontSize="sm" fontWeight="600" color="text.heading">
                    {item.label}
                  </Text>
                  <Text fontSize="xs" color="text.muted">
                    {item.desc}
                  </Text>
                </Box>
                <Switch
                  colorScheme="blue"
                  defaultChecked={item.defaultChecked}
                  size="md"
                />
              </Flex>
            ))}
          </Flex>
        </SectionCard>

        {/* Security */}
        <SectionCard title="Security Settings">
          <Flex direction="column" gap={4}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="text.heading">
                Session Timeout (minutes)
              </FormLabel>
              <Input
                type="number"
                defaultValue="30"
                size="sm"
                borderRadius="lg"
                bg="surface.bg"
                border="1px solid"
                borderColor="surface.border"
                maxW="120px"
              />
            </FormControl>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" fontWeight="600" color="text.heading">
                  Two-Factor Authentication
                </Text>
                <Text fontSize="xs" color="text.muted">
                  Add an extra layer of security
                </Text>
              </Box>
              <Switch colorScheme="blue" size="md" />
            </Flex>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="sm" fontWeight="600" color="text.heading">
                  IP Whitelisting
                </Text>
                <Text fontSize="xs" color="text.muted">
                  Restrict access to specific IP addresses
                </Text>
              </Box>
              <Switch colorScheme="blue" size="md" />
            </Flex>
          </Flex>
        </SectionCard>

        {/* Working Hours */}
        <SectionCard title="Working Hours">
          <Flex direction="column" gap={4}>
            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="text.heading">
                  Start Time
                </FormLabel>
                <Input
                  type="time"
                  defaultValue="09:00"
                  size="sm"
                  borderRadius="lg"
                  bg="surface.bg"
                  border="1px solid"
                  borderColor="surface.border"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="text.heading">
                  End Time
                </FormLabel>
                <Input
                  type="time"
                  defaultValue="18:00"
                  size="sm"
                  borderRadius="lg"
                  bg="surface.bg"
                  border="1px solid"
                  borderColor="surface.border"
                />
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="600" color="text.heading">
                Late Threshold (minutes)
              </FormLabel>
              <Input
                type="number"
                defaultValue="15"
                size="sm"
                borderRadius="lg"
                bg="surface.bg"
                border="1px solid"
                borderColor="surface.border"
                maxW="120px"
              />
            </FormControl>
            <PrimaryButton size="sm" alignSelf="flex-start" mt={2}>
              Update
            </PrimaryButton>
          </Flex>
        </SectionCard>
      </SimpleGrid>
    </Box>
  );
}
