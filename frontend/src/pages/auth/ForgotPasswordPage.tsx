import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/resources';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getErrorMessage } from '../../utils';

const schema = z.object({ email: z.string().email() });

export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
      toast.success('Reset instructions sent if email exists');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Forgot Password</h2>
        <p className="text-gray-500 mb-6">Enter your email to receive reset instructions</p>
        {sent ? (
          <div className="text-center">
            <p className="text-green-600 mb-4">Check your email for reset instructions.</p>
            <Link to="/login" className="text-primary-600 hover:underline">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" error={errors.email?.message as string} {...register('email')} />
            <Button type="submit" className="w-full" loading={loading}>Send Reset Link</Button>
            <Link to="/login" className="block text-center text-sm text-primary-600">Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
};
