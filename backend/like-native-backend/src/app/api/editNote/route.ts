import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic' // defaults to auto

export type APIRequest = {
    cardID:string,
    foreignNote?:string,
    nativeNote?:string,
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

    //update the card
    let dataToEdit:any = {}
    if (data.foreignNote){
        dataToEdit["notesForeignLanguage"] = data.foreignNote
    }
    if (data.nativeNote){
        dataToEdit["notesNativeLanguage"] = data.nativeNote
    }

    await prismaClient.card.update({
        where:{
            id:parseInt(data.cardID)
        },
        data:dataToEdit
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