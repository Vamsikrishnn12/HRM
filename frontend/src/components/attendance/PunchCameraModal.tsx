"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { Camera, RotateCcw } from "lucide-react";

interface PunchCameraModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (photo: File) => Promise<void> | void;
}

export default function PunchCameraModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onConfirm,
}: PunchCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setPhoto(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera is not supported");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Camera access is required. Allow camera permission in your browser and try again.");
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) void startCamera();
    else stopCamera();
    return stopCamera;
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const captured = new File([blob], `punch-in-${Date.now()}.jpg`, { type: "image/jpeg" });
        setPhoto(captured);
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(captured);
        });
        stopCamera();
      },
      "image/jpeg",
      0.82,
    );
  };

  const close = () => {
    if (isSubmitting) return;
    stopCamera();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} isCentered size="lg" closeOnOverlayClick={!isSubmitting}>
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader fontSize="md">Take punch-in photo</ModalHeader>
        <ModalCloseButton isDisabled={isSubmitting} />
        <ModalBody>
          <Text fontSize="sm" color="text.muted" mb={3}>
            Face the camera clearly. Your photo will be saved with this punch for attendance verification.
          </Text>
          {cameraError ? (
            <Alert status="error" borderRadius="lg"><AlertIcon />{cameraError}</Alert>
          ) : (
            <Box bg="black" borderRadius="xl" overflow="hidden" aspectRatio={4 / 3}>
              {previewUrl ? (
                <Image src={previewUrl} alt="Captured punch-in photo" w="full" h="full" objectFit="cover" />
              ) : (
                <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              )}
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <HStack w="full" justify="space-between">
            <Button variant="ghost" onClick={close} isDisabled={isSubmitting}>Cancel</Button>
            {photo ? (
              <HStack>
                <Button leftIcon={<RotateCcw size={16} />} variant="outline" onClick={() => void startCamera()} isDisabled={isSubmitting}>Retake</Button>
                <Button colorScheme="blue" onClick={() => onConfirm(photo)} isLoading={isSubmitting}>Use photo &amp; punch in</Button>
              </HStack>
            ) : (
              <Button leftIcon={<Camera size={16} />} colorScheme="blue" onClick={takePhoto} isDisabled={Boolean(cameraError)}>Take photo</Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
