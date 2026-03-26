"use client"

import * as React from "react"
import {
  Calendar,
  Cloud,
  Contact,
  GraduationCap,
  LayoutDashboardIcon,
  LifeBuoy,
  MapIcon,
  Megaphone,
  MonitorCog,
  Package2,
  Power,
  Send,
  Users,
} from "lucide-react"

import { useTheme } from "next-themes";
import { useOrgPermissions } from "@/hooks/use-org-permissions";

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
  OrganizationSwitcher,
  SignedIn,
  useUser,
} from "@clerk/nextjs"
import {
  dark
} from "@clerk/themes"

import { Shield } from "lucide-react"

const data = {
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "IQMC Cloud",
      url: "https://cloud.revgennetworks.com",
      icon: Cloud,
    },
    {
      name: "Cell Mapper",
      url: "https://www.cellmapper.net",
      icon: MapIcon,
    },
    {
      name: "SIM Checker",
      url: "/sim-checker",
      icon: Power,
    },
    {
      name: "Assets",
      url: "/marketing-assets",
      icon: Megaphone,
    },
    {
      name: "Events",
      url: "/events",
      icon: Calendar,
    },
    {
      name: "Training",
      url: "https://academy.revgennetworks.com/",
      icon: GraduationCap,
    },
  ],
}


export const AppSidebar = React.memo(function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { theme } = useTheme();
  const appearance = React.useMemo(() => (theme === "dark" ? dark : undefined), [theme]);
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata?.isSuperAdmin === true;
  const { permissions } = useOrgPermissions();

  const navItems = React.useMemo(() => {
    const items: { title: string; url: string; icon: React.ElementType; isActive?: boolean }[] = [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon, isActive: true },
      { title: "Agents", url: "/Agents", icon: Contact },
    ];
    if (permissions?.isRetailer || permissions?.isWholesaler) {
      items.push({ title: "Order", url: "/order", icon: Package2 });
    }
    if (permissions?.isRetailer) {
      items.push({ title: "Customers", url: "/customers", icon: Users });
    }
    if (permissions?.isWholesaler && permissions?.hasDeviceAccess) {
      items.push({ title: "Devices", url: "/devices", icon: MonitorCog });
    }
    if (isSuperAdmin) {
      items.push({ title: "Admin", url: "/admin", icon: Shield });
    }
    return items;
  }, [permissions, isSuperAdmin]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <OrganizationSwitcher hidePersonal appearance={{ baseTheme: appearance }} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <SignedIn>
          <NavUser />
        </SignedIn>
      </SidebarFooter>
    </Sidebar>
  );
});

