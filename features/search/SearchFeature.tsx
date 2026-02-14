
import React, { useState, useMemo, useEffect } from 'react';
import { Event, User } from '../../types';
import { MemberProfileView } from '../../components/MemberProfileView';
import { friendshipStore, FriendshipStatus } from '../../lib/friendshipStore';
import { deepLinkStore } from '../../lib/deepLinkStore';
import { searchMembers, MemberProfile } from '../../lib/membersApi';
import { SearchHeader } from '../../components/search/SearchHeader';
import { SearchEventList } from '../../components/search/SearchEventList';
import { SearchMemberList } from '../../components/search/SearchMemberList';

interface SearchFeatureProps {
  events: Event[];
  setActiveTab?: (tab: any) => void;
  currentUser?: User | null;
  onBlockSocial?: () => void;
  onEventClick?: (eventId: string) => void;
}

export const SearchFeature: React.FC<SearchFeatureProps> = ({ events, setActiveTab, currentUser, onBlockSocial, onEventClick }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveSearchTab] = useState<'EVENTOS' | 'MEMBROS'>('EVENTOS');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  
  const [friendships, setFriendships] = useState(friendshipStore.getAll());

  useEffect(() => {
    const handleDeepLink = () => {
      const id = deepLinkStore.consumeOpenMemberProfile();
      if (id && currentUser) {
        setActiveSearchTab('MEMBROS');
      }
    };

    handleDeepLink();
    const subDeep = deepLinkStore.subscribe(handleDeepLink);
    const subFriends = friendshipStore.subscribe(() => setFriendships(friendshipStore.getAll()));

    return () => {
      subDeep();
      subFriends();
    };
  }, [currentUser]);

  useEffect(() => {
    if (activeTab !== 'MEMBROS' || !currentUser) return;

    if (!query.trim()) {
      setMembers([]);
      setIsLoadingMembers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingMembers(true);
      const results = await searchMembers(query);
      setMembers(results);
      setIsLoadingMembers(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, activeTab, currentUser]);

  const filteredEvents = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return events.filter(e => 
      e.title.toLowerCase().includes(q) || 
      e.city.toLowerCase().includes(q) || 
      e.location.toLowerCase().includes(q)
    );
  }, [query, events]);

  const handleAction = (e: React.MouseEvent, id: string, status: FriendshipStatus) => {
    e.stopPropagation();
    friendshipStore.setStatus(id, status);
  };

  const handleMessageRedirect = (memberId: string) => {
    deepLinkStore.setOpenChat(memberId);
    setActiveTab?.('messages');
    setSelectedMember(null);
  };

  const handleTabClick = (tab: 'EVENTOS' | 'MEMBROS') => {
    if (tab === 'MEMBROS' && !currentUser) {
      onBlockSocial?.();
      return;
    }
    setActiveSearchTab(tab);
  };

  if (selectedMember && currentUser) {
    return (
      <MemberProfileView 
        member={selectedMember} 
        onBack={() => setSelectedMember(null)} 
        onMessage={handleMessageRedirect}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black h-full animate-in fade-in duration-500 overflow-hidden">
      <SearchHeader 
        activeTab={activeTab}
        onTabChange={handleTabClick}
        query={query}
        onQueryChange={setQuery}
      />

      <div className="flex-1 overflow-y-auto px-6 no-scrollbar pb-10">
        {activeTab === 'EVENTOS' ? (
          <SearchEventList 
            events={filteredEvents}
            query={query}
            onEventClick={onEventClick}
          />
        ) : (
          <SearchMemberList 
            members={members}
            isLoading={isLoadingMembers}
            query={query}
            friendships={friendships}
            onMemberClick={setSelectedMember}
            onAction={handleAction}
          />
        )}
      </div>
    </div>
  );
};
