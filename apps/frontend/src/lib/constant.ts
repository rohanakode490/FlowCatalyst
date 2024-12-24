import Category from "@/components/icons/category";
import Home from "@/components/icons/home";
import Settings from "@/components/icons/settings";
import Workflows from "@/components/icons/workflows";

export const Integrations = [...new Array(3)].map((_, index) => ({
  href: `/${index + 1}.png`,
}));

export const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Documentation" },
];

export const menuOptions = [
  { name: "Dashboard", Component: Home, href: "/dashboard" },
  { name: "Workflows", Component: Workflows, href: "/workflows" },
  { name: "Settings", Component: Settings, href: "/settings" },
  { name: "Connections", Component: Category, href: "/connections" },
];
