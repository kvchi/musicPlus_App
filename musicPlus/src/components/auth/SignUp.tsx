
// import React, { useState } from "react";
// import { Alert } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card } from "@/components/ui/card";
// import { AlertCircle, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
// import { useSignUp } from "@clerk/clerk-react";

// interface SignUpProps {
//   title?: string;
//   subtitle?: string;
// }

// interface FormErrors {
//   email?: string;
//   password?: string;
//   confirmPassword?: string;
// }

// const SignUp: React.FC<SignUpProps> = ({
//   title = "Create your account",
//   subtitle = "Sign up to get started",
// }) => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState<FormErrors>({});
//   const [generalError, setGeneralError] = useState<string | null>(null);
//   const { isLoaded, signUp } = useSignUp();

//   // Validation logic
//   const validate = (): FormErrors => {
//     const newErrors: FormErrors = {};
//     if (!email) {
//       newErrors.email = "Email is required";
//     } else if (!/\S+@\S+\.\S+/.test(email)) {
//       newErrors.email = "Not a valid email address";
//     }
//     if (!password) {
//       newErrors.password = "Password is required";
//     } else if (password.length < 8) {
//       newErrors.password = "Password must be at least 8 characters";
//     }
//     if (password !== confirmPassword) {
//       newErrors.confirmPassword = "Passwords do not match";
//     }
//     return newErrors;
//   };

//   // Submit handler
//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const newErrors = validate();

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     if (!isLoaded || !signUp) return;

//     setErrors({});
//     setGeneralError(null);
//     setLoading(true);

//     try {
//       await signUp.create({
//         emailAddress: email,
//         password,
//       });

//       await signUp.prepareEmailAddressVerification({
//         strategy: "email_code",
//       });

//       setGeneralError(
//         "A verification code has been sent to your email. Please verify to complete sign up."
//       );
//     } catch (error) {
//       setGeneralError(error?.errors?.[0]?.message || "Sign up failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Card className="w-full max-w-md p-8 mx-auto">
//       <div className="mb-6 text-center">
//         <h2 className="text-2xl font-bold">{title}</h2>
//         <p className="text-gray-600 mt-2">{subtitle}</p>
//       </div>

//       {generalError && (
//         <Alert variant="destructive" className="mb-4 flex items-center">
//           <AlertCircle className="h-4 w-4" />
//           <span className="ml-2">{generalError}</span>
//         </Alert>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-4">
//         {/* Email */}
//         <div>
//           <Label htmlFor="email">Email</Label>
//           <div className="relative mt-1">
//             <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//             <Input
//               id="email"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="pl-10"
//               placeholder="you@example.com"
//             />
//           </div>
//           {errors.email && (
//             <p className="text-red-500 text-sm mt-1">{errors.email}</p>
//           )}
//         </div>

//         {/* Password */}
//         <div>
//           <Label htmlFor="password">Password</Label>
//           <div className="relative mt-1">
//             <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//             <Input
//               id="password"
//               type={showPassword ? "text" : "password"}
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="pl-10 pr-10"
//               placeholder="••••••••"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
//             >
//               {showPassword ? (
//                 <EyeOff className="h-4 w-4" />
//               ) : (
//                 <Eye className="h-4 w-4" />
//               )}
//             </button>
//           </div>
//           {errors.password && (
//             <p className="text-red-500 text-sm mt-1">{errors.password}</p>
//           )}
//         </div>

//         {/* Confirm Password */}
//         <div>
//           <Label htmlFor="confirmPassword">Confirm Password</Label>
//           <div className="relative mt-1">
//             <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//             <Input
//               id="confirmPassword"
//               type={showPassword ? "text" : "password"}
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               className="pl-10 pr-10"
//               placeholder="••••••••"
//             />
//           </div>
//           {errors.confirmPassword && (
//             <p className="text-red-500 text-sm mt-1">
//               {errors.confirmPassword}
//             </p>
//           )}
//         </div>

//         {/* Submit */}
//         <Button type="submit" className="w-full" disabled={loading}>
//           {loading ? (
//             <>
//               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               Creating account...
//             </>
//           ) : (
//             "Sign Up"
//           )}
//         </Button>
//       </form>
//     </Card>
//   );
// };

// export default SignUp;


import React, { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";



interface FormErrors {
  email?: string;
  password?: string;
  code?: string;
}

interface ClerkError {
  errors?: { message?: string }[];
}

const SignUp: React.FC = () => {
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


  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    return newErrors;
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!isLoaded || !signUp) return;

    setErrors({});
    setGeneralError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setSuccessMessage("A verification code has been sent to your email.");
    } catch (err) {
      const error = err as ClerkError;
      const message = error.errors?.[0]?.message ?? "Something went wrong during sign up.";
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setGeneralError("");
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });


      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/dashboard");
      } else {
        setGeneralError("Verification failed. Please try again.");
      }
    } catch (err) {
      const error = err as ClerkError;
      const message = error.errors?.[0]?.message ?? "Invalid verification code.";
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8 mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold">Create your account</h2>
        <p className="text-gray-600 mt-2">Sign up to get started</p>
      </div>

      {generalError && (
        <Alert variant="destructive" className="mb-4 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {generalError}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="default" className="mb-4 flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-2" />
          {successMessage}
        </Alert>
      )}

      {!pendingVerification ? (
        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Email */}
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
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
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
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code from email"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
        </form>
      )}
    </Card>
  );
};

export default SignUp;