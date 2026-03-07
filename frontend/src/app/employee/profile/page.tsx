"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  Heading,
  Spinner,
  Input,
  Button,
  VStack,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  Avatar,
  Badge,
  Divider,
} from "@chakra-ui/react";
import {
  User,
  Briefcase,
  Phone,
  MapPin,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Heart,
  Globe,
} from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import PageHeader from "@/components/ui/PageHeader";
import { profileApi, type ProfileData } from "@/api/profile.api";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" mb={0.5}>
        {label}
      </Text>
      <Text fontSize="sm" color="text.heading" fontWeight="500">
        {value || "—"}
      </Text>
    </Box>
  );
}

export default function EmployeeProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    profileApi
      .getMe()
      .then(setProfile)
      .catch(() =>
        toast({
          title: "Failed to load profile",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        }),
      )
      .finally(() => setLoading(false));
  }, [toast]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "All password fields are required", status: "warning", duration: 3000, isClosable: true, position: "top-right" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "New password and confirm password do not match", status: "warning", duration: 3000, isClosable: true, position: "top-right" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", status: "warning", duration: 3000, isClosable: true, position: "top-right" });
      return;
    }
    setChangingPassword(true);
    try {
      await profileApi.changePassword({ currentPassword, newPassword, confirmPassword });
      toast({ title: "Password changed successfully", status: "success", duration: 3000, isClosable: true, position: "top-right" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Password change failed",
        description: err?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="brand.400" />
      </Flex>
    );
  }

  if (!profile) {
    return (
      <Box>
        <PageHeader title="Profile" subtitle="View your profile information" />
        <SectionCard>
          <Flex justify="center" py={12}>
            <Text color="text.muted">Unable to load profile data.</Text>
          </Flex>
        </SectionCard>
      </Box>
    );
  }

  const joinDate = profile.dateOfJoining
    ? new Date(profile.dateOfJoining + "T00:00:00").toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const dob = profile.dateOfBirth
    ? new Date(profile.dateOfBirth + "T00:00:00").toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const address = [
    profile.currentAddressLine1,
    profile.currentCity,
    profile.currentState,
    profile.currentPincode,
    profile.currentCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="View your profile information" />

      {/* Profile Header */}
      <SectionCard mb={6}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "center", md: "flex-start" }}
          gap={5}
        >
          <Avatar
            size="xl"
            name={profile.fullName}
            bg="brand.400"
            color="white"
            fontWeight="700"
          />
          <Box flex={1} textAlign={{ base: "center", md: "left" }}>
            <Heading size="md" color="text.heading" mb={1}>
              {profile.fullName}
            </Heading>
            <Text fontSize="sm" color="text.muted" mb={2}>
              {profile.designation} — {profile.department}
            </Text>
            <Flex
              gap={2}
              justify={{ base: "center", md: "flex-start" }}
              wrap="wrap"
            >
              <Badge
                px={3}
                py={1}
                borderRadius="full"
                bg={profile.isActive ? "#E6F9F0" : "#FEE7E7"}
                color={profile.isActive ? "#0D7C47" : "#C41E3A"}
                fontSize="xs"
                fontWeight="600"
              >
                {profile.isActive ? "Active" : "Inactive"}
              </Badge>
              {profile.empId && (
                <Badge
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg="brand.50"
                  color="brand.600"
                  fontSize="xs"
                  fontWeight="600"
                >
                  {profile.empId}
                </Badge>
              )}
            </Flex>
          </Box>
        </Flex>
      </SectionCard>

      {/* Work Information */}
      <SectionCard
        title="Work Information"
        mb={6}
        actions={
          <Flex align="center" gap={1.5} color="brand.400">
            <Briefcase size={14} />
          </Flex>
        }
      >
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
          <InfoItem label="Employee Code" value={profile.empId ?? "—"} />
          <InfoItem label="Email" value={profile.email} />
          <InfoItem label="Department" value={profile.department} />
          <InfoItem label="Designation" value={profile.designation} />
          <InfoItem label="Employment Type" value={profile.employmentType} />
          <InfoItem label="Date of Joining" value={joinDate} />
          <InfoItem label="Reporting Manager" value={profile.reportingManager} />
          <InfoItem label="Shift Schedule" value={profile.shiftSchedule} />
        </SimpleGrid>
      </SectionCard>

      {/* Personal Information */}
      <SectionCard
        title="Personal Information"
        mb={6}
        actions={
          <Flex align="center" gap={1.5} color="brand.400">
            <User size={14} />
          </Flex>
        }
      >
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
          <InfoItem label="First Name" value={profile.firstName} />
          <InfoItem label="Last Name" value={profile.lastName} />
          <InfoItem label="Date of Birth" value={dob} />
          <InfoItem label="Gender" value={profile.gender} />
          <InfoItem label="Nationality" value={profile.nationality} />
          <InfoItem label="Blood Group" value={profile.bloodGroup} />
          <InfoItem label="Marital Status" value={profile.maritalStatus} />
        </SimpleGrid>
      </SectionCard>

      {/* Contact Information */}
      <SectionCard
        title="Contact Information"
        mb={6}
        actions={
          <Flex align="center" gap={1.5} color="brand.400">
            <Phone size={14} />
          </Flex>
        }
      >
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
          <InfoItem label="Mobile Number" value={profile.mobileNumber} />
          <InfoItem label="WhatsApp Number" value={profile.whatsappNumber} />
          <InfoItem label="Current Address" value={address || "—"} />
        </SimpleGrid>
      </SectionCard>

      {/* Emergency Contact */}
      <SectionCard
        title="Emergency Contact"
        mb={6}
        actions={
          <Flex align="center" gap={1.5} color="brand.400">
            <Heart size={14} />
          </Flex>
        }
      >
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
          <InfoItem label="Contact Person" value={profile.emergencyContactPerson} />
          <InfoItem label="Contact Number" value={profile.emergencyContactNumber} />
          <InfoItem label="Relationship" value={profile.emergencyContactRelationship} />
        </SimpleGrid>
      </SectionCard>

      {/* Change Password */}
      <SectionCard
        title="Change Password"
        actions={
          <Flex align="center" gap={1.5} color="brand.400">
            <Lock size={14} />
          </Flex>
        }
      >
        <VStack spacing={4} align="stretch" maxW="400px">
          <Box>
            <Text fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" mb={1.5}>
              Current Password
            </Text>
            <InputGroup>
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                borderRadius="lg"
              />
              <InputRightElement>
                <IconButton
                  aria-label="Toggle visibility"
                  icon={showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCurrent(!showCurrent)}
                />
              </InputRightElement>
            </InputGroup>
          </Box>

          <Box>
            <Text fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" mb={1.5}>
              New Password
            </Text>
            <InputGroup>
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                borderRadius="lg"
              />
              <InputRightElement>
                <IconButton
                  aria-label="Toggle visibility"
                  icon={showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNew(!showNew)}
                />
              </InputRightElement>
            </InputGroup>
          </Box>

          <Box>
            <Text fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" mb={1.5}>
              Confirm New Password
            </Text>
            <InputGroup>
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                borderRadius="lg"
              />
              <InputRightElement>
                <IconButton
                  aria-label="Toggle visibility"
                  icon={showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirm(!showConfirm)}
                />
              </InputRightElement>
            </InputGroup>
          </Box>

          <Text fontSize="xs" color="text.muted">
            Password must be at least 8 characters with uppercase, lowercase, number, and special character.
          </Text>

          <Button
            bgGradient="linear(to-r, brand.400, brand.700)"
            color="white"
            _hover={{ bgGradient: "linear(to-r, brand.500, brand.800)" }}
            borderRadius="lg"
            isLoading={changingPassword}
            onClick={handleChangePassword}
            alignSelf="flex-start"
          >
            Update Password
          </Button>
        </VStack>
      </SectionCard>
    </Box>
  );
}
