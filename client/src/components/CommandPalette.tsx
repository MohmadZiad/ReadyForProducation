import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command";
import { emitChatPrefill } from "@/lib/chatBus";
import { useLocation } from "wouter";

const navigationActions = [
  { label: "Open Home", path: "/" },
  { label: "Open Calculator", path: "/calculator" },
  { label: "Open Pro-Rata", path: "/pro-rata" },
  { label: "Open Email Template", path: "/email-template" },
  { label: "Open Assistant", path: "/assistant" },
  { label: "Open Docs", path: "/docs" },
] as const;

const slashCommands = ["/calc", "/doc", "/summarize", "/help"] as const;

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, navigate] = useLocation();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {navigationActions.map((action) => (
            <CommandItem
              key={action.path}
              onSelect={() => {
                onOpenChange(false);
                navigate(action.path);
              }}
            >
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Slash Commands">
          {slashCommands.map((cmd) => (
            <CommandItem
              key={cmd}
              onSelect={() => {
                onOpenChange(false);
                emitChatPrefill({ text: cmd, focus: true, open: true });
              }}
            >
              {cmd}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
