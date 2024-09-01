import { PrismaClient } from "@prisma/client"
import englishWordString from "./google-10000-english-usa.json"


export async function handleUnmaskCard(foreignWord:string, nativeWord:string){
    //get the card if it exists
    let prismaClient = new PrismaClient()
    let card = await prismaClient.card.findFirst({
        where: {
            foreignLanguageMessage: foreignWord,
            nativeLanguageMessage: nativeWord
        }
    })
    if (card){
        //increment the unmasks
        await prismaClient.card.update({
            where: {
                id: card.id
            },
            data: {
                unmasks: card.unmasks + 1
            }
        })
        return
    }

    //create the card if it doesn't exist
    createCard(foreignWord, nativeWord)

    prismaClient.$disconnect()  
}

export async function createCard(foreignWord:string, nativeWord:string){
    let prismaClient = new PrismaClient()
    await prismaClient.card.create({
        data: {
            foreignLanguageMessage: foreignWord,
            nativeLanguageMessage: nativeWord,
            notesForeignLanguage: "",
            notesNativeLanguage: "",
            EnglishCommonality:getEnglishCommonality(nativeWord),
            unmasks:1
        }
    })
    
    prismaClient.$disconnect()
}

let getEnglishCommonality = (word:string) => {
    let commonality = 10002
    //englishWordString is an array of the 10,000 most common english words
    //get the index of the word in the array
    let lowercaseWord = word.toLowerCase()
    let index = englishWordString.indexOf(lowercaseWord)
    if (index > -1){
        //if the word is in the array, calculate the commonality
        commonality = index
    }
    return commonality
}