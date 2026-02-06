import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ... (resto del file invariato)

const Command = React.forwardRef<
  React.ElementRef, React.ComponentPropsWithoutRef
>(( { className, ...props }, ref) => ( ));
Command.displayName = CommandPrimitive.displayName;

// ❌ interface CommandDialogProps extends DialogProps {}
// ✅ usa un type alias, evita l'interfaccia vuota
type CommandDialogProps = DialogProps;

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return ( {children} );
};

const CommandInput = React.forwardRef<
  React.ElementRef, React.ComponentPropsWithoutRef
>(({ className, ...props }, ref) => ( ));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef, React.ComponentPropsWithoutRef
>(({ className, ...props }, ref) => ( ));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes) => {
  return
