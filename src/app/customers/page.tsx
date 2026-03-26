"use client";

import { FC, SVGProps, ReactNode } from "react"
import Image from "next/image"
import Link from 'next/link';
import {
  UserButton,
  SignedIn,
  SignedOut,
  useAuth
} from "@clerk/nextjs"
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSignIcon, RadioTowerIcon, RefreshCwOffIcon, Users2Icon } from "lucide-react";
import { DataTableDemo } from "@/app/devices/table"


type CardData = {
  title: string;
  description: string;
  value: ReactNode;
  icon: FC<SVGProps<SVGSVGElement>>;
};

export default function Page() {
  const cards: CardData[] = [
    { title: "Active Services", description: "Running Total", value: "1,524", icon: RadioTowerIcon },
    { title: "Sales", description: "Month to Date", value: "84", icon: Users2Icon },
    { title: "Disconnects", description: "Month to Date", value: "19", icon: RefreshCwOffIcon },
    { title: "Commissions", description: "Estimate Subject to Change", value: "$481.43", icon: DollarSignIcon },
  ];

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
                  <BreadcrumbLink href="/customers">Customers</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="hidden flex-col md:flex">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Devices</h2>
          </div>
          <DataTableDemo />
        </div>
      </div>
      </SidebarInset>
  </SidebarProvider>
)}