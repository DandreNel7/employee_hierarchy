"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !bg-card !text-foreground !border-border !shadow-md font-sans",
          title: "!text-sm !font-medium",
          description: "!text-xs !text-muted-foreground",
          success: "[&_[data-icon]]:!text-primary",
          error: "[&_[data-icon]]:!text-destructive",
          warning: "[&_[data-icon]]:!text-destructive",
          info: "[&_[data-icon]]:!text-primary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
