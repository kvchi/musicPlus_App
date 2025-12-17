import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useSignIn } from '@clerk/clerk-react';

export default function ForgetPassword() {
    const { signIn, isLoaded } = useSignIn();
    const [email, setEmail] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [resetCode, setRestCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setError("");

        try {
             await signIn.create({
                strategy: "reset_password_email_code",
                identifier: email,
            });
            setCodeSent(true);
        } catch (err: any) {
            setError(err.errors[0].message || "Failed to send reset code");
        } finally {
            setLoading(false);
        }}
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setError("");

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code: resetCode,
                password: newPassword,
            });

            if (result.status === "complete") {
                window.location.href = "/";
            }
        } catch (err: any) {
            setError(err.errors[0].message || "Reset failed");
        } finally {
            setLoading(false);
        }}

        return (
          <Card className="w-full max-w-md p-8 mx-auto my-10">
            <h2 className='text-2xl font-bold text-center mb-6'>Reset your Password</h2>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <span className="ml-2">{error}</span>
              </Alert>
            )}

            {!codeSent ? (
                <form onSubmit={handleSendCode} className='space-y-4'>
                    <div>
                        <Label htmlFor="">Email</Label>
                        <Input
                        type='email'
                        placeholder='Enter your email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        />
                    </div>
                    <Button type='submit' className='w-full' disabled={loading}>{loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Send reset Code'}</Button>
                </form>
            ):(
                <form onSubmit={handleResetPassword} className='space-y-4'>
                    <div>
                        <Label htmlFor="">Reset Code</Label>
                        <Input
                        type='text'
                        placeholder='Enter the code from your email'
                        value={resetCode}
                        onChange={(e) => setRestCode(e.target.value)}
                        required
                        />
                    </div>
                    <div>
                        <Label htmlFor="">New Password</Label>
                        <Input
                        type='password'
                        placeholder='Enter your new password'
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        />
                    </div>
                    <Button type='submit' className='w-full' disabled={loading}>
                        {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : 'Reset Password'}
                    </Button>
                </form>
            )}
              
          </Card>
        )
    }


