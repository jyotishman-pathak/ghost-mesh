import { redis } from "@/infrastructure/signaling";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUserId, senderUserId, candidate } = body;

    if (!targetUserId || !senderUserId || !candidate) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const redisKey = `signal:ice:${targetUserId}`;
    // FIX: Pass object directly
    await redis.lpush(redisKey, { senderUserId, candidate });
    await redis.expire(redisKey, 60);

    return NextResponse.json({ status: "candidate_stored" }, { status: 200 });
  } catch (error) {
    console.error("❌ Signal ICE POST Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const redisKey = `signal:ice:${userId}`;
    const candidates = await redis.lrange(redisKey, 0, -1);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ status: "no_candidates", data: [] }, { status: 200 });
    }

    await redis.del(redisKey);

    // FIX: Upstash automatically deserializes JSON strings in arrays back into objects!
    // So 'candidates' is already an array of objects. No need to JSON.parse.
    return NextResponse.json({ status: "candidates_found", data: candidates }, { status: 200 });
  } catch (error) {
    console.error("❌ Signal ICE GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}