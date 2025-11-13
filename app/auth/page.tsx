import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Авторизация | AI Legal Assistant",
  description: "Войдите в свой аккаунт или создайте новый",
};

export default function AuthPage() {
  return <AuthForm />;
}

