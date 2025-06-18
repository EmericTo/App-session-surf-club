'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Search, 
  Send, 
  MessageCircle,
  Users,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

interface Conversation {
  other_user_id: string;
  other_username: string;
  other_avatar_url?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender_username: string;
  receiver_username: string;
}

interface SearchUser {
  id: string;
  username: string;
  avatar_url?: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchConversations();

    // Check if we should start a conversation with a specific user
    const userParam = searchParams.get('user');
    if (userParam) {
      setSelectedConversation(userParam);
      fetchMessages(userParam);
    }
  }, [user, token, router, searchParams]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des conversations');
      }

      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      toast.error('Erreur lors du chargement des conversations');
      console.error('Fetch conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des messages');
      }

      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      toast.error('Erreur lors du chargement des messages');
      console.error('Fetch messages error:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      setSearchResults(data.users);
    } catch (error) {
      console.error('Search users error:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const response = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: selectedConversation,
          content: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

      setNewMessage('');
      await fetchMessages(selectedConversation);
      await fetchConversations();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
      console.error('Send message error:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const startConversation = (userId: string) => {
    setSelectedConversation(userId);
    setSearchQuery('');
    setSearchResults([]);
    fetchMessages(userId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const selectedUser = conversations.find(c => c.other_user_id === selectedConversation);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Messages
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Conversations
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="p-4 border-b">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Résultats de recherche</h4>
                    {searchResults.map((searchUser) => (
                      <div
                        key={searchUser.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => startConversation(searchUser.id)}
                      >
                        <Avatar className="h-8 w-8">
                          {searchUser.avatar_url ? (
                            <AvatarImage 
                              src={`http://localhost:5000${searchUser.avatar_url}`} 
                              alt={searchUser.username}
                            />
                          ) : (
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm font-medium">{searchUser.username}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conversations */}
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Aucune conversation</p>
                    <p className="text-sm">Recherchez un utilisateur pour commencer</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.other_user_id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedConversation === conversation.other_user_id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedConversation(conversation.other_user_id);
                        fetchMessages(conversation.other_user_id);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          {conversation.other_avatar_url ? (
                            <AvatarImage 
                              src={`http://localhost:5000${conversation.other_avatar_url}`} 
                              alt={conversation.other_username}
                            />
                          ) : (
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.other_username}
                            </p>
                            {conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.last_message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(conversation.last_message_time), 'dd/MM HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      {selectedUser?.other_avatar_url ? (
                        <AvatarImage 
                          src={`http://localhost:5000${selectedUser.other_avatar_url}`} 
                          alt={selectedUser.other_username}
                        />
                      ) : (
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {selectedUser?.other_username}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-[500px]">
                  {/* Messages */}
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender_id === user?.id
                                  ? 'text-blue-100'
                                  : 'text-gray-500'
                              }`}
                            >
                              {format(new Date(message.created_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
                  <p>Choisissez une conversation ou recherchez un utilisateur pour commencer à échanger</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}