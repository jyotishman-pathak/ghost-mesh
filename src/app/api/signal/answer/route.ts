import { redis } from "@/infrastructure/signaling";
import { NextRequest, NextResponse } from "next/server";

// User B sends an Answer back to User A

export async function POST(req:NextRequest){
    try{
        const body = await req.json()

        const {targetUserId ,senderUserId,sdp} = body;
        
         if (!targetUserId || !senderUserId || !sdp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const redisKey =`signal:answer:${targetUserId}`
    await redis.set(redisKey, JSON.stringify({senderUserId,sdp}) , {ex:60});
    

    return NextResponse.json({status:"answer-stored"} , {status:200})

    

    }catch (error) {
    console.error("Signal Answer Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// User A polls this to get User B's answer
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const redisKey = `signal:answer:${userId}`;
    const answerData = await redis.get(redisKey);

    if (!answerData) {
      return NextResponse.json({ status: "no_answer" }, { status: 200 });
    }

    // Consume the answer
    await redis.del(redisKey);

    return NextResponse.json({ status: "answer_found", data: answerData }, { status: 200 });
  } catch (error) {
    console.error("Signal Get Answer Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}