"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const signUpSchema = z
  .object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Correo electrónico inválido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type LoginErrors = Partial<{ email: string; password: string; form: string }>;

type SignUpErrors = Partial<{
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  form: string;
}>;

type LoginFormProps = {
  /** Sign-up stays closed once at least one user exists. */
  allowSignup: boolean;
};

export function LoginForm({ allowSignup }: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [signUpErrors, setSignUpErrors] = useState<SignUpErrors>({});
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();

  const signupAvailable = allowSignup && activeTab === "signup";

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    if (loginErrors[name as keyof LoginErrors]) {
      setLoginErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSignUpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData((prev) => ({ ...prev, [name]: value }));
    if (signUpErrors[name as keyof SignUpErrors]) {
      setSignUpErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginErrors({});

    try {
      const validatedData = loginSchema.parse(loginData);

      const { error: authError } = await authClient.signIn.email({
        email: validatedData.email,
        password: validatedData.password,
        callbackURL: "/admin",
      });

      if (authError) {
        const message = authError.message ?? "";
        const translatedMessage = message.includes("Invalid email or password")
          ? "Correo electrónico o contraseña inválidos"
          : message.includes("Account not found")
            ? "Cuenta no encontrada"
            : message;

        setLoginErrors({
          form: translatedMessage || "No se pudo iniciar sesión",
        });
      } else {
        router.push("/admin");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const { fieldErrors } = err.flatten() as {
          fieldErrors: Record<string, string[]>;
        };
        setLoginErrors({
          email: fieldErrors.email?.[0],
          password: fieldErrors.password?.[0],
        });
      } else {
        setLoginErrors({
          form: err instanceof Error ? err.message : "Ocurrió un error al iniciar sesión",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowSignup) return;

    setLoading(true);
    setSignUpErrors({});

    try {
      const validatedData = signUpSchema.parse(signUpData);

      const { error: authError } = await authClient.signUp.email({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        callbackURL: "/admin",
      });

      if (authError) {
        const message = authError.message ?? "";
        const translatedMessage = message.includes("already exists")
          ? "El usuario ya existe"
          : message.includes("Invalid email")
            ? "Correo electrónico inválido"
            : message.includes("too weak")
              ? "La contraseña es demasiado débil"
              : message;

        setSignUpErrors({ form: translatedMessage || "No se pudo registrar" });
      } else {
        router.push("/admin");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const { fieldErrors } = err.flatten() as {
          fieldErrors: Record<string, string[]>;
        };
        setSignUpErrors({
          name: fieldErrors.name?.[0],
          email: fieldErrors.email?.[0],
          password: fieldErrors.password?.[0],
          confirmPassword: fieldErrors.confirmPassword?.[0],
        });
      } else {
        setSignUpErrors({
          form: err instanceof Error ? err.message : "Ocurrió un error al registrarse",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-8"
          style={{ color: "var(--muted-foreground)" }}
        >
          Volver al sitio web
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Image
              src="/android-chrome-512x512.png"
              alt="Logo de Catalog"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="font-semibold text-xl" style={{ color: "var(--foreground)" }}>
            Catalog
          </span>
        </div>

        {allowSignup && (
          <div
            className="grid grid-cols-2 gap-2 p-1 mb-6"
            style={{ backgroundColor: "var(--muted)" }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`py-2 px-4 text-sm font-medium transition-all ${activeTab === "login" ? "shadow-sm" : ""}`}
              style={{
                backgroundColor:
                  activeTab === "login" ? "var(--background)" : "transparent",
                color:
                  activeTab === "login"
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`py-2 px-4 text-sm font-medium transition-all ${activeTab === "signup" ? "shadow-sm" : ""}`}
              style={{
                backgroundColor:
                  activeTab === "signup" ? "var(--background)" : "transparent",
                color:
                  activeTab === "signup"
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
              }}
            >
              Crear cuenta
            </button>
          </div>
        )}

        {!signupAvailable && (
          <>
            <p className="text-xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              Inicia sesión en tu cuenta
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              Administra tus productos fácilmente.
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              {loginErrors.form && (
                <div
                  className="border p-3 text-sm"
                  style={{
                    borderColor: "var(--destructive)",
                    color: "var(--destructive)",
                    backgroundColor: "var(--destructive)",
                    opacity: 0.1,
                  }}
                >
                  {loginErrors.form}
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="login-email"
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Correo electrónico
                  <span style={{ color: "var(--destructive)" }}>*</span>
                </Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  value={loginData.email}
                  onChange={handleLoginInputChange}
                  className="h-10"
                  style={{ backgroundColor: "var(--background)" }}
                />
                {loginErrors.email && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {loginErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="login-password"
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Contraseña
                  <span style={{ color: "var(--destructive)" }}>*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    value={loginData.password}
                    onChange={handleLoginInputChange}
                    className="h-10 pr-10"
                    style={{ backgroundColor: "var(--background)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {loginErrors.password}
                  </p>
                )}
              </div>

              <Button variant="default" type="submit" className="w-full h-10" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar sesión en Catalog"}
              </Button>
            </form>
          </>
        )}

        {signupAvailable && (
          <>
            <p className="text-xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              Crea tu cuenta
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              Comienza a gestionar tus productos.
            </p>

            <form onSubmit={handleSignUpSubmit} className="space-y-4" noValidate>
              {signUpErrors.form && (
                <div
                  className="border p-3 text-sm"
                  style={{
                    borderColor: "var(--destructive)",
                    color: "var(--destructive)",
                    backgroundColor: "var(--destructive)",
                    opacity: 0.1,
                  }}
                >
                  {signUpErrors.form}
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-name"
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Nombre
                  <span style={{ color: "var(--destructive)" }}>*</span>
                </Label>
                <Input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="Ingresa tu nombre"
                  value={signUpData.name}
                  onChange={handleSignUpInputChange}
                  className="h-10"
                />
                {signUpErrors.name && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {signUpErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-email"
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Correo electrónico
                  <span style={{ color: "var(--destructive)" }}>*</span>
                </Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  value={signUpData.email}
                  onChange={handleSignUpInputChange}
                  className="h-10"
                />
                {signUpErrors.email && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {signUpErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-password"
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Contraseña
                  <span style={{ color: "var(--destructive)" }}>*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={signUpData.password}
                    onChange={handleSignUpInputChange}
                    className="h-10 pr-10"
                    style={{ backgroundColor: "var(--background)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {signUpErrors.password && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {signUpErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-confirm-password"
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Confirmar contraseña
                  <span style={{ color: "var(--destructive)" }}>*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={signUpData.confirmPassword}
                    onChange={handleSignUpInputChange}
                    className="h-10 pr-10"
                    style={{ backgroundColor: "var(--background)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {signUpErrors.confirmPassword && (
                  <p className="text-xs" style={{ color: "var(--destructive)" }}>
                    {signUpErrors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-primary-foreground"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear cuenta en Catalog"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
