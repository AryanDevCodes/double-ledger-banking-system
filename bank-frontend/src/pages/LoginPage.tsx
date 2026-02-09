import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-gray-200">
        <CardHeader className="space-y-2 text-center border-b bg-gray-50">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-teal-100 rounded-full">
              <Building2 className="h-10 w-10 text-teal-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">SecureBank Login</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  className="pl-10 border-gray-300"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  className="pl-10 border-gray-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
              <p className="text-xs font-semibold text-blue-900">Test Credentials:</p>
              <div className="space-y-1 text-xs text-blue-800">
                <p>Admin: <strong>admin</strong> / <strong>admin123</strong></p>
                <p>Manager: <strong>manager</strong> / <strong>manager123</strong></p>
                <p>User: <strong>user</strong> / <strong>user123</strong></p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t bg-gray-50 pt-6">
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-xs text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-teal-600 hover:underline font-medium">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
