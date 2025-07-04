'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Waves, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const { login, register, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      router.push('/feed');
    }
  }, [user, router]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setActiveTab('register');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setShowVerificationAlert(false);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      toast.success('Connexion réussie !');
      router.push('/feed');
    } catch (error: any) {
      if (error.message?.includes('verify your email')) {
        setShowVerificationAlert(true);
        setUserEmail(email);
        toast.error('Veuillez vérifier votre email avant de vous connecter');
      } else {
        toast.error(error instanceof Error ? error.message : 'Erreur de connexion');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      await register(email, username, password);
      toast.success('Compte créé ! Vérifiez votre email pour l\'activer.');
      setShowVerificationAlert(true);
      setUserEmail(email);
      setActiveTab('login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) return;
    
    setResendingVerification(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Email de vérification renvoyé !');
      } else {
        toast.error(data.message || 'Erreur lors du renvoi');
      }
    } catch (error) {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/ocean.jpeg.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Image
                src="/logo.png"
                alt="Session Surf Club"
                width={48}
                height={48}
                className="rounded-full"
              />
              <h1 className="text-3xl font-bold text-white">Session Surf Club</h1>
            </div>
            <p className="text-white/80">Rejoignez la communauté des surfeurs</p>
          </div>

          {/* Verification Alert */}
          {showVerificationAlert && (
            <Alert className="mb-6 bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-2">
                  <p>Votre compte nécessite une vérification par email.</p>
                  <p className="text-sm">Vérifiez votre boîte de réception et vos spams.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="mt-2 text-orange-700 border-orange-300 hover:bg-orange-100"
                  >
                    {resendingVerification ? 'Envoi...' : 'Renvoyer l\'email'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card className="bg-white/95 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-center">
                {activeTab === 'login' ? 'Connexion' : 'Créer un compte'}
              </CardTitle>
              <CardDescription className="text-center">
                {activeTab === 'login' 
                  ? 'Connectez-vous à votre compte' 
                  : 'Rejoignez la communauté Session Surf Club'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Connexion</TabsTrigger>
                  <TabsTrigger value="register">Inscription</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="text-right">
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm text-blue-600 hover:text-blue-700 p-0"
                        onClick={() => router.push('/forgot-password')}
                      >
                        Mot de passe oublié ?
                      </Button>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Nom d'utilisateur</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="votre_nom"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Création...' : 'Créer le compte'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Button 
              variant="ghost" 
              className="text-white hover:text-black hover:bg-white"
              onClick={() => router.push('/')}
            >
              ← Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}