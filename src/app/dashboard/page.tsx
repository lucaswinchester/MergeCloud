"use client";

import { useRef } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { RefreshCw } from "lucide-react";
import { Wholesale } from "@/app/dashboard/wholesale";
import { Retail } from "@/app/dashboard/retail"
import { Dashboard, DashboardRef } from "@/app/dashboard/overview";

export default function Page() {
  const dashboardRef = useRef<DashboardRef>(null);

  const handleReload = () => {
    dashboardRef.current?.reload();
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="hidden flex-col md:flex">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          </div>
          <Tabs defaultValue="Overview" className="space-y-4">
            <div className="flex items-center justify-between space-y-2">
              <TabsList>
              <TabsTrigger value="Overview">Overview
                </TabsTrigger>
                <TabsTrigger value="Retail">Retail
                </TabsTrigger>
                <TabsTrigger value="Wholesale">
                  Wholesale
                </TabsTrigger>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <TabsTrigger value="Affiliate" disabled>
                        Affiliate
                      </TabsTrigger>
                      <TooltipContent>
                        <p>Coming Soon!</p>
                      </TooltipContent>
                    </TooltipTrigger>
                  </Tooltip>
                </TooltipProvider>
              </TabsList>
              <div className="flex items-center space-x-2">
                <Button onClick={handleReload} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload
                </Button>
                <Button>Downloads</Button>
              </div>
            </div>
            <Dashboard ref={dashboardRef} />
            <Retail />
            <Wholesale />
          </Tabs>
        </div>
      </div>
      </SidebarInset>
  </SidebarProvider>
)}