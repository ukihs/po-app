"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const [theme, setThemeState] = React.useState<
    "light" | "dark" | "system"
  >("light");

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setThemeState(isDarkMode ? "dark" : "light");
    }
  }, []);

  React.useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList[isDark ? "add" : "remove"]("dark");
    
    localStorage.setItem('theme', theme);
    document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  }, [theme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="h-8 w-8 rounded-full border-2 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top" sideOffset={8}>
        <DropdownMenuItem onClick={() => setThemeState("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemeState("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemeState("system")}>
          <span className="mr-2 h-4 w-4">💻</span>
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}