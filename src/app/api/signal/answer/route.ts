import { redis } from "@/infrastructure/signaling";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(`[API] 📥 Received ANSWER POST:`, body);

    const { targetUserId, senderUserId, sdp } = body;

    if (!targetUserId || !senderUserId || !sdp) {
      console.error("[API] ❌ Missing fields in ANSWER POST");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const redisKey = `signal:answer:${targetUserId}`;
    // FIX: Pass object directly
    await redis.set(redisKey, { senderUserId, sdp }, { ex: 60 });
    console.log(`[API] ✅ Stored ANSWER at key: ${redisKey}`);

    return NextResponse.json({ status: "answer_stored" }, { status: 200 });
  } catch (error) {
    console.error("❌ Signal Answer POST Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const redisKey = `signal:answer:${userId}`;
    const answerData = await redis.get(redisKey);

    if (!answerData) {
      return NextResponse.json({ status: "no_answer" }, { status: 200 });
    }

    await redis.del(redisKey);
    console.log(`[API] 📤 Consumed ANSWER from key: ${redisKey}`);

    // FIX: answerData is ALREADY an object
    return NextResponse.json({ status: "answer_found", data: answerData }, { status: 200 });
  } catch (error) {
    console.error("❌ Signal Answer GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}