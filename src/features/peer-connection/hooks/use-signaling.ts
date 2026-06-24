import { GhostMeshPeer } from "@/infrastructure/webrtc";

export class SignalingService {
  private myUserId: string;

  constructor(myUserId: string) {
    this.myUserId = myUserId;
  }

  async sendSignal(type: "offer" | "answer", targetUserId: string, sdp: RTCSessionDescriptionInit) {
    console.log(`[Signaling] 📤 Sending ${type} to ${targetUserId}...`);
    
    const res = await fetch(`/api/signal/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        targetUserId, 
        senderUserId: this.myUserId, 
        sdp 
      }),
    });

    if (!res.ok) {
      console.error(`❌ Failed to send ${type}:`, res.status, await res.text());
    } else {
      console.log(`✅ Successfully sent ${type} to ${targetUserId}`);
    }
  }

  async pollSignal(type: "offer" | "answer", targetUserId: string): Promise<RTCSessionDescriptionInit | null> {
    const res = await fetch(`/api/signal/${type}?userId=${this.myUserId}`);
    const data = await res.json();
    
    if (data.status === `${type}_found`) {
      console.log(`[Signaling] 📥 Received ${type} from ${data.data.senderUserId}`);
      return data.data.sdp;
    }
    return null;
  }

  async sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit) {
    await fetch("/api/signal/ice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        targetUserId, 
        senderUserId: this.myUserId, 
        candidate 
      }),
    });
  }

  async pollIceCandidates(): Promise<RTCIceCandidateInit[]> {
    const res = await fetch(`/api/signal/ice?userId=${this.myUserId}`);
    const data = await res.json();
    
    if (data.status === "candidates_found") {
      return data.data.map((d: any) => d.candidate);
    }
    return [];
  }
}