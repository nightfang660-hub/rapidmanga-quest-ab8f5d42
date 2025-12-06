import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Check, X, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { signUp, signIn, signInWithUsername, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      setCheckingUsername(false);
      setUsernameAvailable(!data && !error);
    };

    const timeout = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  const validatePassword = (pwd: string) => {
    const errors = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/\d/.test(pwd)) errors.push("One number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push("One special character");
    return errors;
  };

  const passwordErrors = validatePassword(password);
  const isPasswordValid = passwordErrors.length === 0;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!username.trim() || username.length < 3) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!usernameAvailable) {
      toast({
        title: "Error",
        description: "Username is already taken",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: "Weak Password",
        description: "Please create a stronger password",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, username.toLowerCase());
    
    if (error) {
      let message = error.message;
      if (message.includes("already registered")) {
        message = "This email is already registered. Please sign in instead.";
      }
      toast({
        title: "Signup Failed",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Account created successfully. You can now sign in.",
      });
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const isEmail = loginIdentifier.includes("@");
    
    let result;
    if (isEmail) {
      result = await signIn(loginIdentifier, password);
    } else {
      result = await signInWithUsername(loginIdentifier, password);
    }
    
    if (result.error) {
      toast({
        title: "Sign In Failed",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl text-center">MangaVerse</CardTitle>
          <CardDescription className="text-center text-base">
            Your ultimate manga reading experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-identifier">Email or Username</Label>
                  <Input
                    id="signin-identifier"
                    type="text"
                    placeholder="your@email.com or username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <div className="relative">
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="mangalover123"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      required
                      minLength={3}
                      maxLength={20}
                      className={username.length >= 3 ? (usernameAvailable ? "border-green-500" : "border-destructive") : ""}
                    />
                    {username.length >= 3 && !checkingUsername && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameAvailable ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, lowercase letters, numbers, and underscores only
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={password.length > 0 ? (isPasswordValid ? "border-green-500" : "border-destructive") : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {password.length > 0 && (
                    <div className="space-y-1">
                      {["At least 8 characters", "One uppercase letter", "One lowercase letter", "One number", "One special character"].map((req) => {
                        const isMet = !passwordErrors.includes(req);
                        return (
                          <div key={req} className={`text-xs flex items-center gap-1 ${isMet ? "text-green-500" : "text-muted-foreground"}`}>
                            {isMet ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {req}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !isPasswordValid || !usernameAvailable}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;