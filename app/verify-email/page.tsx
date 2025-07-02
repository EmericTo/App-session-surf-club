'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant');
      return;
    }
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès !');
        toast.success('Email vérifié avec succès !');
        
        // Rediriger vers la connexion après 3 secondes
        setTimeout(() => {
          router.push('/auth');
        }, 3000);
      } else {
        if (data.message?.includes('expired')) {
          setStatus('expired');
          setMessage('Le lien de vérification a expiré');
        } else {
          setStatus('error');
          setMessage(data.message || 'Erreur lors de la vérification');
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur de connexion au serveur');
      console.error('Verify email error:', error);
    }
  };

  const handleResendVerification = async () => {
    // Cette fonction nécessiterait l'email de l'utilisateur
    // Pour simplifier, on redirige vers la page de connexion
    router.push('/auth');
  };

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
          <CardTitle className="text-2xl">Vérification d'email</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600">Vérification en cours...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Vérification réussie !
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

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Erreur de vérification
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

          {status === 'expired' && (
            <div className="space-y-4">
              <Mail className="h-16 w-16 text-orange-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  Lien expiré
                </h3>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Vous pouvez demander un nouveau lien de vérification
                </p>
              </div>
              <Button 
                onClick={() => router.push('/auth')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Demander un nouveau lien
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}