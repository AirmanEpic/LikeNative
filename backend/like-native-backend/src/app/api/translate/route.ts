import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic' // defaults to auto
const {Translate} = require('@google-cloud/translate').v2;

type APIRequest = {
    text:string
}

export async function POST(request: Request) {

    //get the request data
    const data:APIRequest = await request.json()
    //provide the key for the translation API

    //try to find previous translations
    let prismaClient = new PrismaClient()
    let translationFound = await prismaClient.translations.findFirst({
        where: {
            key: data.text
        }
    })

    if (translationFound){
        //return the translation
        console.log("Translation found: ", translationFound.value)

        return Response.json({
            message: translationFound.value,
        }, {
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        })
    }

    const translate = new Translate({projectId: process.env.TRANSLATION_PROJECT_ID, key: process.env.TRANSLATION_API_KEY});

    const [translation] = await translate.translate(data.text, process.env.LANGUAGE);
    const translatedText = translation

    //save the translation
    await prismaClient.translations.create({
        data: {
            key: data.text,
            value: translatedText,
            language: `en->${process.env.LANGUAGE}`
        }
    })

    return Response.json({
        message: translatedText,
    }, {
        headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    })


}

export async function GET(request: Request) {
    //respond with a message
    return Response.json({
        message: 'Hello from the API',
    }, {
        headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    })
}