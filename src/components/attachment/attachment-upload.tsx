"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Camera, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MAX_FILE_SIZE, isAllowedFileType, formatFileSize } from "@/lib/upload";
import { pickImage, takePhoto, pickedFileToBlob } from "@/components/mobile/file-picker";

interface AttachmentUploadProps {
  issueId: string;
  onSuccess: () => void;
}

export function AttachmentUpload({ issueId, onSuccess }: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const handleClick = () => {
    inputRef.current?.click();
  };

  const uploadFile = async (file: File | Blob, filename: string) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file, filename);
      formData.append("issueId", issueId);

      const response = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      toast.success("File uploaded successfully");
      onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    // Client-side validation
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
      return;
    }

    if (!isAllowedFileType(file.type)) {
      toast.error("File type not allowed");
      return;
    }

    await uploadFile(file, file.name);
  };

  const handleNativeImagePick = async () => {
    const picked = await pickImage();
    if (!picked) return;

    const blob = await pickedFileToBlob(picked);
    if (!blob) {
      toast.error("Failed to process image");
      return;
    }

    if (blob.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
      return;
    }

    await uploadFile(blob, picked.name);
  };

  const handleNativeCamera = async () => {
    const photo = await takePhoto();
    if (!photo) return;

    const blob = await pickedFileToBlob(photo);
    if (!blob) {
      toast.error("Failed to process photo");
      return;
    }

    if (blob.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
      return;
    }

    await uploadFile(blob, photo.name);
  };

  // Native platform - show dropdown with camera/gallery options
  if (isNative) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleNativeCamera}>
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNativeImagePick}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Choose from Gallery
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Web platform - use standard file input
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.zip,.rar,.gz"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </>
        )}
      </Button>
    </>
  );
}
