import { LoginForm } from "@/components/admin/login-form";
import { prisma } from "@/lib/db";

export default async function LoginPage() {
  // Sign-up is only offered while the instance has no users yet.
  const userCount = await prisma.user.count();

  return <LoginForm allowSignup={userCount === 0} />;
}
