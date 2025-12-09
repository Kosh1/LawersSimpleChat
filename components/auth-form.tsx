"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Ссылка на Calendly для записи на консультацию
  const CALENDLY_URL = "https://calendly.com/glebtuzov/30-minute-call-with-tuzov-gleb-opencv?month=2025-12";

  // Check if form is valid for submission
  const isFormValid = email.trim() !== "" && password.trim() !== "" && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Пароль должен содержать минимум 6 символов",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }

      toast({
        title: "Вход выполнен",
        description: "Добро пожаловать!",
      });

      router.push("/");
      router.refresh();
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка входа",
        description: error.message || "Проверьте введенные данные и попробуйте снова",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalendlyClick = () => {
    window.open(CALENDLY_URL, '_blank');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Войти
          </CardTitle>
          <CardDescription>
            Введите email и пароль для входа
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full transition-all duration-200"
              disabled={loading || !isFormValid}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Войти
            </Button>
            <div className="text-center space-y-2 w-full">
              <p className="text-sm text-muted-foreground">
                Нет доступа к системе?
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCalendlyClick}
                disabled={loading}
              >
                Записаться на консультацию
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

