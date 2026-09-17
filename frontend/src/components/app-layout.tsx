import {
  Building2,
  LayoutDashboard,
  LogOut,
  Network,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";

import logo from "@/assets/epi-use-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useLogout, useUser } from "@/lib/auth";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/org-chart", label: "Org chart", icon: Network },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/departments", label: "Departments", icon: Building2 },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: user } = useUser();
  const logout = useLogout();

  function signOut() {
    logout.mutate(undefined, { onSuccess: () => navigate("/login") });
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <img
            src={logo}
            alt="EPI-USE"
            className="h-7 w-auto self-start object-contain brightness-0 invert"
          />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {links.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      to === "/" ? pathname === "/" : pathname.startsWith(to)
                    }
                  >
                    <NavLink to={to} end={to === "/"}>
                      <Icon />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <p className="truncate px-2 text-xs opacity-70">{user?.email}</p>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut}>
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
