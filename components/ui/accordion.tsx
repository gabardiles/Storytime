"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = AccordionPrimitive.Item;

const AccordionTrigger = AccordionPrimitive.AccordionTrigger;

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.AccordionContent>) {
  return (
    <AccordionPrimitive.AccordionContent
      className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={className}>{children}</div>
    </AccordionPrimitive.AccordionContent>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
