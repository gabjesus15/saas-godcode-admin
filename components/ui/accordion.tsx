"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

import { cn } from "../../utils/cn";

const AccordionRoot = AccordionPrimitive.Root;

export const Accordion = AccordionRoot;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-t border-slate-200/80 first:border-t-0", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "group flex w-full flex-1 items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-slate-900 transition-colors hover:bg-slate-50 marker:content-none dark:text-white dark:hover:bg-zinc-900/40",
        className,
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden px-6 pb-5 pt-0 text-sm leading-relaxed text-slate-600 dark:text-zinc-400",
      className,
    )}
    {...props}
  >
    {children}
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = "AccordionContent";

