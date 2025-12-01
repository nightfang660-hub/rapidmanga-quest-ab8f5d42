import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, Library, User, LogOut, Search } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/library", icon: Library, label: "Library" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" collapsible="icon">
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold">MangaVerse</h1>
                <p className="text-xs text-muted-foreground">Read & Discover</p>
              </div>
            )}
          </div>
          <SidebarTrigger className="ml-auto" />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.to}
                        end={item.to === "/"}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      >
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span className="font-medium">{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-4">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-muted-foreground"
              activeClassName="text-primary"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
};