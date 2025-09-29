import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChefHat, Camera, Calendar, ShoppingCart, Users, Settings } from "lucide-react"
import { useLocation } from "wouter"

const menuItems = [
  {
    title: "Discover Recipes",
    url: "/",
    icon: ChefHat,
    description: "AI-powered recipe recommendations"
  },
  {
    title: "Scan Ingredients", 
    url: "/scanner",
    icon: Camera,
    description: "Identify ingredients with AI"
  },
  {
    title: "Meal Planner",
    url: "/planner",
    icon: Calendar,
    description: "Plan your weekly meals"
  },
  {
    title: "Shopping List",
    url: "/shopping",
    icon: ShoppingCart,
    description: "Smart grocery lists"
  },
  {
    title: "Family Profile",
    url: "/profile",
    icon: Users,
    description: "Manage family preferences"
  }
]

export function AppSidebar() {
  const [location] = useLocation()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground rounded-lg p-2">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Stock2Table</h2>
            <p className="text-sm text-sidebar-foreground/70">AI Meal Planning</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-sidebar-foreground/60">
                          {item.description}
                        </span>
                      </div>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback>FM</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">Family Account</p>
            <p className="text-xs text-sidebar-foreground/70">4 members</p>
          </div>
          <SidebarMenuButton size="sm" data-testid="button-settings">
            <Settings className="h-4 w-4" />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}