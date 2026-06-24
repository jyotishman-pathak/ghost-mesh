import { redis } from "@/infrastructure/signaling";
import { NextRequest, NextResponse } from "next/server";


// User A or B sends an ICE candidate
export async function POST(req: NextRequest){
    try {
        const body = await req.json()
        const {targetUserId, senderUserId, candidate} = body
        
        if(!targetUserId|| !senderUserId||!candidate ){
            return NextResponse.json({error:"Missing Fields"}, { status: 400})
        }

        const redisKey = `signal:ice:${targetUserId}`;
        await redis.lpush(redisKey, JSON.stringify({senderUserId, candidate}))

        await redis.expire(redisKey, 60);

        return NextResponse.json({status: "candidate stored"}, {status:500})


    } catch (error) {
        console.log("Signal Ice error", error)
        return NextResponse.json({error:"Internal Server Error"},{status:500})
    }
}


// User A or B polls to get pending ICE candidates

export async function GET(req:NextRequest){
    try{
        const userId = req.nextUrl.searchParams.get("userId");

          if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  
        const redisKey = `signal:ice:${userId}`;

        const candidates = await redis.lrange(redisKey, 0,-1);

        if(!candidates || candidates.length ===0){
            return NextResponse.json({status:"No candidates", data:[]}, {status:200})
        }  

        await redis.del(redisKey)

        const parsedCandidates = candidates.map(c=> JSON.parse(c as string))
        return NextResponse.json({status:"candidates found ", data: parsedCandidates}, {status:200})

        }catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}