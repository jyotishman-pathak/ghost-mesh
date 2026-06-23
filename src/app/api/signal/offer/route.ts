import { redis } from "@/infrastructure/signaling";
import { NextRequest, NextResponse } from "next/server";



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUserId, senderUserId, sdp } = body;

    if (!targetUserId || !senderUserId || !sdp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Store the offer in Redis, keyed by the TARGET user.
    // TTL is 60 seconds. If they don't connect in 60s, the offer dies.
    const redisKey = `signal:offer:${targetUserId}`;
    await redis.set(redisKey, JSON.stringify({ senderUserId, sdp }), { ex: 60 });

    return NextResponse.json({ status: "offer_stored" }, { status: 200 });
  } catch (error) {
    console.error("Signal Offer Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const redisKey = `signal:offer:${userId}`;
    const offerData = await redis.get(redisKey);


    console.log("offerData:", offerData);
console.log("type:", typeof offerData);


    if (!offerData) {
      return NextResponse.json({ status: "no_offer" }, { status: 200 });
    }

    // Delete the key immediately after reading (consume it)
    await redis.del(redisKey);

    return NextResponse.json({ status: "offer_found", data: offerData }, { status: 200 });
  } catch (error) {
    console.error("Signal Get Offer Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}