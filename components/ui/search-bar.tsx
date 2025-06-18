'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, User } from 'lucide-react';

interface SearchUser {
  id: string;
  username: string;
  avatar_url?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.length >= 2) {
        searchUsers(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  const searchUsers = async (searchQuery: string) => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.users || []);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (selectedUser: SearchUser) => {
    if (selectedUser.id === user?.id) {
      router.push('/profile');
    } else {
      router.push(`/user/${selectedUser.id}`);
    }
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.length >= 2) {
      searchUsers(query);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-4"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : results.length > 0 ? (
            results.map((searchUser) => (
              <div
                key={searchUser.id}
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleUserClick(searchUser)}
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
                <span className="text-sm font-medium">
                  {searchUser.username}
                  {searchUser.id === user?.id && (
                    <span className="text-xs text-gray-500 ml-2">(Vous)</span>
                  )}
                </span>
              </div>
            ))
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Aucun utilisateur trouvé</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}