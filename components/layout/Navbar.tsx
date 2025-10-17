"use client"

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Package, Truck } from "lucide-react";

export function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();

  const isDashboardActive = pathname === "/";
  const isProductsActive = pathname.startsWith("/produits");

  const getLinkClasses = (isActive: boolean) => cn(
    "flex items-center px-2 py-3 text-sm font-medium transition-colors",
    isActive
      ? "text-primary font-semibold border-b-2 border-primary"
      : "text-muted-foreground hover:text-foreground"
  );

  return (
    <nav className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="flex h-16 items-center justify-between space-x-3 px-3 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold whitespace-nowrap">Sudbois Chargements</span>
          </Link>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          
          <Link
            href="/"
            className={getLinkClasses(isDashboardActive)}
          >
            <Truck className="h-4 w-4 sm:mr-2" /> 
            <span className="hidden sm:inline">Chargements</span>
            <span className="inline sm:hidden">Dash</span>
          </Link>

          <Link
            href="/produits"
            className={getLinkClasses(isProductsActive)}
          >
            <Package className="h-4 w-4 sm:mr-2" />
             <span className="hidden sm:inline">Produits</span>
             <span className="inline sm:hidden">Prod.</span>
          </Link>
          
        </div>
      </div>
    </nav>
  );
}