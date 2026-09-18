import { activateCompletedSession } from "@/lib/activate-session";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useSignUp } from "@clerk/clerk-react";
import { authErrorMessage } from "@/lib/auth-feedback";

interface FormErrors {
  email?: string;
  password?: string;
}

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!email) nextErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Enter a valid email address";
    if (!password) nextErrors.password = "Password is required";
    else if (password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    return nextErrors;
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!isLoaded || !signUp || loading) return;

    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setSuccessMessage("A verification code has been sent to your email.");
    } catch (error: unknown) {
      setGeneralError(authErrorMessage(error, "Unable to create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoaded || !signUp || !code.trim() || loading) return;

    setGeneralError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete" && result.createdSessionId) {
        await activateCompletedSession(setActive, result.createdSessionId, () => navigate("/dashboard"), setGeneralError);
      } else {
        setGeneralError(result.status === "complete"
          ? "No session is ready after verification. Please try again or contact the application administrator."
          : "Additional account verification or information is required. This form cannot complete that step yet. Contact the application administrator for a supported authentication flow; your session has not been activated.");
      }
    } catch (error: unknown) {
      setGeneralError(authErrorMessage(error, "Unable to verify your email. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-4 py-10">
      <Card className="w-full max-w-md p-8 mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-gray-600 mt-2">Sign up to start discovering music</p>
        </div>

        {generalError && (
          <Alert variant="destructive" className="mb-4 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" /> {generalError}
          </Alert>
        )}
        {successMessage && (
          <Alert className="mb-4 flex items-center text-green-700">
            <CheckCircle className="h-4 w-4 mr-2" /> {successMessage}
          </Alert>
        )}

        {!pendingVerification ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" placeholder="you@example.com" />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10 pr-10" placeholder="At least 8 characters" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={!isLoaded || loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Sign Up"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="code">Verification code</Label>
              <Input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter the code from your email" required />
            </div>
            <Button type="submit" className="w-full" disabled={!isLoaded || loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : "Verify Email"}
            </Button>
          </form>
        )}

        <div className="mt-3 flex justify-between text-sm">
          <Link to="/" className="text-gray-600 hover:underline">Back home</Link>
          <Link to="/sign-in" className="text-blue-600 hover:underline">Already registered?</Link>
        </div>
      </Card>
    </main>
  );
}
