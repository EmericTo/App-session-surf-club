'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Waves, Users, MessageCircle, Camera } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/feed');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Image
                src="/logo.png"
                alt="Session Surf Club"
                width={48}
                height={48}
                className="rounded-full"
              />
              <h1 className="text-2xl font-bold text-white">Session Surf Club</h1>
            </div>
            <div className="space-x-4">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => router.push('/auth')}
              >
                Connexion
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push('/auth?mode=register')}
              >
                S'inscrire
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm mb-12">
              <CardContent className="p-8">
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  Partagez vos sessions de surf
                </h2>
                <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                  Rejoignez la communauté des surfeurs et partagez vos meilleures sessions avec des photos et toutes les conditions de surf.
                </p>
              </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <Camera className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Partagez vos photos</h3>
                  <p className="text-white/80">Immortalisez vos sessions avec de belles photos</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <Waves className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Conditions détaillées</h3>
                  <p className="text-white/80">Notez les conditions de houle, vent et marée</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Communauté</h3>
                  <p className="text-white/80">Échangez avec d'autres passionnés de surf</p>
                </CardContent>
              </Card>
            </div>

            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              onClick={() => router.push('/auth?mode=register')}
            >
              Commencer maintenant
            </Button>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center">
          <p className="text-white/60">© 2024 Session Surf Club. Tous droits réservés.</p>
        </footer>
      </div>
    </div>
  );
}