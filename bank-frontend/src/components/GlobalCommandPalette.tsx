import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import type { NavigationItem } from "@/lib/rbac";
import type { DisabledFeatureModule } from "@/lib/features";
import { AlertTriangle, LogOut, Palette, Router } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: Array<NavigationItem & { to: string }>;
  onNavigate: (to: string) => void;
  onOpenBranding: () => void;
  onLogout: () => void;
  disabledModules: DisabledFeatureModule[];
}

export default function GlobalCommandPalette({
  open,
  onOpenChange,
  navItems,
  onNavigate,
  onOpenBranding,
  onLogout,
  disabledModules,
}: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to module or action..." />
      <CommandList>
        <CommandEmpty>No matching command.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.to}
              value={`${item.label} ${item.to}`}
              onSelect={() => {
                onNavigate(item.to);
                onOpenChange(false);
              }}
            >
              <Router className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              <CommandShortcut>{item.to}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem
            value="Customize branding"
            onSelect={() => {
              onOpenBranding();
              onOpenChange(false);
            }}
          >
            <Palette className="mr-2 h-4 w-4" />
            <span>Customize Branding</span>
          </CommandItem>

          <CommandItem
            value="Logout"
            onSelect={() => {
              onLogout();
              onOpenChange(false);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </CommandItem>
        </CommandGroup>

        {disabledModules.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Unavailable Modules">
              {disabledModules.map((item) => (
                <CommandItem key={item.key} value={`Unavailable ${item.label}`} disabled>
                  <AlertTriangle className="mr-2 h-4 w-4 text-warning" />
                  <span>{item.label} is disabled</span>
                  <CommandShortcut>{item.envVar}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}