"use client";

import { FC, SVGProps, ReactNode } from "react";
import Image from "next/image";
import Link from 'next/link';
import { ClerkProvider, UserButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DollarSignIcon, RadioTowerIcon, RefreshCwOffIcon, Users2Icon } from "lucide-react";
import dynamic from 'next/dynamic';
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Dynamically import the DataTableDemo component with no SSR to avoid hydration issues
const DataTableDemo = dynamic(
  () => import('@/app/devices/table').then(mod => mod.DataTableDemo),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
);


type CardData = {
  title: string;
  description: string;
  value: ReactNode;
  icon: FC<SVGProps<SVGSVGElement>>;
};

export default function Page() {
  const cards = [
    { title: "Active Services", description: "Running Total", value: "1,524", icon: RadioTowerIcon },
    { title: "Sales", description: "Month to Date", value: "84", icon: Users2Icon },
    { title: "Disconnects", description: "Month to Date", value: "19", icon: RefreshCwOffIcon },
    { title: "Commissions", description: "Estimate Subject to Change", value: "$481.43", icon: DollarSignIcon },
  ];

  return (
    <ErrorBoundary 
      fallback={
        <div className="p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to load devices</h2>
          <p className="mb-4">There was an error loading the devices. Please try refreshing the page.</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Refresh Page
          </Button>
        </div>
      }
    >
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
                    <BreadcrumbLink href="/devices">Devices</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-col md:flex">
            <div className="flex-1 space-y-4 p-8 pt-6">
              <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Devices</h2>
              </div>
              <DataTableDemo />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}