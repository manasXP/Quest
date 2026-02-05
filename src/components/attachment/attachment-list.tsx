"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { AttachmentUpload } from "./attachment-upload";
import { AttachmentItem } from "./attachment-item";
import { getAttachmentsByIssue } from "@/server/actions/attachment";
import type { AttachmentWithUploader } from "@/types";

interface AttachmentListProps {
  issueId: string;
  currentUserId: string;
}

export function AttachmentList({ issueId, currentUserId }: AttachmentListProps) {
  const router = useRouter();
  const [attachments, setAttachments] = useState<AttachmentWithUploader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttachments = useCallback(async () => {
    try {
      const data = await getAttachmentsByIssue(issueId);
      setAttachments(data);
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUpdate = () => {
    fetchAttachments();
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Loading attachments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AttachmentUpload issueId={issueId} onSuccess={handleUpdate} />

      {attachments.length === 0 ? (
        <div className="py-8 text-center">
          <Paperclip className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No attachments yet. Upload a file to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              currentUserId={currentUserId}
              onDelete={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
