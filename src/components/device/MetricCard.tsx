"use client";

import { cn } from "@/lib/utils";
import { Loader2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export function MetricCard({
  title,
  value,
  children,
  isLoading = false,
  className,
  onEdit,
}: {
  title: string;
  value?: string;
  children?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  onEdit?: () => void;
}) {
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardDescription className="text-sm font-medium text-muted-foreground">
            {title}
          </CardDescription>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-2 -mt-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span className="sr-only">Edit {title.toLowerCase()}</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : children ? (
          children
        ) : (
          <div className="text-2xl font-semibold">{value ?? "N/A"}</div>
        )}
      </CardContent>
    </Card>
  );
}
