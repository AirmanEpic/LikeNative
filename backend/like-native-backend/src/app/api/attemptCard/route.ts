import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic' // defaults to auto

export type APIRequest = {
    cardID:string,
    side:"front"|"back"
    time:string,
    strength:"easy"|"good"|"hard"|"again",
    sessionID:string
}

export async function POST(request: Request) {

    //get the request data
    const data:APIRequest = await request.json()
    //get the card
    let prismaClient = new PrismaClient()
    let card = await prismaClient.card.findFirst({
        where:{
            id:parseInt(data.cardID)
        }
    })

    if (!card){
        return Response.json({
            message: "Card not found",
        }, {
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 404
        })
    }

    //create the attempt
    await prismaClient.cardAttempt.create({
        data:{
            card:{
                connect:{
                    id:card.id
                }
            },
            timeTaken:parseInt(data.time),
            relativeStrength:strengthToNumber(data.strength),
            foreignLanguageAttempt:data.side == "front",
            sessionId:data.sessionID
        }
    })

    prismaClient.$disconnect()

    return Response.json({
        message: "success",
    }, {
        headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    })


}

function strengthToNumber(strength:"easy"|"good"|"hard"|"again"){
    switch(strength){
        case "easy":
            return 5
        case "good":
            return 4
        case "hard":
            return 3
        case "again":
            return 1
    }
}