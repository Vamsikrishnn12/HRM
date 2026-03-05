"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Text,
  Heading,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Checkbox,
  Button,
  VStack,
} from "@chakra-ui/react";
import { Eye, EyeOff, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import AuthLoader from "@/components/ui/AuthLoader";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { login, isAuthenticated, user, authStatus } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Try to get the user's current coordinates.
   * Returns undefined if denied / unavailable — backend will decide
   * whether location is required for this account.
   */
  const getCoordinates = (): Promise<{ latitude: number; longitude: number } | undefined> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(undefined);
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve(undefined),
        { enableHighAccuracy: true, timeout: 5000 },
      );
    });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setLocationError(null);

    const coords = await getCoordinates();

    const loggedInUser = await login({
      email: data.email,
      password: data.password,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });

    if (loggedInUser) {
      // Small delay so user sees the "Preparing your dashboard..." transition
      setTimeout(() => {
        router.push(loggedInUser.role === "admin" ? "/admin/dashboard" : "/employee/dashboard");
      }, 1500);
    } else {
      setIsSubmitting(false);
    }
  };

  // Show auth transition screen during checking/redirecting
  if (authStatus === "checking" || authStatus === "redirecting") {
    return <AuthLoader status={authStatus} />;
  }

  return (
    <Flex minH="100vh">
      {/* Left brand panel */}
      <Flex
        display={{ base: "none", lg: "flex" }}
        w="45%"
        bgGradient="linear(135deg, #8B5CF6 0%, #6D28D9 50%, #5B21B6 100%)"
        direction="column"
        justify="center"
        align="center"
        px={12}
        position="relative"
        overflow="hidden"
      >
        {/* Decorative circles */}
        <Box
          position="absolute"
          w="300px"
          h="300px"
          borderRadius="full"
          bg="whiteAlpha.100"
          top="-50px"
          right="-80px"
        />
        <Box
          position="absolute"
          w="200px"
          h="200px"
          borderRadius="full"
          bg="whiteAlpha.50"
          bottom="80px"
          left="-60px"
        />
        <Box
          position="absolute"
          w="150px"
          h="150px"
          borderRadius="full"
          bg="whiteAlpha.50"
          top="30%"
          left="10%"
        />

        {/* Logo placeholder */}
        <Flex
          w={20}
          h={20}
          borderRadius="2xl"
          bg="whiteAlpha.200"
          align="center"
          justify="center"
          mb={8}
          backdropFilter="blur(10px)"
        >
          <Text fontSize="2xl" fontWeight="800" color="white">
            HR
          </Text>
        </Flex>

        <Heading
          size="xl"
          color="white"
          textAlign="center"
          mb={4}
          fontWeight="700"
          lineHeight="1.3"
        >
          Human Resource
          <br />
          Management System
        </Heading>
        <Text
          color="whiteAlpha.800"
          textAlign="center"
          fontSize="md"
          maxW="380px"
          lineHeight="1.7"
        >
          Streamline your workforce management with our comprehensive HRMS
          platform. Track attendance, manage leaves, process payroll — all in one
          place.
        </Text>
      </Flex>

      {/* Right login form */}
      <Flex
        flex={1}
        align="center"
        justify="center"
        bg="white"
        px={{ base: 6, md: 12 }}
      >
        <Box w="100%" maxW="440px">
          <Heading size="lg" color="text.heading" mb={2}>
            Welcome back
          </Heading>
          <Text color="text.muted" mb={8} fontSize="sm">
            Sign in to your account to continue
          </Text>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.email}>
                <FormLabel fontSize="sm" color="text.heading" fontWeight="600">
                  Email Address
                </FormLabel>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Enter your email"
                  size="lg"
                  borderRadius="lg"
                  bg="white"
                  border="1px solid"
                  borderColor="surface.border"
                  _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px #8B5CF6" }}
                  fontSize="sm"
                />
                <FormErrorMessage fontSize="xs">{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel fontSize="sm" color="text.heading" fontWeight="600">
                  Password
                </FormLabel>
                <Box position="relative">
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    size="lg"
                    borderRadius="lg"
                    bg="white"
                    border="1px solid"
                    borderColor="surface.border"
                    _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px #8B5CF6" }}
                    fontSize="sm"
                    pr={12}
                  />
                  <Button
                    position="absolute"
                    right={1}
                    top="50%"
                    transform="translateY(-50%)"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    color="text.muted"
                    zIndex={2}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </Box>
                <FormErrorMessage fontSize="xs">{errors.password?.message}</FormErrorMessage>
              </FormControl>

              {/* <Flex justify="space-between" align="center">
                <Checkbox size="sm" colorScheme="purple">
                  <Text fontSize="sm" color="text.muted">
                    Remember me
                  </Text>
                </Checkbox>
                <Text
                  fontSize="sm"
                  color="brand.400"
                  fontWeight="600"
                  cursor="pointer"
                  _hover={{ color: "brand.500" }}
                >
                  Forgot password?
                </Text>
              </Flex> */}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                w="100%"
                borderRadius="lg"
                fontSize="sm"
                fontWeight="600"
                isLoading={isSubmitting}
                loadingText="Signing in..."
                mt={2}
              >
                Sign In
              </Button>
            </VStack>
          </form>

         

      
        </Box>
      </Flex>
    </Flex>
  );
}
