import { PrivacyLevel } from '../../types';

class ProfileStore {
  private listeners: (() => void)[] = [];
  
  public userData = {
    bio: "",
    avatar: "",
    gallery: [] as string[],
    isPlus: false,
    privacy: {
      profileInfo: 'todos' as PrivacyLevel,
      confirmedEvents: 'amigos' as PrivacyLevel,
      messages: 'amigos' as PrivacyLevel
    },
    confirmedEventIds: [] as string[]
  };

  public friendships: Record<string, 'none' | 'requested' | 'friends'> = {};

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public updateProfile(data: Partial<typeof this.userData>) {
    this.userData = { ...this.userData, ...data };
    this.notify();
  }

  public confirmEvent(eventId: string) {
    if (!this.userData.confirmedEventIds.includes(eventId)) {
      this.userData.confirmedEventIds.push(eventId);
      this.notify();
    }
  }

  public updateFriendship(memberId: string, status: 'none' | 'requested' | 'friends') {
    this.friendships[memberId] = status;
    this.notify();
  }
}

export const profileStore = new ProfileStore();