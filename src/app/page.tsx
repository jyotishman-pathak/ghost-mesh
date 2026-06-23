import { Button } from "@/shared/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold tracking-tight text-cyan-400">GhostMesh</h1>
      <p className="text-gray-400">Zero-Knowledge • P2P • Post-Quantum Ready</p>
      
      <div className="flex gap-3 mt-6">
        <Button variant="default">Initialize Node</Button>
        <Button variant="outline">Connect Peer</Button>
      </div>
      
      <p className="text-xs text-gray-600 mt-8">Architecture: Feature-Sliced Design (FSD)</p>
    </div>
  );
}