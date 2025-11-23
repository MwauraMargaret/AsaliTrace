import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FaUser, FaShieldAlt } from "react-icons/fa";
import api from "@/services/api";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // POST to backend login route
      const response = await api.post("/auth/login/", {
        email: form.email,
        password: form.password,
      });
      const user = response.data.user;
      // Check admin role if admin login selected
      if (isAdminLogin) {
        if (!(user.is_superuser || user.is_staff)) {
          toast.error("You do not have admin privileges.");
          setLoading(false);
          return;
        }
        navigate("/administrator");
      } else {
        navigate("/batches");
      }
    } catch {
      // Generic error message for security
      toast.error("Invalid credentials or authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-muted">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold mb-2">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 mb-6">
            <div
              className={`flex-1 p-4 rounded-lg border cursor-pointer ${!isAdminLogin ? "border-blue-500 bg-blue-50" : "border-border bg-card"}`}
              onClick={() => setIsAdminLogin(false)}
            >
              <div className="flex items-center gap-2 mb-2">
                <FaUser className="text-blue-600" />
                <span className="font-semibold">Sign in as User</span>
              </div>
              <p className="text-xs text-muted-foreground">Access your honey batches and certificates.</p>
            </div>
            <div
              className={`flex-1 p-4 rounded-lg border cursor-pointer ${isAdminLogin ? "border-red-500 bg-red-50" : "border-border bg-card"}`}
              onClick={() => setIsAdminLogin(true)}
            >
              <div className="flex items-center gap-2 mb-2">
                <FaShieldAlt className="text-red-600" />
                <span className="font-semibold">Sign in as Admin/Superuser</span>
              </div>
              <p className="text-xs text-muted-foreground">Access the admin dashboard and privileged actions.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="username"
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" disabled={loading} variant={isAdminLogin ? "destructive" : "honey"}>
              {loading ? "Signing in..." : isAdminLogin ? "Sign in as Admin/Superuser" : "Sign in as User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
