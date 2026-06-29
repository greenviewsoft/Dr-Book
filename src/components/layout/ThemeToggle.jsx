import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, variant = "outline" }) {
  const { theme, toggle } = useTheme();
  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      onClick={toggle}
      className={cn(className)}
      aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
