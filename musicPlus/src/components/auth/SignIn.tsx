import { activateCompletedSession } from "@/lib/activate-session";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useClerk, useSignIn } from "@clerk/clerk-react";
import { authErrorMessage, incompleteSignInMessage } from "@/lib/auth-feedback";

interface SignInProps {
  title?: string;
  subtitle?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function SignIn({
  title = "Welcome back",
  subtitle = "Sign in to your account",
}: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { signIn, isLoaded } = useSignIn();
  const { setActive } = useClerk();
  const navigate = useNavigate();

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!email) nextErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Enter a valid email address";
    if (!password) nextErrors.password = "Password is required";
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!isLoaded || !signIn || loading) return;

    setErrors({});
    setGeneralError(null);
    setLoading(true);

    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete" && result.createdSessionId) {
        await activateCompletedSession(setActive, result.createdSessionId, () => navigate("/"), setGeneralError);
      } else {
        setGeneralError(incompleteSignInMessage(result.status));
      }
    } catch (error: unknown) {
      setGeneralError(authErrorMessage(error, "Unable to sign in. Please try again."));
    } finally {
      setLoading(false);
    }
  };

    return (
        <Card className="w-full max-w-md p-8 my-10 mx-auto">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-gray-600 mt-2">{subtitle}</p>
            </div>

            {generalError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <span className="ml-2">{generalError}</span>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            placeholder="you@example.com"
                        />
                    </div>
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative mt-1">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                </div>

                <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={!isLoaded || loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        "Sign In"
                    )}
                </Button>
            </form>
            <div className="text-right mt-1">
                <button 
                type="button"
                onClick={() => navigate("/forgetPassword")}
                className="text-sm text-blue-300 hover:underline">Forget password?</button>
            </div>
        </Card>
    );
    
}
