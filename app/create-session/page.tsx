'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Upload, Star } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function CreateSessionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rating, setRating] = useState([3]);
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Add the image file if selected
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    // Add rating
    formData.append('rating', rating[0].toString());

    try {
      const response = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création de la session');
      }

      toast.success('Session créée avec succès !');
      router.push('/feed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/feed')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Image
                src="/logo.png"
                alt="Session Surf Club"
                width={32}
                height={32}
                className="rounded-full"
              />
              <h1 className="text-xl font-semibold text-gray-900">Session Surf Club</h1>
            </div>
            <div className="text-sm text-gray-600">
              Nouvelle session
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Partagez votre session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Photo de la session</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        Changer la photo
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Cliquez pour ajouter une photo</p>
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image')?.click()}
                      >
                        Choisir une photo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de la session *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Ex: Session matinale à Hossegor"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Spot *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Ex: Hossegor, France"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Décrivez votre session..."
                  rows={3}
                />
              </div>

              {/* Wave Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Conditions de houle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wave_height">Hauteur des vagues (m) *</Label>
                    <Input
                      id="wave_height"
                      name="wave_height"
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      placeholder="1.5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wave_period">Période (s) *</Label>
                    <Input
                      id="wave_period"
                      name="wave_period"
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      placeholder="12"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Wind Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Conditions de vent</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wind_speed">Vitesse du vent (km/h) *</Label>
                    <Input
                      id="wind_speed"
                      name="wind_speed"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="15"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wind_direction">Direction du vent *</Label>
                    <Select name="wind_direction" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N">Nord</SelectItem>
                        <SelectItem value="NE">Nord-Est</SelectItem>
                        <SelectItem value="E">Est</SelectItem>
                        <SelectItem value="SE">Sud-Est</SelectItem>
                        <SelectItem value="S">Sud</SelectItem>
                        <SelectItem value="SW">Sud-Ouest</SelectItem>
                        <SelectItem value="W">Ouest</SelectItem>
                        <SelectItem value="NW">Nord-Ouest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Tide Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Conditions de marée</h3>
                <div className="space-y-2">
                  <Label htmlFor="tide_type">Type de marée *</Label>
                  <Select name="tide_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Marée basse</SelectItem>
                      <SelectItem value="rising">Marée montante</SelectItem>
                      <SelectItem value="high">Marée haute</SelectItem>
                      <SelectItem value="falling">Marée descendante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-4">
                <Label>Note de la session *</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-6 w-6 cursor-pointer ${
                          i < rating[0] ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                        onClick={() => setRating([i + 1])}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">{rating[0]}/5</span>
                  </div>
                  <Slider
                    value={rating}
                    onValueChange={setRating}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/feed')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Création...' : 'Publier la session'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}