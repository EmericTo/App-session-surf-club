'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SearchBar } from '@/components/ui/search-bar';
import { Input } from '@/components/ui/input';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { 
  Waves, 
  Wind, 
  Navigation, 
  Star, 
  MapPin, 
  Calendar,
  Plus,
  MessageCircle,
  User,
  LogOut,
  Heart,
  Send,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw
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
  username: string;
  user_id: string;
  avatar_url?: string;
  like_count: number;
  comment_count: number;
  user_liked: boolean;
}

export default function FeedPage() {
  const [sessions, setSessions] = useState<SurfSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const { user, token, logout } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchSessions();
  }, [user, token, router]);

  const fetchSessions = async () => {
    if (!token) {
      setError('Token manquant');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token expiré ou invalide
        toast.error('Session expirée, veuillez vous reconnecter');
        logout();
        router.push('/auth');
        return;
      }

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Fetch sessions error:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des sessions');
      
      
      if (error instanceof Error && error.message.includes('fetch')) {
        toast.error('Erreur de connexion au serveur.');
      } else {
        toast.error('Erreur lors du chargement des sessions');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (sessionId: string) => {
    if (loadingComments[sessionId] || !token) return;
    
    setLoadingComments(prev => ({ ...prev, [sessionId]: true }));
    
    try {
      const response = await fetch(`http://localhost:5000/api/comments/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        toast.error('Session expirée, veuillez vous reconnecter');
        logout();
        router.push('/auth');
        return;
      }

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
    if (!content || !token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/comments/session/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (response.status === 401 || response.status === 403) {
        toast.error('Session expirée, veuillez vous reconnecter');
        logout();
        router.push('/auth');
        return;
      }

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
    
    if (!token) return;
    
    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        toast.error('Session expirée, veuillez vous reconnecter');
        logout();
        router.push('/auth');
        return;
      }

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

  const handleLike = async (sessionId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/likes/session/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        toast.error('Session expirée, veuillez vous reconnecter');
        logout();
        router.push('/auth');
        return;
      }

      if (!response.ok) {
        throw new Error('Erreur lors du like');
      }

      const data = await response.json();
      
      // Update the session in the list
      setSessions(sessions.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              like_count: data.likeCount, 
              user_liked: data.liked 
            }
          : session
      ));
    } catch (error) {
      toast.error('Erreur lors du like');
      console.error('Like error:', error);
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

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleUserClick = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const handleCommentUserClick = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchSessions();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Image
                  src="/logo.png"
                  alt="Session Surf Club"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <h1 className="text-2xl font-bold text-gray-900">Session Surf Club</h1>
              </div>
              
              <nav className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* Error Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-red-500 mb-4">
                <Waves className="h-16 w-16 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-x-4">
                <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button variant="outline" onClick={() => router.push('/auth')}>
                  Se reconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image
                src="/logo.png"
                alt="Session Surf Club"
                width={48}
                height={48}
                className="rounded-full"
              />
              <h1 className="text-2xl font-bold text-gray-900">Session Surf Club</h1>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <SearchBar />
            </div>
            
            <nav className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/create-session')}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle session
              </Button>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/messages')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages
                </Button>
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Profil
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Feed des sessions</h2>
          <p className="text-gray-600">Découvrez les dernières sessions partagées par la communauté</p>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Waves className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune session pour le moment</h3>
              <p className="text-gray-600 mb-6">
                Soyez le premier à partager une session !
              </p>
              <Button onClick={() => router.push('/create-session')}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sessions.map((session) => (
              <Card key={session.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer hover:opacity-80"
                      onClick={() => handleUserClick(session.user_id)}
                    >
                      <Avatar className="h-10 w-10">
                        {session.avatar_url ? (
                          <AvatarImage 
                            src={`http://localhost:5000${session.avatar_url}`} 
                            alt={session.username}
                          />
                        ) : (
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900 hover:text-blue-600">
                          {session.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(session.created_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
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

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(session.id)}
                        className={`${session.user_liked ? 'text-red-600' : 'text-gray-600'} hover:text-red-600`}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${session.user_liked ? 'fill-current' : ''}`} />
                        {session.like_count}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-blue-600"
                        onClick={() => toggleComments(session.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {expandedComments[session.id] && comments[session.id] 
                          ? comments[session.id].length 
                          : session.comment_count}
                        {expandedComments[session.id] ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </Button>
                    </div>
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