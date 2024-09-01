'use client'
import { Card, CardAttempt, PrismaClient } from "@prisma/client";
import { useRef, useState } from "react";
import styles from "@/app/main.module.css";
import { getCards } from "../../getCards";
import { APIRequest } from "../api/attemptCard/route";
import { PrimaryButton } from "../primaryButton";

export default function Page() {
    
    let [currentCards, setCurrentCards] = useState<(Card&{backNailed:boolean, frontNailed:boolean})[]>([])
    let [selectedCard, setSelectedCard] = useState<Card&{front:boolean}|null>(null)
    let [completeMode, setCompleteMode] = useState<boolean>(false)
    let [currentTime, setCurrentTime] = useState<number>(0)
    let [sessionID, setSessionID] = useState<string>("")

    let timeout:any = useRef(null)

    if (currentCards.length == 0){
        return (
        <div>
            <h1>Study pattern today</h1>
            <div className={styles.centerForm}>
                <h2 style={{marginBottom:"20px"}}>Settings</h2>
                <h3>Number of cards:</h3>
                <input type="range" min={10} max={30} id='count' style={{marginBottom:"10px"}}/>
                <div className={styles.row}>
                    <h2>Difficulty</h2>
                    <select id='difficultyAlgo' style={{marginLeft:"10px"}}>
                        <option value='mix'>Mix</option>
                        <option value='refresher'>Refresher</option>
                        <option value='ishouldknow'>I should know these!</option>
                        <option value='new'>New words only</option>
                        <option value='quiz'>Quiz weights</option>
                    </select>
                </div>
                <PrimaryButton text={"Start"} onClick={async ()=>{
                    let difficulty = (document.getElementById('difficultyAlgo') as HTMLSelectElement).value
                    let count = (document.getElementById('count') as HTMLInputElement).value
                    let cards:(Card|Card&{frontNailed:boolean, backNailed:boolean})[] = await getCards(difficulty as "refresher"|"ishouldknow"|"new"|"mix", parseInt(count))
                    cards = cards.map((card)=>{
                        return {...card, backNailed:false, frontNailed:false}
                    }) as (Card&{backNailed:boolean, frontNailed:boolean})[]
                    //de-dupe the cards
                    cards = cards.filter((card, index)=>{
                        return cards.findIndex((card2)=>{
                            return card2.id == card.id
                        }) == index
                    })
                    setCurrentCards(cards as (Card&{backNailed:boolean, frontNailed:boolean})[])
                    setSessionID(Math.random().toString(36).substring(7))
                }} style={{marginTop:"10px"}}/>
            </div>
        </div>
        )
    }else{
        //shuffle the cards and select the first one (possibly flip it initially)
        if (selectedCard == null){
            let shuffledCards = currentCards.sort((a,b)=>{
                return Math.random() - 0.5
            })
            console.log("shuffled cards: ", shuffledCards)
            setSelectedCard({...shuffledCards[0], front:Math.random() > 0.5})
        }
        if (!completeMode){
            clearTimeout(timeout.current)
            timeout.current = setTimeout(()=>{
                setCurrentTime(currentTime+1)
            }, 1000)
        }else{
            if (timeout.current){
                clearTimeout(timeout.current)
            }
        }
        let card = <></>
        if (selectedCard){
            if (!completeMode){
                card = <div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
                    <h3>Time taken: {currentTime}</h3>
                    <h3 className={styles.cardMegaText}>{selectedCard.front?selectedCard.foreignLanguageMessage:selectedCard.nativeLanguageMessage}</h3>
                    <h4 className={styles.cardNoteText}>{selectedCard.front?selectedCard.notesForeignLanguage:selectedCard.notesNativeLanguage}</h4>
                    <PrimaryButton onClick={()=>{
                        setCompleteMode(true)
                    }} text='Flip' style={{marginTop:"15px"}}/>
                </div>
            }else{
                //flip the card and show the back
                card = <div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
                    <h3 className={styles.cardLesserText}>{selectedCard.front?selectedCard.foreignLanguageMessage:selectedCard.nativeLanguageMessage}</h3>
                    <h4 className={styles.cardNoteText}>{selectedCard.front?selectedCard.notesNativeLanguage:selectedCard.notesForeignLanguage}</h4>
                    <h3 className={[styles.cardLesserText, styles.cardExplainerText].join(" ")}>{selectedCard.front?selectedCard.nativeLanguageMessage:selectedCard.foreignLanguageMessage}</h3>
                    <h4 className={styles.cardNoteText}>{selectedCard.front?selectedCard.notesForeignLanguage:selectedCard.notesNativeLanguage}</h4>
                    <div className={styles.row} style={{marginTop:"10px"}}>
                        <PrimaryButton onClick={()=>{
                            if (currentTime < 5){
                                //you can eliminate this card from the list
                                let currentCardSelected = currentCards[currentCards.findIndex((card)=>{
                                    return card.id == selectedCard.id
                                })]
                                if (!selectedCard.front){
                                    currentCardSelected.frontNailed = true
                                    console.log("front nailed, but back is still: ", currentCardSelected.backNailed)
                                    setCurrentCards(currentCards)
                                
                                }else{
                                    currentCardSelected.backNailed = true
                                    console.log("back nailed, but front is still: ", currentCardSelected.frontNailed)
                                    setCurrentCards(currentCards)
                                    
                                }
                                if (currentCardSelected.frontNailed && currentCardSelected.backNailed){
                                    console.log("Both back and front now nailed. Removing from list")
                                    setCurrentCards(currentCards.filter((card)=>{
                                        return card.id != selectedCard.id
                                    }))
                                }
                                
                            }else{
                                console.log("Too long, not eliminating")
                            }
                            makeGuess(selectedCard.id.toString(), selectedCard.front?"front":"back", currentTime.toString(), "easy", sessionID)
                            setSelectedCard(null)
                            setCompleteMode(false)
                            setCurrentTime(0)
                        }} text="Easy" style={{marginRight:"10px"}}/>
                        <PrimaryButton onClick={()=>{
                            makeGuess(selectedCard.id.toString(), selectedCard.front?"front":"back", currentTime.toString(), "good", sessionID)
                            setSelectedCard(null)
                            setCompleteMode(false)
                            setCurrentTime(0)
                        }} text="Good" style={{marginRight:"10px"}}/>
                        <PrimaryButton onClick={()=>{
                            makeGuess(selectedCard.id.toString(), selectedCard.front?"front":"back", currentTime.toString(), "hard", sessionID)
                            setSelectedCard(null)
                            setCompleteMode(false)
                            setCurrentTime(0)
                        }} text="Hard" style={{marginRight:"10px"}}/>
                        <PrimaryButton onClick={()=>{
                            makeGuess(selectedCard.id.toString(), selectedCard.front?"front":"back", currentTime.toString(), "again", sessionID)
                            setSelectedCard(null)
                            setCompleteMode(false)
                            setCurrentTime(0)
                        }} text="Again" style={{marginRight:"10px"}}/>
                    </div>
                    <PrimaryButton onClick={()=>{
                        //go to the card's id page
                        window.location.href = `/card/${selectedCard.id}`
                    } } text="Edit card" style={{marginTop:"10px"}}/>

                </div>
            }
        }

        return (
            <div>
                <h2>Card</h2>
                
                <div className={styles.centerForm}>{card}</div>
            </div>
        )
    }
}

export function makeGuess(cardID:string, side:"front"|"back", time:string, strength:"easy"|"good"|"hard"|"again", sessionID:string){

    let data:APIRequest = {
        cardID,
        side,
        time,
        strength,
        sessionID
    }

    fetch('/api/attemptCard', {
        method:'POST',
        body:JSON.stringify(data)
    })
}