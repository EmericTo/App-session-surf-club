'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setStatus('error');
      setMessage('Token de réinitialisation manquant');
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Votre mot de passe a été réinitialisé avec succès !');
        toast.success('Mot de passe réinitialisé avec succès !');
        
        // Rediriger vers la connexion après 3 secondes
        setTimeout(() => {
          router.push('/auth');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Erreur lors de la réinitialisation');
        toast.error(data.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur de connexion au serveur');
      toast.error('Erreur de connexion au serveur');
      console.error('Reset password error:', error);
    }
  };

  if (status === 'error' && !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="Session Surf Club"
                width={64}
                height={64}
                className="rounded-full"
              />
            </div>
            <CardTitle className="text-2xl">Lien invalide</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <XCircle className="h-16 w-16 text-red-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Lien de réinitialisation invalide
              </h3>
              <p className="text-gray-600">
                Le lien de réinitialisation est manquant ou invalide
              </p>
            </div>
            <Button 
              onClick={() => router.push('/auth')}
              variant="outline"
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Session Surf Club"
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Réinitialiser le mot de passe
              </Button>
            </form>
          )}

          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600">Réinitialisation en cours...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Mot de passe réinitialisé !
                </h3>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Redirection automatique vers la connexion...
                </p>
              </div>
              <Button 
                onClick={() => router.push('/auth')}
                className="bg-green-600 hover:bg-green-700"
              >
                Se connecter maintenant
              </Button>
            </div>
          )}

          {status === 'error' && token && (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Erreur de réinitialisation
                </h3>
                <p className="text-gray-600">{message}</p>
              </div>
              <Button 
                onClick={() => router.push('/auth')}
                variant="outline"
              >
                Retour à la connexion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}