"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment, updateComment } from "@/server/actions/comment";

interface CommentFormProps {
  issueId: string;
  commentId?: string;
  initialContent?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
}

export function CommentForm({
  issueId,
  commentId,
  initialContent = "",
  onSuccess,
  onCancel,
  mode = "create",
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      let result;
      if (mode === "edit" && commentId) {
        result = await updateComment(commentId, { content });
      } else {
        result = await createComment({ content, issueId });
      }

      if (result.error) {
        console.error(result.error);
        return;
      }

      setContent("");
      onSuccess?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        disabled={isPending}
        className="resize-none"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !content.trim()}
        >
          {isPending
            ? mode === "edit"
              ? "Saving..."
              : "Posting..."
            : mode === "edit"
              ? "Save"
              : "Comment"}
        </Button>
      </div>
    </form>
  );
}
