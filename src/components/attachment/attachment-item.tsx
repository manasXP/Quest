"use client";

import { useState, useTransition } from "react";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatFileSize, isImageMimeType } from "@/lib/upload";
import { deleteAttachment } from "@/server/actions/attachment";
import type { AttachmentWithUploader } from "@/types";

interface AttachmentItemProps {
  attachment: AttachmentWithUploader;
  currentUserId: string;
  onDelete: () => void;
}

function getFileIcon(mimeType: string) {
  if (isImageMimeType(mimeType)) {
    return FileImage;
  }
  if (mimeType === "application/pdf") {
    return FileText;
  }
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  ) {
    return FileSpreadsheet;
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("gzip")
  ) {
    return FileArchive;
  }
  return File;
}

export function AttachmentItem({
  attachment,
  currentUserId,
  onDelete,
}: AttachmentItemProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const FileIcon = getFileIcon(attachment.mimeType);
  const isImage = isImageMimeType(attachment.mimeType);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAttachment(attachment.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Attachment deleted");
        onDelete();
      }
      setShowDeleteDialog(false);
    });
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Thumbnail or Icon */}
      <div className="flex-shrink-0">
        {isImage ? (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src={attachment.url}
              alt={attachment.filename}
              className="h-12 w-12 object-cover rounded border"
            />
          </a>
        ) : (
          <div className="h-12 w-12 flex items-center justify-center rounded border bg-muted">
            <FileIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-medium text-sm hover:underline truncate"
          title={attachment.filename}
        >
          {attachment.filename}
        </a>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{formatFileSize(attachment.size)}</span>
          <span>-</span>
          <div className="flex items-center gap-1">
            <Avatar className="h-4 w-4">
              <AvatarImage src={attachment.uploader.image || undefined} />
              <AvatarFallback className="text-[8px]">
                {attachment.uploader.name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span>{attachment.uploader.name || attachment.uploader.email}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a
            href={attachment.url}
            download={attachment.filename}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </a>
        </Button>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{attachment.filename}&quot;. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
