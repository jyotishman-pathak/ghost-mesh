"use client";

import { useEffect, useRef, useState } from "react";
import { GhostMeshPeer, PeerState } from "@/infrastructure/webrtc";
import { SignalingService } from "./use-signaling";

interface UsePeerConnectionProps {
  myUserId: string;
  targetUserId: string;
  isInitiator: boolean;
}

export function usePeerConnection({ myUserId, targetUserId, isInitiator }: UsePeerConnectionProps) {
  const [state, setState] = useState<PeerState>("new");
  const [lastMessage, setLastMessage] = useState<string>("");
  const peerRef = useRef<GhostMeshPeer | null>(null);
  
  // FIX 1: Use a Ref to store interval IDs to avoid closure race conditions
  const intervalsRef = useRef({
    answer: null as NodeJS.Timeout | null,
    offer: null as NodeJS.Timeout | null,
    ice: null as NodeJS.Timeout | null,
  });

  useEffect(() => {
    if (!myUserId || !targetUserId) return;

    const peer = new GhostMeshPeer(isInitiator);
    const signaling = new SignalingService(myUserId);
    peerRef.current = peer;

    peer.onStateChange = (newState) => {
      setState(newState);
    };

    peer.onMessage = (msg) => setLastMessage(msg);
    
    peer.onIceCandidate = (candidate) => {
      signaling.sendIceCandidate(targetUserId, candidate);
    };

    const runSignaling = async () => {
      if (isInitiator) {
        const offer = await peer.createOffer();
        await signaling.sendSignal("offer", targetUserId, offer);
        console.log("[User A] Sent Offer. Polling for Answer...");

        intervalsRef.current.answer = setInterval(async () => {
          const answer = await signaling.pollSignal("answer", targetUserId);
          if (answer) {
            if (intervalsRef.current.answer) clearInterval(intervalsRef.current.answer);
            intervalsRef.current.answer = null;
            await peer.receiveAnswer(answer);
            console.log("[User A] Received Answer. Connecting...");
          }
        }, 1000);
      } else {
        intervalsRef.current.offer = setInterval(async () => {
          const offer = await signaling.pollSignal("offer", targetUserId);
          if (offer) {
            if (intervalsRef.current.offer) clearInterval(intervalsRef.current.offer);
            intervalsRef.current.offer = null;
            console.log("[User B] Received Offer. Creating Answer...");
            const answer = await peer.receiveOffer(offer);
            await signaling.sendSignal("answer", targetUserId, answer);
            console.log("[User B] Sent Answer.");
          }
        }, 1000);
      }

      // FIX 2: ICE Polling with auto-cleanup inside the interval
      intervalsRef.current.ice = setInterval(async () => {
        // BULLETPROOF CHECK: If the data channel is open, the P2P tunnel is fully established.
        // Stop polling for ICE candidates immediately to save bandwidth.
        if (peer.dataChannel?.readyState === "open") {
          console.log("[GhostMesh] ✅ Data channel open. Stopping ICE polling.");
          if (intervalsRef.current.ice) {
            clearInterval(intervalsRef.current.ice);
            intervalsRef.current.ice = null;
          }
          return;
        }

        const candidates = await signaling.pollIceCandidates();
        for (const c of candidates) {
          await peer.addIceCandidate(c);
        }
      }, 1000);
    };

    runSignaling();

    // Synchronous cleanup on unmount
    return () => {
      if (intervalsRef.current.answer) clearInterval(intervalsRef.current.answer);
      if (intervalsRef.current.offer) clearInterval(intervalsRef.current.offer);
      if (intervalsRef.current.ice) clearInterval(intervalsRef.current.ice);
      peer.destroy();
    };
  }, [myUserId, targetUserId, isInitiator]);

  const sendMessage = (msg: string) => {
    peerRef.current?.sendMessage(msg);
  };

  return { state, lastMessage, sendMessage };
}