"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import Image from "next/image";
import logoImage from "@/assets/logobg.png";

interface BrandMarkProps {
  showName?: boolean;
  logoSize?: string;
  nameColor?: string;
  nameFontSize?: string;
  nameFontWeight?: number | string;
  nameAccentColor?: string;
  gap?: number;
  logoBg?: string;
  logoBorderColor?: string;
  logoRadius?: string;
  logoShadow?: string;
  priority?: boolean;
}

export default function BrandMark({
  showName = true,
  logoSize = "36px",
  nameColor = "text.heading",
  nameFontSize = "lg",
  nameFontWeight = 800,
  nameAccentColor = "brand.500",
  gap = 2.5,
  logoBg = "white",
  logoBorderColor = "surface.border",
  logoRadius = "xl",
  logoShadow = "sm",
  priority = false,
}: BrandMarkProps) {
  return (
    <Flex align="center" gap={gap}>
      <Box
        w={logoSize}
        h={logoSize}
        borderRadius={logoRadius}
        overflow="hidden"
        bg={logoBg}
        border="1px solid"
        borderColor={logoBorderColor}
        shadow={logoShadow}
        flexShrink={0}
        position="relative"
      >
        <Image
          src={logoImage}
          alt="Connect HR logo"
          fill
          sizes={logoSize}
          style={{ objectFit: "contain" }}
          priority={priority}
        />
      </Box>
      {showName && (
        <Text fontSize={nameFontSize} fontWeight={nameFontWeight} color={nameColor} letterSpacing="-0.035em">
          Connect <Text as="span" color={nameAccentColor}>HR</Text>
        </Text>
      )}
    </Flex>
  );
}
