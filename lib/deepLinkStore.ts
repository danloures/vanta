
class DeepLinkStore {
  private listeners: (() => void)[] = [];
  private pendingMemberId: string | null = null;
  private pendingChatMemberId: string | null = null;
  private pendingVipEventId: string | null = null;
  private pendingCommunityId: string | null = null;
  private pendingIndicaId: string | null = null;
  private pendingEventShareContext: any | null = null;

  public setOpenMemberProfile(memberId: string) {
    this.pendingMemberId = memberId;
    this.notify();
  }

  public consumeOpenMemberProfile(): string | null {
    const id = this.pendingMemberId;
    this.pendingMemberId = null;
    return id;
  }

  public setOpenChat(memberId: string) {
    this.pendingChatMemberId = memberId;
    this.notify();
  }

  public consumeOpenChat(): string | null {
    const id = this.pendingChatMemberId;
    this.pendingChatMemberId = null;
    return id;
  }

  public setTriggerVipInvite(eventId: string) {
    this.pendingVipEventId = eventId;
    this.notify();
  }

  public consumeTriggerVipInvite(): string | null {
    const id = this.pendingVipEventId;
    this.pendingVipEventId = null;
    return id;
  }

  // VANTA_DEEP_LINK: Community Profile Support
  public setOpenCommunityProfile(communityId: string) {
    this.pendingCommunityId = communityId;
    this.notify();
  }

  public setOpenCommunity(communityId: string) {
    this.setOpenCommunityProfile(communityId);
  }

  public consumeOpenCommunityProfile(): string | null {
    const id = this.pendingCommunityId;
    this.pendingCommunityId = null;
    return id;
  }

  // VANTA_DEEP_LINK: Vanta Indica Support
  public setOpenVantaIndica(indicaId: string) {
    this.pendingIndicaId = indicaId;
    this.notify();
  }

  public consumeOpenVantaIndica(): string | null {
    const id = this.pendingIndicaId;
    this.pendingIndicaId = null;
    return id;
  }

  // VANTA_DEEP_LINK: Event Share Context
  public setEventShareContext(context: any) {
    this.pendingEventShareContext = context;
    this.notify();
  }

  public consumeEventShareContext(): any | null {
    const ctx = this.pendingEventShareContext;
    this.pendingEventShareContext = null;
    return ctx;
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const deepLinkStore = new DeepLinkStore();
