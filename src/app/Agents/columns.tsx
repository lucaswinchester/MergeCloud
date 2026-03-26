"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Shield, UserMinus, Mail, Crown, User } from "lucide-react"

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl: string;
  organizationName?: string;
  permissions?: string;
  joinedAt?: string;
}

// Role badge color mapping
const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (role.toLowerCase()) {
    case "admin":
      return "destructive";
    case "member":
      return "secondary";
    default:
      return "outline";
  }
};

const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case "admin":
      return <Crown className="h-3 w-3 mr-1" />;
    default:
      return <User className="h-3 w-3 mr-1" />;
  }
};

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: 'imageUrl',
    header: 'Avatar',
    cell: ({ row }) => {
      const { name, imageUrl } = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={imageUrl}
              alt={name}
              className="object-cover w-full h-full rounded-full"
            />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const email = row.original.email;
      return (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">{email}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant={getRoleBadgeVariant(role)} className="flex w-fit items-center">
          {getRoleIcon(role)}
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "organizationName",
    header: "Organization",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const member = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(member.email)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Copy email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              Change role
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <UserMinus className="mr-2 h-4 w-4" />
              Remove from organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

