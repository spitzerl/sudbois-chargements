"use client"

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Package, Truck } from "lucide-react";

// Barre de navigation principale
export function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();

  const isDashboardActive = pathname === "/";
  const isManagerActive = pathname.startsWith("/manager");

  const getLinkClasses = (isActive: boolean) => cn(
    "flex items-center px-3 py-2 rounded-md font-medium transition-colors",
    isActive
      ? "text-primary font-semibold bg-primary/10"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
  );

  return (
    <nav className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/" className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-primary" />
            <span className="font-bold whitespace-nowrap text-sm md:text-base">Sudbois</span>
          </Link>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          
          <Link
            href="/"
            className={getLinkClasses(isDashboardActive)}
          >
            <Truck className="h-4 w-4 mr-1.5" /> 
            <span className="text-sm">Chargements</span>
          </Link>

          <Link
            href="/manager"
            className={getLinkClasses(isManagerActive)}
          >
            <Package className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Manager</span>
          </Link>
          
        </div>
      </div>
    </nav>
  );
}