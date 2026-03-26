import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();

    // Create organization invitation
    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role: role === "admin" ? "org:admin" : "org:member",
      inviterUserId: userId,
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.emailAddress,
        status: invitation.status,
      },
    });
  } catch (error) {
    console.error("Error creating invitation:", error);

    // Handle specific Clerk errors
    if (error instanceof Error) {
      if (error.message.includes("already a member")) {
        return NextResponse.json(
          { error: "This person is already a member of the organization" },
          { status: 400 }
        );
      }
      if (error.message.includes("pending invitation")) {
        return NextResponse.json(
          { error: "An invitation has already been sent to this email" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
