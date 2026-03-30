import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock, Mail, Eye, EyeOff, Wrench, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from '@/lib/toast';

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(formData);
      toast.success('Welcome back!');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
      toast.error('Login failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (email: string, password: string) => {
    setFormData({ email, password });
    toast.info('Demo credentials loaded');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-2 border-slate-700 border-t-purple-500 animate-spin" />
            <Sparkles className="h-6 w-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-slate-400 text-sm font-light tracking-wider">Loading experience...</span>
        </div>
      </div>
    );
  }

  const roles = [
    { email: 'admin@maintenance.com', password: 'admin123', label: 'Admin', desc: 'Full Control', gradient: 'from-purple-500/10 to-purple-600/10', border: 'border-purple-500/20', text: 'text-purple-400', hover: 'hover:border-purple-500/40' },
    { email: 'supervisor@maintenance.com', password: 'super123', label: 'Head', desc: 'Oversight', gradient: 'from-blue-500/10 to-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400', hover: 'hover:border-blue-500/40' },
    { email: 'manager@maintenance.com', password: 'manager123', label: 'Manager', desc: 'Operations', gradient: 'from-cyan-500/10 to-cyan-600/10', border: 'border-cyan-500/20', text: 'text-cyan-400', hover: 'hover:border-cyan-500/40' },
    { email: 'tech@maintenance.com', password: 'tech123', label: 'Technician', desc: 'Execution', gradient: 'from-emerald-500/10 to-emerald-600/10', border: 'border-emerald-500/20', text: 'text-emerald-400', hover: 'hover:border-emerald-500/40' },
    { email: 'reporter@maintenance.com', password: 'reporter123', label: 'Reporter', desc: 'Reporting', gradient: 'from-amber-500/10 to-amber-600/10', border: 'border-amber-500/20', text: 'text-amber-400', hover: 'hover:border-amber-500/40' },
    { email: 'finance@maintenance.com', password: 'finance123', label: 'Finance', desc: 'Billing', gradient: 'from-rose-500/10 to-rose-600/10', border: 'border-rose-500/20', text: 'text-rose-400', hover: 'hover:border-rose-500/40' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-950">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
      
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left - Branding */}
          <div className="space-y-12 fade-in">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/20">
                  <Wrench className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-light text-white tracking-tight">FacilityHub</h1>
                <p className="text-slate-500 text-sm font-light tracking-wider">Enterprise Maintenance</p>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-6">
              <h2 className="text-5xl font-extralight text-white leading-tight tracking-tight">
                Maintenance<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Reimagined</span>
              </h2>
              <p className="text-slate-400 text-lg font-light leading-relaxed max-w-md">
                Enterprise-grade facility management with elegant simplicity. Track, manage, and optimize your operations.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-800">
              <div>
                <div className="text-3xl font-light text-white mb-1">99.9%</div>
                <div className="text-slate-500 text-sm font-light">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-light text-white mb-1">24/7</div>
                <div className="text-slate-500 text-sm font-light">Support</div>
              </div>
              <div>
                <div className="text-3xl font-light text-white mb-1">256-bit</div>
                <div className="text-slate-500 text-sm font-light">Encryption</div>
              </div>
            </div>
          </div>

          {/* Right - Login Form */}
          <div className="space-y-8 slide-in-right">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-2xl p-8">
              {/* Header */}
              <div className="space-y-2 mb-8">
                <h3 className="text-2xl font-light text-white">Sign In</h3>
                <p className="text-slate-400 text-sm font-light">Access your workspace</p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
                  <AlertDescription className="font-light">{error}</AlertDescription>
                </Alert>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 text-sm font-light">
                    Email
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={isSubmitting}
                      className="pl-11 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 font-light"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 text-sm font-light">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={isSubmitting}
                      className="pl-11 pr-11 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 font-light"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-light shadow-lg shadow-purple-500/20 transition-all group"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Demo Access */}
              <div className="mt-8 pt-8 border-t border-slate-800">
                <p className="text-slate-400 text-xs font-light mb-4 tracking-wider uppercase">Quick Access</p>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.email}
                      onClick={() => handleDemoLogin(role.email, role.password)}
                      onMouseEnter={() => setHoveredRole(role.label)}
                      onMouseLeave={() => setHoveredRole(null)}
                      className={`relative p-3 rounded-lg border bg-gradient-to-br ${role.gradient} ${role.border} ${role.hover} transition-all duration-300 group overflow-hidden`}
                    >
                      <div className="relative z-10">
                        <div className={`text-xs font-light ${role.text} mb-0.5`}>{role.label}</div>
                        <div className="text-[10px] text-slate-500 font-light">{role.desc}</div>
                      </div>
                      {hoveredRole === role.label && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Footer */}
            <div className="flex items-center justify-center gap-6 text-slate-500 text-xs font-light">
              <span>Secure</span>
              <span>•</span>
              <span>Encrypted</span>
              <span>•</span>
              <span>Enterprise</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
