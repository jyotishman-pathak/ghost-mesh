import { db } from "@/infrastructure/database"
import { NextResponse } from "next/server"



export async function GET(){
    try{
        const userCount = await db.user.count();


        return NextResponse.json({
            status:"success",
            message :"Db Connected success",
            userCount
        },{status:200})
    }catch (error) {
        console.log("Database connection error ", error)
        return NextResponse.json({
            status: error,
            message:"Failed to connect to database "

        }, {status: 500})
    }
}