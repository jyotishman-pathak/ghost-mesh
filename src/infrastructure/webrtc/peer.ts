import { RTC_CONFIG } from "./config";

export type PeerState = "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed";

export class GhostMeshPeer {
  private pc: RTCPeerConnection;
  public dataChannel: RTCDataChannel | null = null;
  
  // Callbacks for the UI to listen to
  public onMessage: ((msg: string) => void) | null = null;
  public onStateChange: ((state: PeerState) => void) | null = null;
  
  // CHANGE: Use RTCIceCandidateInit instead of the native object
  public onIceCandidate: ((candidate: RTCIceCandidateInit) => void) | null = null;

  constructor(isInitiator: boolean) {
    this.pc = new RTCPeerConnection(RTC_CONFIG);

    if (isInitiator) {
      this.dataChannel = this.pc.createDataChannel("ghostmesh-transfer", {
        ordered: true,
      });
      this.setupDataChannel(this.dataChannel);
    }

    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel(this.dataChannel);
    };

    // FIX: Use .toJSON() to ensure it serializes cleanly for the API
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate.toJSON());
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.onStateChange) {
        this.onStateChange(this.pc.connectionState as PeerState);
      }
    };
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onmessage = (event) => {
      if (this.onMessage) this.onMessage(event.data);
    };
    
    channel.onopen = () => console.log("[GhostMesh] Data channel opened");
    channel.onclose = () => console.log("[GhostMesh] Data channel closed");
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  public async receiveOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  public async receiveAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.pc.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  public sendMessage(message: string) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(message);
    } else {
      console.warn("[GhostMesh] Cannot send message, channel not open. State:", this.dataChannel?.readyState);
    }
  }

  public destroy() {
    if (this.dataChannel) this.dataChannel.close();
    this.pc.close();
  }
}