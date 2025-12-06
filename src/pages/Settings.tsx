import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useSidebar } from "@/components/ui/sidebar";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, Moon, Sun, PanelLeftClose, PanelLeft, Settings as SettingsIcon,
  Bell, BellOff, User, BookOpen, Eye, Trash2, Key, Mail
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NotificationPrefs {
  messages: boolean;
  follows: boolean;
  recommendations: boolean;
}

interface ReadingPrefs {
  readingDirection: "ltr" | "rtl";
  pageMode: "single" | "double";
  autoNextChapter: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { state, toggleSidebar } = useSidebar();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  
  const isCollapsed = state === "collapsed";
  const isDarkMode = theme === "dark";

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    messages: true,
    follows: true,
    recommendations: true,
  });

  const [readingPrefs, setReadingPrefs] = useState<ReadingPrefs>({
    readingDirection: "ltr",
    pageMode: "single",
    autoNextChapter: true,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      const notifPrefs = profile.notification_preferences as unknown as NotificationPrefs | null;
      const readPrefs = profile.reading_preferences as unknown as ReadingPrefs | null;
      
      if (notifPrefs) {
        setNotificationPrefs(notifPrefs);
      }
      if (readPrefs) {
        setReadingPrefs(readPrefs);
      }
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  const handleSidebarToggle = () => {
    toggleSidebar();
  };

  const updateNotificationPref = async (key: keyof NotificationPrefs, value: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    
    await updateProfile({ notification_preferences: newPrefs });
    toast({
      title: "Preferences updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const updateReadingPref = async <K extends keyof ReadingPrefs>(key: K, value: ReadingPrefs[K]) => {
    const newPrefs = { ...readingPrefs, [key]: value };
    setReadingPrefs(newPrefs);
    
    await updateProfile({ reading_preferences: newPrefs });
    toast({
      title: "Preferences updated",
      description: "Your reading preferences have been saved.",
    });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      toast({
        title: "Error",
        description: "Password must contain uppercase, lowercase, and a number.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    toast({
      title: "Account deletion",
      description: "Please contact support to delete your account.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20 md:pb-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your app preferences</p>
          </div>
        </div>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
              </div>
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                <div>
                  <Label htmlFor="sidebar-collapsed" className="font-medium">Collapse Sidebar</Label>
                  <p className="text-sm text-muted-foreground">
                    Show only icons in the sidebar
                  </p>
                </div>
              </div>
              <Switch
                id="sidebar-collapsed"
                checked={isCollapsed}
                onCheckedChange={handleSidebarToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Control what notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-messages" className="font-medium">Message Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when you receive new messages
                </p>
              </div>
              <Switch
                id="notif-messages"
                checked={notificationPrefs.messages}
                onCheckedChange={(checked) => updateNotificationPref("messages", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-follows" className="font-medium">Follow Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone follows you
                </p>
              </div>
              <Switch
                id="notif-follows"
                checked={notificationPrefs.follows}
                onCheckedChange={(checked) => updateNotificationPref("follows", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-recommendations" className="font-medium">Recommendation Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about manga recommendations
                </p>
              </div>
              <Switch
                id="notif-recommendations"
                checked={notificationPrefs.recommendations}
                onCheckedChange={(checked) => updateNotificationPref("recommendations", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reading Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Reading Preferences
            </CardTitle>
            <CardDescription>Customize your reading experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Reading Direction</Label>
                <p className="text-sm text-muted-foreground">
                  Choose how pages are displayed
                </p>
              </div>
              <Select
                value={readingPrefs.readingDirection}
                onValueChange={(value: "ltr" | "rtl") => updateReadingPref("readingDirection", value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ltr">Left to Right</SelectItem>
                  <SelectItem value="rtl">Right to Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Page Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Single or double page view
                </p>
              </div>
              <Select
                value={readingPrefs.pageMode}
                onValueChange={(value: "single" | "double") => updateReadingPref("pageMode", value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Page</SelectItem>
                  <SelectItem value="double">Double Page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-next" className="font-medium">Auto Next Chapter</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically load the next chapter
                </p>
              </div>
              <Switch
                id="auto-next"
                checked={readingPrefs.autoNextChapter}
                onCheckedChange={(checked) => updateReadingPref("autoNextChapter", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            {/* Change Password */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                <Label className="font-medium">Change Password</Label>
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="New password (min 8 chars, mixed case + number)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Logout */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>

            <Separator />

            {/* Delete Account */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount}>
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;