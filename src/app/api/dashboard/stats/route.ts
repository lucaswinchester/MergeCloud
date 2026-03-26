import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDashboardStats, refreshDashboardStats } from "@/server/services/dashboardCache";

export async function GET(request: Request) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized - No organization found" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const stats = forceRefresh
      ? await refreshDashboardStats(orgId)
      : await getDashboardStats(orgId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized - No organization found" },
        { status: 401 }
      );
    }

    // Force refresh the dashboard stats
    const stats = await refreshDashboardStats(orgId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error refreshing dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to refresh dashboard stats" },
      { status: 500 }
    );
  }
}
