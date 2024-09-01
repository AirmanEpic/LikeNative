'use client'
import { createQuizAttempt, getAllCards, getQuizTargetCardIds } from "@/getCards"
import { Card, QuizAttempt } from "@prisma/client"
import { useState } from "react"
import { PrimaryButton } from "../primaryButton"
import styles from "@/app/main.module.css";

type State = {
    allCards: Card[],
    targettedCardIds: number[],
    currentCardIndex: number
    isFlipped: boolean,
    attempts: QuizAttempt[],
    timeLeft: number
    state:"preQuestion"|"question"|"postQuestion",
    countdownInterval: NodeJS.Timeout|null,
    typedAnswer: string,
    wasCorrect: boolean
}

export default function Page(){
    let [state, setState] = useState<State>({
        allCards: [],
        targettedCardIds: [],
        currentCardIndex: 0,
        isFlipped: false,
        attempts: [],
        timeLeft: 5,
        state: "preQuestion",
        countdownInterval: null,
        typedAnswer: "",
        wasCorrect: false
    })

    if (!state.allCards || state.allCards.length == 0){
        return (<div className={styles.centerForm}>
            loading...
            <PrimaryButton onClick={async ()=>{
                setTimeout(async ()=>{
                    let [cards, targettedCardIds] = await Promise.all([getAllCards(), getQuizTargetCardIds(10)])
                    if (cards.length == 0 || targettedCardIds.length == 0){
                        return
                    }
                    console.log("cards: ", cards)
                    setState({...state, allCards: cards, targettedCardIds})
                },100)
            }} text={"Load cards"}/>
        </div>
        )
    }

    if (state.state == "preQuestion" && state.currentCardIndex === 0){
        return (<div className={styles.centerForm}>
            <h1>Quiz</h1>
            <h2>{"Your quiz is about to start - do you want to test your native -> foreign skills or your foreign -> native skills?"}</h2>
            <h3>Note - your answer will be accepted early if there's no possible other answer but the correct one.</h3>
            <h3>Likewise, if what you type isn't posssibly the right answer, you will automatically get the answer wrong.</h3>
            <PrimaryButton onClick={()=>{setState({...state, state:"question"})}} text={"Native -> Foreign"} />
            <PrimaryButton onClick={()=>{setState({...state, state:"question", isFlipped:true})}} text={"Foreign -> native"} />
        </div>)
    }

    if (state.state == "question"){
        if (state.countdownInterval == null){
            let interval = setTimeout(()=>{
                if (state.timeLeft == 0 && state.state != "postQuestion"){
                    console.log("Ran out of time!")
                    setState({...state, timeLeft: 5, wasCorrect: false, state:"postQuestion", countdownInterval: null})
                    return
                }
                setState({...state, timeLeft: state.timeLeft - 1, countdownInterval: null})
            }, 1000)
            setState({...state, countdownInterval: interval})
        }
        
        // console.log("current card index: ", state.currentCardIndex)
        // console.log("targetted card ids: ", state.targettedCardIds)
        let card = state.allCards.filter((card, index)=>{
            return state.targettedCardIds[state.currentCardIndex] == card.id
        })[0]
        console.log("id: ", state.targettedCardIds[state.currentCardIndex], "card: ", card) 
        let message = state.isFlipped ? card.foreignLanguageMessage : card.nativeLanguageMessage
        let answer = !state.isFlipped ? card.foreignLanguageMessage : card.nativeLanguageMessage

        //list of answers that begin with what the user has typed
        let possibleAnswers:Card[] = []
        if (state.typedAnswer.length !== 0){
            if (state.typedAnswer.toLowerCase() == answer.toLowerCase()){
                if (state.countdownInterval){
                    clearTimeout(state.countdownInterval)
                }
                setState({...state, typedAnswer: "", timeLeft: 5, wasCorrect: true, state:"postQuestion", countdownInterval:null})
            }

            possibleAnswers = state.allCards.filter((card)=>{
                if (state.isFlipped){
                    return card.nativeLanguageMessage.toLowerCase().startsWith(state.typedAnswer.toLowerCase())
                }
                return card.foreignLanguageMessage.toLowerCase().startsWith(state.typedAnswer.toLowerCase())
            })
            console.log("Possible answers: ", possibleAnswers)

            if (possibleAnswers.length == 0){
                if (state.countdownInterval){
                    clearTimeout(state.countdownInterval)
                }
                setState({...state, typedAnswer: "", timeLeft: 5, wasCorrect: false, state:"postQuestion", countdownInterval:null})
            }

            if (possibleAnswers.length == 1){
                let correctCard = state.allCards.filter((card, index)=>{
                    return state.targettedCardIds[state.currentCardIndex] == card.id
                })[0]
                let correctAnswer = correctCard.foreignLanguageMessage
                let typedAnswer = possibleAnswers[0].foreignLanguageMessage
                console.log("typed answer: ", typedAnswer)
                console.log("correct answer: ", correctAnswer)
                console.log("Possible answers: ", possibleAnswers)
                if (typedAnswer == correctAnswer){
                    if (state.countdownInterval){
                        clearTimeout(state.countdownInterval)
                    }
                    setState({...state, typedAnswer: "", timeLeft: 5, wasCorrect: true, state:"postQuestion", countdownInterval:null})
                }
                else{
                    if (state.countdownInterval){
                        clearTimeout(state.countdownInterval)
                    }
                    setState({...state, typedAnswer: "", timeLeft: 5, wasCorrect: false, state:"postQuestion", countdownInterval:null})
                }
            }
        }

        return (<div className={styles.centerForm}>
            <h1>Quiz</h1>
            <h2>{message}</h2>
            <input type="text" defaultValue={state.typedAnswer} onChange={(e)=>{
                console.log("typed answer: ", e.target.value)
                setState({...state, typedAnswer: e.target.value})
            }}/>
            <h3>Time left: {state.timeLeft}</h3>
            
        </div>)
    }

    if (state.state == "postQuestion"){
        if (state.wasCorrect){
            return (<div className={styles.centerForm}>
                <h1>Correct!</h1>
                <h2>Well done! This card has been removed from the list of test questions.</h2>
                <PrimaryButton onClick={()=>{
                    createQuizAttempt(state.targettedCardIds[state.currentCardIndex], state.wasCorrect, state.isFlipped)

                    if (state.currentCardIndex == state.targettedCardIds.length - 1){
                        setState({...state, state:"preQuestion", currentCardIndex: 0, isFlipped: false, attempts: []})
                    }else{
                        setState({...state, state:"question", currentCardIndex: state.currentCardIndex + 1, attempts: []})
                    }
                }} text={"Next"}/>
            </div>)
        }
        else{
            let correctCard = state.allCards.filter((card, index)=>{
                return state.targettedCardIds[state.currentCardIndex] == card.id
            })[0] 
            let correctAnswer = correctCard.nativeLanguageMessage
            if (!state.isFlipped){
                correctAnswer = correctCard.foreignLanguageMessage
            }
            return (<div className={styles.centerForm}>
                <h1>Incorrect!</h1>
                <h2>Keep trying! This card will be shown to you again soon.</h2>
                <h3>Correct answer: {correctAnswer}</h3>
                <PrimaryButton onClick={()=>{
                    createQuizAttempt(state.targettedCardIds[state.currentCardIndex], state.wasCorrect, state.isFlipped)

                    if (state.currentCardIndex == state.targettedCardIds.length - 1){
                        setState({...state, state:"preQuestion", currentCardIndex: 0, isFlipped: false, attempts: []})
                    }else{
                        setState({...state, state:"question", currentCardIndex: state.currentCardIndex + 1})
                    }
                }} text={"Next"}/>
            </div>)
        }
    }
}