'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Upload, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface SurfSession {
  id: string;
  title: string;
  description: string;
  image_url: string;
  location: string;
  wave_height: number;
  wave_period: number;
  wind_speed: number;
  wind_direction: string;
  tide_type: string;
  rating: number;
  created_at: string;
  user_id: string;
}

export default function EditSessionPage() {
  const [session, setSession] = useState<SurfSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [rating, setRating] = useState([3]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    wave_height: '',
    wave_period: '',
    wind_speed: '',
    wind_direction: '',
    tide_type: ''
  });
  
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchSession();
  }, [user, token, router, sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Session non trouvée');
          router.push('/profile');
          return;
        }
        throw new Error('Erreur lors du chargement de la session');
      }

      const data = await response.json();
      const sessionData = data.session;

      // Check if user owns this session
      if (sessionData.user_id !== user?.id) {
        toast.error('Vous n\'êtes pas autorisé à modifier cette session');
        router.push('/profile');
        return;
      }

      setSession(sessionData);
      setFormData({
        title: sessionData.title,
        description: sessionData.description || '',
        location: sessionData.location,
        wave_height: sessionData.wave_height.toString(),
        wave_period: sessionData.wave_period.toString(),
        wind_speed: sessionData.wind_speed.toString(),
        wind_direction: sessionData.wind_direction,
        tide_type: sessionData.tide_type
      });
      setRating([sessionData.rating]);
      
      if (sessionData.image_url) {
        setImagePreview(`http://localhost:5000${sessionData.image_url}`);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la session');
      console.error('Fetch session error:', error);
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setRemoveCurrentImage(false);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveCurrentImage(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const submitFormData = new FormData();
    
    // Add form fields
    Object.entries(formData).forEach(([key, value]) => {
      submitFormData.append(key, value);
    });
    
    // Add rating
    submitFormData.append('rating', rating[0].toString());
    
    // Handle image
    if (imageFile) {
      submitFormData.append('image', imageFile);
    } else if (removeCurrentImage) {
      submitFormData.append('keep_current_image', 'false');
    } else {
      submitFormData.append('keep_current_image', 'true');
    }

    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: submitFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la modification de la session');
      }

      toast.success('Session modifiée avec succès !');
      router.push('/profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/profile')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au profil
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Session non trouvée</h1>
            </div>
          </div>
        </header>
      </div>
    );
  }

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
                onClick={() => router.push('/profile')}
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
              Modifier la session
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Modifier votre session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Photo de la session</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {imagePreview && !removeCurrentImage ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <div className="flex justify-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('image')?.click()}
                        >
                          Changer la photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveImage}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
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
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Session matinale à Hossegor"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Spot *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Ex: Hossegor, France"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
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
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={formData.wave_height}
                      onChange={(e) => handleInputChange('wave_height', e.target.value)}
                      placeholder="1.5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wave_period">Période (s) *</Label>
                    <Input
                      id="wave_period"
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={formData.wave_period}
                      onChange={(e) => handleInputChange('wave_period', e.target.value)}
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
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.wind_speed}
                      onChange={(e) => handleInputChange('wind_speed', e.target.value)}
                      placeholder="15"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wind_direction">Direction du vent *</Label>
                    <Select 
                      value={formData.wind_direction} 
                      onValueChange={(value) => handleInputChange('wind_direction', value)}
                      required
                    >
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
                  <Select 
                    value={formData.tide_type} 
                    onValueChange={(value) => handleInputChange('tide_type', value)}
                    required
                  >
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
                  onClick={() => router.push('/profile')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Modification...' : 'Sauvegarder les modifications'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}