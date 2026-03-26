"use client";

import { CircleCheck, CircleXIcon, Clock, Wifi, WifiOff } from "lucide-react";
import { getBadgeClasses } from "./device-utils";

export function ActivationBadge({ active }: { active: boolean }) {
  const cls = active ? getBadgeClasses("positive") : getBadgeClasses("negative");
  const iconColor = active ? "text-green-700" : "text-red-700";
  return (
    <div className={`flex items-center space-x-2 px-4 py-1 rounded-full border ${cls}`}>
      {active ? (
        <>
          <CircleCheck className={`h-4 w-4 ${iconColor}`} />
          <span className="text-sm font-medium">Active</span>
        </>
      ) : (
        <>
          <CircleXIcon className={`h-4 w-4 ${iconColor}`} />
          <span className="text-sm font-medium">Inactive</span>
        </>
      )}
    </div>
  );
}

export function ReachabilityBadge({ statusCode, statusText }: { statusCode?: number; statusText?: string }) {
  const isReachable = statusCode === 1;
  const isUnreachable = statusCode === 0;

  const cls = isReachable
    ? getBadgeClasses("positive")
    : isUnreachable
    ? getBadgeClasses("negative")
    : getBadgeClasses("warning");

  const Icon = isReachable ? CircleCheck : isUnreachable ? CircleXIcon : Clock;
  const iconColor = isReachable ? "text-green-700" : isUnreachable ? "text-red-700" : "text-yellow-700";

  return (
    <div className={`flex items-center space-x-2 px-4 py-1 rounded-full border ${cls}`}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <span className="text-sm font-medium">{statusText || "Unknown"}</span>
    </div>
  );
}

export function SimStatusBadge({ status }: { status?: string }) {
  const statusLower = (status || "").toLowerCase();
  const isRegistered = statusLower === "registered";
  const isNotPresent = statusLower === "not present";

  const cls = isRegistered
    ? getBadgeClasses("positive")
    : isNotPresent
    ? getBadgeClasses("negative")
    : getBadgeClasses("warning");

  const Icon = isRegistered ? Wifi : isNotPresent ? WifiOff : Clock;
  const iconColor = isRegistered ? "text-green-700" : isNotPresent ? "text-red-700" : "text-yellow-700";

  return (
    <div className={`flex items-center space-x-2 px-4 py-1 rounded-full border ${cls}`}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <span className="text-sm font-medium">{status || "Unknown"}</span>
    </div>
  );
}

export function PassStatusBadge({ status }: { status?: string }) {
  const isActivated = (status || "").toLowerCase() === "pass activated";
  const isInactive = (status || "").toLowerCase().includes("inactive") ||
                     (status || "").toLowerCase().includes("suspended") ||
                     (status || "").toLowerCase().includes("expired");

  const cls = isActivated
    ? getBadgeClasses("positive")
    : isInactive
    ? getBadgeClasses("negative")
    : getBadgeClasses("warning");

  const Icon = isActivated ? CircleCheck : isInactive ? CircleXIcon : Clock;
  const iconColor = isActivated ? "text-green-700" : isInactive ? "text-red-700" : "text-yellow-700";

  return (
    <div className={`flex items-center space-x-2 px-4 py-1 rounded-full border ${cls}`}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <span className="text-sm font-medium">{status || "Unknown"}</span>
    </div>
  );
}
