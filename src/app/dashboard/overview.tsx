"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TabsContent,
} from "@/components/ui/tabs";
import { Overview } from "@/components/charts/overview";
import { HighestDataUsers } from "@/components/charts/highest-data-users";
import { Loader2, Server, WifiIcon, TrendingUp, Database, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaggerContainer, StaggerItem, SlideUp } from "@/components/ui/page-transition";

interface DashboardStats {
  totalDevices: number;
  devicesActive: number;
  devicesOnline: number;
  devicesOverData: number;
  totalDataUsage: number;
  monthlyActivations: MonthlyData[];
  topDataUsers: TopDataUser[];
  lastCalculatedAt: string;
  isCached: boolean;
}

interface MonthlyData {
  name: string;
  total: number;
}

interface TopDataUser {
  uuid: string;
  label: string;
  serialNo: string;
  usedData: number;
}

export interface DashboardRef {
  reload: () => void;
}

async function fetchDashboardStats(forceRefresh = false): Promise<DashboardStats> {
  const url = forceRefresh ? "/api/dashboard/stats?refresh=true" : "/api/dashboard/stats";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }
  return response.json();
}

export const Dashboard = forwardRef<DashboardRef>((props, ref) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = React.useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await fetchDashboardStats(forceRefresh);
      setStats(data);
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useImperativeHandle(ref, () => ({
    reload: () => loadStats(true),
  }));

  const handleRefresh = () => {
    loadStats(true);
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <TabsContent value="Overview" className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </TabsContent>
    );
  }

  if (error) {
    return (
      <TabsContent value="Overview" className="space-y-4">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => loadStats()} variant="outline">
            Try Again
          </Button>
        </div>
      </TabsContent>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <TabsContent value="Overview" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Last updated: {formatLastUpdated(stats.lastCalculatedAt)}
            {stats.isCached && " (cached)"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <Card className="hover-lift transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Devices
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDevices}</div>
              <p className="text-xs text-muted-foreground">
                All devices in inventory
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="hover-lift transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Devices Active
              </CardTitle>
              <WifiIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.devicesActive}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalDevices > 0
                  ? `${((stats.devicesActive / stats.totalDevices) * 100).toFixed(1)}% of total`
                  : 'No devices'}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="hover-lift transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices Online</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.devicesOnline}</div>
              <p className="text-xs text-muted-foreground">
                {stats.devicesActive > 0
                  ? `${((stats.devicesOnline / stats.devicesActive) * 100).toFixed(1)}% of active`
                  : 'No active devices'}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="hover-lift transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Over Data Usage
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.devicesOverData}</div>
              <p className="text-xs text-muted-foreground">
                Devices exceeding limits
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
      <SlideUp delay={0.2} className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 hover-lift transition-all duration-200">
          <CardHeader>
            <CardTitle>Devices Active by Month</CardTitle>
            <CardDescription>
              Active device count for the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={stats.monthlyActivations} />
          </CardContent>
        </Card>
        <Card className="col-span-3 hover-lift transition-all duration-200">
          <CardHeader>
            <CardTitle>Highest Data Users</CardTitle>
            <CardDescription>
              Top 5 devices by data usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HighestDataUsers topUsers={stats.topDataUsers} />
          </CardContent>
        </Card>
      </SlideUp>
    </TabsContent>
  );
});

Dashboard.displayName = "Dashboard";
