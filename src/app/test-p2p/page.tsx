"use client";

import { useState } from "react";
import { usePeerConnection } from "@/features/peer-connection/hooks/use-peer-connection";
import { Button } from "@/shared/ui/button";

export default function TestP2PPage() {
  // Hardcoded for testing. In prod, this comes from Auth/DB.
  const [myId, setMyId] = useState("user-A-id");
  const [targetId, setTargetId] = useState("user-B-id");
  const [isInitiator, setIsInitiator] = useState(true);
  const [msgInput, setMsgInput] = useState("");

  const { state, lastMessage, sendMessage } = usePeerConnection({
    myUserId: myId,
    targetUserId: targetId,
    isInitiator,
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 bg-gray-950 text-white">
      <h1 className="text-3xl font-bold text-cyan-400">GhostMesh P2P Test</h1>
      
      <div className="flex gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center">
          <p className="text-xs text-gray-400">My ID</p>
          <input 
            value={myId} 
            onChange={(e) => setMyId(e.target.value)}
            className="bg-gray-800 p-2 rounded text-center text-sm w-32"
          />
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Target ID</p>
          <input 
            value={targetId} 
            onChange={(e) => setTargetId(e.target.value)}
            className="bg-gray-800 p-2 rounded text-center text-sm w-32"
          />
        </div>
        <div className="flex items-end">
           <Button 
             variant={isInitiator ? "default" : "outline"} 
             onClick={() => setIsInitiator(!isInitiator)}
           >
             {isInitiator ? "I am User A (Initiator)" : "I am User B (Receiver)"}
           </Button>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg">Connection State: <span className="font-mono text-cyan-400">{state}</span></p>
        <p className="text-sm text-gray-400">Last Message: <span className="font-mono text-green-400">{lastMessage || "None"}</span></p>
      </div>

      <div className="flex gap-2">
        <input 
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          placeholder="Type a message..."
          className="bg-gray-800 border border-gray-700 p-2 rounded w-64"
        />
        <Button onClick={() => {
          if(msgInput) {
            sendMessage(msgInput);
            setMsgInput("");
          }
        }}>
          Send via P2P
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-8 max-w-md text-center">
        Open this page in TWO tabs. Set one to User A (Initiator) and the other to User B (Receiver). 
        Click "Initialize" logic triggers automatically. Watch the state change to "connected"!
      </p>
    </div>
  );
}