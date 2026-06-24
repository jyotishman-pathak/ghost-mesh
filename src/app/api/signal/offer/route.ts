import { redis } from "@/infrastructure/signaling";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(`[API] 📥 Received OFFER POST:`, body);

    const { targetUserId, senderUserId, sdp } = body;

    if (!targetUserId || !senderUserId || !sdp) {
      console.error("[API] ❌ Missing fields in OFFER POST");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const redisKey = `signal:offer:${targetUserId}`;
    // FIX: Pass the object directly. Upstash handles the JSON.stringify for us.
    await redis.set(redisKey, { senderUserId, sdp }, { ex: 60 });
    console.log(`[API] ✅ Stored OFFER at key: ${redisKey}`);

    return NextResponse.json({ status: "offer_stored" }, { status: 200 });
  } catch (error) {
    console.error("❌ Signal Offer POST Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const redisKey = `signal:offer:${userId}`;
    const offerData = await redis.get(redisKey);

    if (!offerData) {
      return NextResponse.json({ status: "no_offer" }, { status: 200 });
    }

    await redis.del(redisKey);
    console.log(`[API] 📤 Consumed OFFER from key: ${redisKey}`);

    // FIX: offerData is ALREADY an object because Upstash auto-deserializes it!
    return NextResponse.json({ status: "offer_found", data: offerData }, { status: 200 });
  } catch (error) {
    console.error("❌ Signal Offer GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}