"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import { getCommentsByIssue } from "@/server/actions/comment";
import type { CommentWithAuthor } from "@/types";

interface CommentListProps {
  issueId: string;
  currentUserId: string;
}

export function CommentList({ issueId, currentUserId }: CommentListProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const data = await getCommentsByIssue(issueId);
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleUpdate = () => {
    fetchComments();
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CommentForm issueId={issueId} onSuccess={handleUpdate} />

      {comments.length === 0 ? (
        <div className="py-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              issueId={issueId}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
