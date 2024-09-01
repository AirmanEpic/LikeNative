'use server'
import { Card, CardAttempt, PrismaClient } from "@prisma/client"
import { getCardStats } from "./cardStats"

export interface CardAndAttempts extends Card{
    cardAttempts:CardAttempt[]
}


export async function getCards(difficulty:"refresher"|"ishouldknow"|"new"|"mix"|"quiz", count:number):Promise<Card[]>{
    let prismaClient = new PrismaClient()
    let cards = await prismaClient.card.findMany({
        include:{
            cardAttempts:true
        }
    }) as CardAndAttempts[]

    //weight each card based on each difficulty algorithm
    if (difficulty == 'mix'){
        //mix all the cards
        let weightedCard:(Card&{weight:number})[] = (await getWeightedCards(cards, "refresher"))
        let weightedCard2:(Card&{weight:number})[] = (await getWeightedCards(cards, "ishouldknow"))
        let weightedCard3:(Card&{weight:number})[] = (await getWeightedCards(cards, "new"))

        //sort the cards by weight
        weightedCard.sort((a,b)=>{
            return b.weight - a.weight
        })
        weightedCard2.sort((a,b)=>{
            return b.weight - a.weight
        })
        weightedCard3.sort((a,b)=>{
            return b.weight - a.weight
        })

        //combine the cards
        let finalCards:(Card&{weight:number})[] = []
        let reps = 0
        while (finalCards.length < count && reps < 100){
            let currentCards:number[] = finalCards.map((card)=>{
                return (card?.id || -1)
            })
            let nextRefresher = weightedCard.pop()
            if (nextRefresher && currentCards.includes(nextRefresher.id)){
                continue
            }else{
                if (nextRefresher){
                    finalCards.push(nextRefresher)
                }
            }

            let nextIshouldknow = weightedCard2.pop()
            if (nextIshouldknow && currentCards.includes(nextIshouldknow.id)){
                continue
            }
            else{
                if (nextIshouldknow){
                    finalCards.push(nextIshouldknow)
                }
            }

            let nextNew = weightedCard3.pop()
            if (nextNew && currentCards.includes(nextNew.id)){
                continue
            }
            else{
                if (nextNew){
                    finalCards.push(nextNew)
                }
            }
            reps++
        }
        prismaClient.$disconnect()
        return finalCards as Card[]
    }else{
        let weightedCard:(Card&{weight:number})[] = []
        if (difficulty !== 'quiz'){
            weightedCard = (await getWeightedCards(cards, difficulty))
            weightedCard.sort((a,b)=>{
                return b.weight - a.weight
            })
    
            console.log("first 3 cards: ", weightedCard.slice(0, 3))
            prismaClient.$disconnect()
        }else{
            let quizTargetCardIds = await getQuizTargetCardIds(count)
            weightedCard = cards.filter((card)=>{
                return quizTargetCardIds.includes(card.id)
            }).map((card)=>{
                return {...card, weight:0}
            })
        }
        // console.log("Weighted cards: ", weightedCard)
        //sort the cards by weight

        
        return weightedCard.slice(0, count) as Card[]       
    }
}
    

export async function getWeightedCards(cards:CardAndAttempts[], difficulty:"refresher"|"ishouldknow"|"new"):Promise<(Card&{weight:number})[]>{
    return cards.map((card)=>{
        let weight = 0
        let { knownNess, comingUpNess, importance, attempts } = getCardStats(card)
        switch(difficulty){
            case 'refresher':
                if (attempts.length == 0){
                    weight = importance
                }else{
                    
                    //when was the last attempt?
                    let lastAttempt = attempts[attempts.length-1]
                    //the "Ideal next time" is the attempts count times 1000*60*60*2 (2 hours)
                    //a better known card shouldn't be shown as often, so we divide the ideal next time by the knownness
                    let idealNextTime = ((comingUpNess * 4) / (knownNess+0.01)) //ms in the future.
                    //how long has it been since the last attempt?
                    let timeSinceLastAttempt = (Date.now()) - lastAttempt.createdAt.getTime()
                    let msPastIdeal = timeSinceLastAttempt - idealNextTime
                    // console.log("For card ", card.foreignLanguageMessage,"ms past ideal: ", msPastIdeal, " ideal next time: ", idealNextTime, " time since last attempt: ", timeSinceLastAttempt, "Weight: ", msPastIdeal/100)
                    console.log("for card ",card.foreignLanguageMessage,
                        "ideal next time in hours: ", idealNextTime/(1000*60*60),
                        msPastIdeal/(1000*60*60), "Hours PAST ideal. Negative means 'ideal is in the future'",
                        "Ideal next time: ", new Date(lastAttempt.createdAt.getTime() + idealNextTime).toLocaleString(),
                        "current time: ", new Date(Date.now()).toLocaleString(),
                        "last attempt at: ", new Date(lastAttempt.createdAt).toLocaleString(),
                        "Time since last attempt: ", (Date.now() - new Date(lastAttempt.createdAt).getTime())/(1000*60*60), "Hours. Positive means 'ago'."
                    )
                    //the more ms past ideal, the more weight the card gets
                    weight = msPastIdeal/100                  
                    break
                }
            case 'ishouldknow':
                //highly weight cards that have been attempted before, but are very difficult. Kicker is lowness of english frequency count divided by unmask count
                if (card.cardAttempts.length == 0){
                    weight = 0
                }else{
                    weight = knownNess
                    weight += importance
                }
                break
            case 'new':
                //highly weight cards that have never been attempted. Kicker is lowness of english frequency count divided by unmask count
                if (card.cardAttempts.length !== 0){
                    weight = 0
                }else{
                    weight = importance
                }
                break
        }
        return {...card, weight}
    })
}

export async function getCard(id: number) {
    'use server'
    let prismaClient = new PrismaClient()
    let card = await prismaClient.card.findUnique({
        where: {
            id
        }, include:{
            cardAttempts:true
        }
    })

    if (!card){
        prismaClient.$disconnect()
        return null
    }

    //get all translations using the foreign word
    let translations = await prismaClient.translations.findMany()
    translations = translations.filter((translation)=>{
        let lowercaseTranslation = translation.value.toLowerCase()
        let lowercaseForeign = card.foreignLanguageMessage.toLowerCase()
        return lowercaseTranslation.includes(lowercaseForeign)
    })

    let cardAndTranslations = {...card, translations}

    prismaClient.$disconnect()
    return cardAndTranslations
}

export async function getAllCards() {
    let prismaClient = new PrismaClient()
    let cards = await prismaClient.card.findMany({
        include:{
            cardAttempts:true
        }
    })
    prismaClient.$disconnect()
    return cards
}

export async function count(){
    'use server'
    let prismaClient = new PrismaClient()
    let cardCount = await prismaClient.card.count()
    prismaClient.$disconnect()
    return cardCount
  }

export async function deleteCard(id:number){
    let prismaClient = new PrismaClient()
    await prismaClient.cardAttempt.deleteMany({
        where:{
            cardId:id
        }
    })
    await prismaClient.card.delete({
        where: {
            id
        }
    })
    prismaClient.$disconnect()
}

export async function getQuizTargetCardIds(length:number){
    //find the ids of the most important/frequent cards with more than 5 attempts
    let prismaClient = new PrismaClient()
    let cards = await prismaClient.card.findMany({
        include:{
            cardAttempts:true,
            quizAttempts:true
        },
        where:{
            //reject cards that the user has gotten correct (isCorrect==true)
            quizAttempts:{
                none:{
                    correct:true
                }
            }
        }
    }) as CardAndAttempts[]

    prismaClient.$disconnect()
    cards = cards.filter((card)=>{
        return card.cardAttempts.length > 5
    })
    console.log("Cards with more than 5 attempts: ", cards.length)

    //weight each card based on the importance and frequency
    let weightedCard:(Card&{weight:number})[] = cards.map((card)=>{
        let weight = 0
        let { knownNess, comingUpNess, importance, attempts } = getCardStats(card)
        weight = knownNess + importance + Math.random()*4
        
        return {...card, weight}
    })

    //sort the cards by weight
    weightedCard = weightedCard.sort((a,b)=>{
        return b.weight - a.weight
    })

    weightedCard.forEach((card)=>{
        console.log("Weight for card ", card.foreignLanguageMessage, " is ", card.weight)
    })

    return weightedCard.slice(0, length).map((card)=>{
        return card.id
    })
}

export async function createQuizAttempt(cardId:number, isCorrect:boolean, wasForeign:boolean){
    let prismaClient = new PrismaClient()
    console.log("Creating quiz attempt", cardId, isCorrect, wasForeign)
    let cardAttempt = await prismaClient.quizAttempt.create({
        data:{
            card:{
                connect:{
                    id:cardId
                }
            },
            correct:isCorrect,
            foreignSide:wasForeign
        }
    })
    prismaClient.$disconnect()
    return cardAttempt

}