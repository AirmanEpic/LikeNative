import { handleUnmaskCard } from "@/card";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic' // defaults to auto

const {Translate} = require('@google-cloud/translate').v2;

type APIRequest = {
    text:string,
    sub:{
       type:"wholeSententce" 
    }|{
        type:"word",
        wordIndex:number
    }
}

export async function POST(request: Request) {

    //get the request data
    // console.log("request: ", await request.json())
    const data:APIRequest = await request.json()
    //provide the key for the translation API

    let prismaClient = new PrismaClient()
    console.log("data: ", data)
    if (data.sub.type == "wholeSententce"){
        let translationFound = await prismaClient.translations.findFirst({
            where: {
                value: data.text
            }
        })

        if (translationFound){
            //return the translation
            console.log("Translation found: ", translationFound.key)

            return Response.json({
                message: translationFound.key,
            }, {
                headers: {
                    'content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            })
        }

        return Response.json({
            message: "Translation not found",
        }, {
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            status: 404
        })
    }

    //try to find previous translations
    let word = data.text.split(" ")[data.sub.wordIndex]
    //remove all punctiation (spaces, commas, periods, etc)
    word = word.replace(/\,/g, "").replace(/\./g, "").replace(/\?/g, "").replace(/\!/g, "").replace(/\:/g, "").replace(/\;/g, "").replace(/\"/g, "").replace(/\'/g, "")
    let translationFound = await prismaClient.translations.findFirst({
        where: {
            key: word
        }
    })

    if (translationFound){
        //return the translation
        let translation = translationFound.value

        //run the unmask for the card
        handleUnmaskCard(word, translation)

        return Response.json({
            message: translation,
        }, {
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        })
    }

    const translate = new Translate({projectId: process.env.TRANSLATION_PROJECT_ID, key: process.env.TRANSLATION_API_KEY});
    const [translation] = await translate.translate(word, 'en');

    //save the translation
    await prismaClient.translations.create({
        data: {
            key: word,
            value: translation,
            language: `${process.env.LANGUAGE}->en`
        }
    })

    //run the unmask for the card
    handleUnmaskCard(word, translation)

    return Response.json({
        message: translation,
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