import { CardAndAttempts } from "./getCards"

export function getCardStats(card:CardAndAttempts){
    let attempts = card.cardAttempts || []
    attempts.sort((a,b)=>{
        return b.createdAt.getTime() - a.createdAt.getTime()
    })
    //this sort is in descending order, so the first 10 attempts are the most recent
    let averageSuccessTime = attempts.reduce((acc, attempt, ind)=>{
        if (ind < 10) //only consider the first 10 attempts
        return acc + attempt.timeTaken

        return acc
    }, 0) / attempts.length
    let averageScore = attempts.reduce((acc, attempt, ind)=>{
        if (ind < 10) //only consider the first 10 attempts
        return acc + attempt.relativeStrength

        return acc
    }, 0) / attempts.length
    //assemble these metrics:
    //"Known-ness" eg how difficult/easy it is recently
    let knownNess = averageSuccessTime * (5-averageScore)
    //comingup-ness eg when the card should next be shown, based on total attempt count.
    let comingUpNess = attempts.length * 1000*60*60*2
    //importance eg how rare the word is and how many times it has been unmasked
    let importance = ((10000 - card.EnglishCommonality) / 100) + card.unmasks*10
    //spike eg when first presented after a long time, how well is it known?

    return { knownNess, comingUpNess, importance, attempts }
}