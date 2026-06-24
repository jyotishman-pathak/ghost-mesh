export interface SignalPayload {
    targetUserId : string,
    senderUserId : string,
    sdp : RTCSessionDescriptionInit // The actual WebRTC offer/answer data
}


