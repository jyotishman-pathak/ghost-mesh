import { RTC_CONFIG } from "./config";
import { PeerState } from "./types";


export class GhostMeshPeer {
    private pc: RTCPeerConnection;
    public dataChannel: RTCDataChannel | null = null


    public onMessage: ((msg: string) => void) | null = null;
    public onStateChange: ((state: PeerState) => void) | null = null;
    public onIceCandidate: ((candidate: RTCIceCandidate) => void) | null = null;



    constructor(isInitiator: boolean) {
        this.pc = new RTCPeerConnection(RTC_CONFIG)

        if (isInitiator) {
            this.dataChannel = this.pc.createDataChannel("ghostmesh-trasnfer", {
                ordered: true,
            });
            this.setupDataChannel(this.dataChannel);
        }

        this.pc.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannel(this.dataChannel);
        };

        this.pc.onicecandidate = (event) => {
            if (event.candidate && this.onIceCandidate) {
                this.onIceCandidate(event.candidate);
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

    // --- WebRTC Signaling Methods ---

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
        // Only add candidate if remote description is set
        if (this.pc.remoteDescription) {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    public sendMessage(message: string) {
        if (this.dataChannel && this.dataChannel.readyState === "open") {
            this.dataChannel.send(message);
        } else {
            console.warn("[GhostMesh] Cannot send message, channel not open.");
        }
    }

    public destroy() {
        if (this.dataChannel) this.dataChannel.close();
        this.pc.close();
    }
}




