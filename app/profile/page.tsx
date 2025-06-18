'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import { 
  ArrowLeft, 
  Waves, 
  Wind, 
  Navigation, 
  Star, 
  MapPin, 
  Calendar,
  Trash2,
  Heart,
  MessageCircle,
  User,
  Camera,
  Upload,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  username: string;
  user_id: string;
  avatar_url?: string;
}

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
  like_count: number;
  comment_count: number;
}

interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  session_count: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SurfSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; sessionId: string; commentId: string; isLoading: boolean }>({
    isOpen: false,
    sessionId: '',
    commentId: '',
    isLoading: false
  });
  const { user, token, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchProfile();
    fetchUserSessions();
  }, [user, token, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du profil');
      }

      const data = await response.json();
      setProfile(data.user);
    } catch (error) {
      toast.error('Erreur lors du chargement du profil');
      console.error('Fetch profile error:', error);
    }
  };

  const fetchUserSessions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sessions/my-sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des sessions');
      }

      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      toast.error('Erreur lors du chargement des sessions');
      console.error('Fetch sessions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (sessionId: string) => {
    if (loadingComments[sessionId]) return;
    
    setLoadingComments(prev => ({ ...prev, [sessionId]: true }));
    
    try {
      const response = await fetch(`http://localhost:5000/api/comments/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des commentaires');
      }

      const data = await response.json();
      setComments(prev => ({ ...prev, [sessionId]: data.comments }));
    } catch (error) {
      toast.error('Erreur lors du chargement des commentaires');
      console.error('Fetch comments error:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const toggleComments = async (sessionId: string) => {
    const isExpanded = expandedComments[sessionId];
    
    if (!isExpanded) {
      // Expanding - fetch comments if not already loaded
      if (!comments[sessionId]) {
        await fetchComments(sessionId);
      }
    }
    
    setExpandedComments(prev => ({ ...prev, [sessionId]: !isExpanded }));
  };

  const handleAddComment = async (sessionId: string) => {
    const content = newComments[sessionId]?.trim();
    if (!content) return;

    try {
      const response = await fetch(`http://localhost:5000/api/comments/session/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du commentaire');
      }

      const data = await response.json();
      
      // Update comments list - add the new comment at the beginning (most recent first)
      setComments(prev => ({
        ...prev,
        [sessionId]: [data.comment, ...(prev[sessionId] || [])]
      }));
      
      // Get the updated comment count from the comments array length
      const updatedCommentsCount = (comments[sessionId] || []).length + 1;
      
      // Update session comment count with the real count
      setSessions(sessions.map(session => 
        session.id === sessionId 
          ? { ...session, comment_count: updatedCommentsCount }
          : session
      ));
      
      // Clear input
      setNewComments(prev => ({ ...prev, [sessionId]: '' }));
      
      toast.success('Commentaire ajouté !');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
      console.error('Add comment error:', error);
    }
  };

  const openDeleteModal = (sessionId: string, commentId: string) => {
    setDeleteModal({
      isOpen: true,
      sessionId,
      commentId,
      isLoading: false
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      sessionId: '',
      commentId: '',
      isLoading: false
    });
  };

  const handleDeleteComment = async () => {
    const { sessionId, commentId } = deleteModal;
    
    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du commentaire');
      }

      // Remove comment from the list
      setComments(prev => ({
        ...prev,
        [sessionId]: prev[sessionId]?.filter(comment => comment.id !== commentId) || []
      }));

      // Update session comment count
      const updatedCommentsCount = Math.max(0, (comments[sessionId] || []).length - 1);
      setSessions(sessions.map(session => 
        session.id === sessionId 
          ? { ...session, comment_count: updatedCommentsCount }
          : session
      ));

      toast.success('Commentaire supprimé !');
      closeDeleteModal();
    } catch (error) {
      toast.error('Erreur lors de la suppression du commentaire');
      console.error('Delete comment error:', error);
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('http://localhost:5000/api/users/avatar', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload de l\'avatar');
      }

      const data = await response.json();
      
      // Update profile state
      setProfile(prev => prev ? { ...prev, avatar_url: data.user.avatar_url } : null);
      
      // Update auth context
      updateUser({ avatar_url: data.user.avatar_url });
      
      toast.success('Avatar mis à jour avec succès !');
    } catch (error) {
      toast.error('Erreur lors de l\'upload de l\'avatar');
      console.error('Avatar upload error:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setSessions(sessions.filter(session => session.id !== sessionId));
      toast.success('Session supprimée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error('Delete session error:', error);
    }
  };

  const getWindDirectionText = (direction: string) => {
    const directions: { [key: string]: string } = {
      'N': 'Nord', 'NE': 'Nord-Est', 'E': 'Est', 'SE': 'Sud-Est',
      'S': 'Sud', 'SW': 'Sud-Ouest', 'W': 'Ouest', 'NW': 'Nord-Ouest'
    };
    return directions[direction] || direction;
  };

  const getTideTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      'low': 'Marée basse',
      'rising': 'Marée montante',
      'high': 'Marée haute',
      'falling': 'Marée descendante'
    };
    return types[type] || type;
  };

  const handleCommentUserClick = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              Mon profil
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        {profile && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {profile.avatar_url ? (
                      <AvatarImage 
                        src={`http://localhost:5000${profile.avatar_url}`} 
                        alt={profile.username}
                      />
                    ) : (
                      <AvatarFallback className="text-2xl">
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <CardTitle className="text-2xl">{profile.username}</CardTitle>
                  <p className="text-gray-600">{profile.email}</p>
                  <p className="text-sm text-gray-500">
                    Membre depuis {format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
                  <div className="text-sm text-gray-600">Sessions partagées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sessions.length > 0 ? (sessions.reduce((acc, s) => acc + s.rating, 0) / sessions.length).toFixed(1) : '0'}
                  </div>
                  <div className="text-sm text-gray-600">Note moyenne</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {sessions.reduce((acc, s) => acc + s.comment_count, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Commentaires reçus</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes sessions</h2>
          
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Waves className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune session pour le moment</h3>
                <p className="text-gray-600 mb-6">Commencez à partager vos sessions de surf !</p>
                <Button onClick={() => router.push('/create-session')}>
                  Créer ma première session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sessions.map((session) => (
                <Card key={session.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < session.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-500">
                          {format(new Date(session.created_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{session.title}</h3>
                      {session.description && (
                        <p className="text-gray-700 mb-4">{session.description}</p>
                      )}
                    </div>

                    {session.image_url && (
                      <div className="rounded-lg overflow-hidden">
                        <img
                          src={`http://localhost:5000${session.image_url}`}
                          alt={session.title}
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{session.location}</span>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Waves className="h-4 w-4 text-blue-600 mr-1" />
                          <span className="text-sm font-medium text-gray-900">Houle</span>
                        </div>
                        <p className="text-sm text-gray-600">{session.wave_height}m</p>
                        <p className="text-xs text-gray-500">{session.wave_period}s</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Wind className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm font-medium text-gray-900">Vent</span>
                        </div>
                        <p className="text-sm text-gray-600">{session.wind_speed} km/h</p>
                        <p className="text-xs text-gray-500">{getWindDirectionText(session.wind_direction)}</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Navigation className="h-4 w-4 text-purple-600 mr-1" />
                          <span className="text-sm font-medium text-gray-900">Marée</span>
                        </div>
                        <p className="text-sm text-gray-600">{getTideTypeText(session.tide_type)}</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Star className="h-4 w-4 text-yellow-600 mr-1" />
                          <span className="text-sm font-medium text-gray-900">Note</span>
                        </div>
                        <p className="text-sm text-gray-600">{session.rating}/5</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Stats */}
                    <div className="flex items-center justify-center space-x-6">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>{session.like_count} likes</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-blue-600"
                        onClick={() => toggleComments(session.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {expandedComments[session.id] && comments[session.id] 
                          ? comments[session.id].length 
                          : session.comment_count} commentaires
                        {expandedComments[session.id] ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments[session.id] && (
                      <div className="mt-4 space-y-4">
                        <Separator />
                        
                        {/* Add Comment */}
                        <div className="flex space-x-2">
                          <Avatar className="h-8 w-8">
                            {user?.avatar_url ? (
                              <AvatarImage 
                                src={`http://localhost:5000${user.avatar_url}`} 
                                alt={user.username}
                              />
                            ) : (
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 flex space-x-2">
                            <Input
                              placeholder="Ajouter un commentaire..."
                              value={newComments[session.id] || ''}
                              onChange={(e) => setNewComments(prev => ({ 
                                ...prev, 
                                [session.id]: e.target.value 
                              }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment(session.id);
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddComment(session.id)}
                              disabled={!newComments[session.id]?.trim()}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Comments List with Native Scroll */}
                        {loadingComments[session.id] ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          </div>
                        ) : (
                          <div 
                            className="max-h-80 overflow-y-auto pr-2 space-y-3"
                            style={{
                              scrollbarWidth: 'thin',
                              scrollbarColor: '#cbd5e1 #f1f5f9'
                            }}
                          >
                            {comments[session.id]?.map((comment) => (
                              <div key={comment.id} className="flex space-x-3">
                                <Avatar 
                                  className="h-8 w-8 flex-shrink-0 cursor-pointer hover:opacity-80"
                                  onClick={() => handleCommentUserClick(comment.user_id)}
                                >
                                  {comment.avatar_url ? (
                                    <AvatarImage 
                                      src={`http://localhost:5000${comment.avatar_url}`} 
                                      alt={comment.username}
                                    />
                                  ) : (
                                    <AvatarFallback>
                                      <User className="h-4 w-4" />
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                                    <div className="flex items-center justify-between">
                                      <p 
                                        className="font-semibold text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                                        onClick={() => handleCommentUserClick(comment.user_id)}
                                      >
                                        {comment.username}
                                      </p>
                                      {comment.user_id === user?.id && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openDeleteModal(session.id, comment.id)}
                                          className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-gray-700 break-words">{comment.content}</p>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {format(new Date(comment.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {comments[session.id]?.length === 0 && (
                              <p className="text-gray-500 text-center py-4">
                                Aucun commentaire pour le moment
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteComment}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}