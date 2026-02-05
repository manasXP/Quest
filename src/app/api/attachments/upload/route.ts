import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_FILE_SIZE, isAllowedFileType } from "@/lib/upload";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const issueId = formData.get("issueId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!issueId) {
    return NextResponse.json({ error: "Issue ID is required" }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 10MB limit" },
      { status: 400 }
    );
  }

  // Validate file type
  if (!isAllowedFileType(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 400 }
    );
  }

  // Check if issue exists and user has access
  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId: session.user.id },
              },
            },
          },
        },
      },
    },
  });

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const hasAccess =
    issue.project.workspace.ownerId === session.user.id ||
    issue.project.workspace.members.length > 0;

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You don't have access to this issue" },
      { status: 403 }
    );
  }

  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPath = `attachments/${issueId}/${timestamp}-${sanitizedFilename}`;

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: "public",
    });

    // Create attachment record in database
    const attachment = await db.attachment.create({
      data: {
        filename: file.name,
        url: blob.url,
        size: file.size,
        mimeType: file.type,
        issueId,
        uploaderId: session.user.id,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ data: attachment }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}
