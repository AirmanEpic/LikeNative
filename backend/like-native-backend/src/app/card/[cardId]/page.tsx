'use client'
import { Card, CardAttempt, PrismaClient, translations } from "@prisma/client"
import styles from "@/app/main.module.css"
import { useState } from "react"
import { getCard } from "@/getCards"
import { PrimaryButton } from "@/app/primaryButton"
import { APIRequest } from "@/app/api/editNote/route"

export default function Page({ params }: { params: { cardId: string } }) {
    let [card, setCard] = useState<Card>()
    let [noteEditMode, setNoteEditMode] = useState<number>(0)
    if (!card) {
        getCard(parseInt(params.cardId)).then((incomingCard) => {
            if (!incomingCard) {
                return
            }
            setCard(incomingCard)
        })

        return <div>
            <h1>Loading...</h1>
        </div>
    }

    let noteForeignButtons = <><h3>{card.notesForeignLanguage}</h3><PrimaryButton text="Edit note" onClick={() => {
        setNoteEditMode(1)
    }}/></>

    if (noteEditMode == 1) {
        //edit mode, show the text area
        noteForeignButtons = <>
        <div className={styles.row}>
            <textarea defaultValue={card.notesForeignLanguage} onChange={(e) => {
            }}/>
            <PrimaryButton text="Save" onClick={() => {
                let text = (document.querySelector("textarea") as HTMLTextAreaElement).value
                let data:APIRequest = {
                    cardID:((card as Card).id) + "",
                    foreignNote:text
                }
                fetch('/api/editNote',{
                    method:'POST',
                    body:JSON.stringify(data),
                }).then((response)=>{
                    setCard({...card as Card, notesForeignLanguage:text})
                    setNoteEditMode(0)
                })
            }}/>
            <PrimaryButton text="Cancel" onClick={() => {
                setNoteEditMode(0)
            }}/>
        </div></>
    }

    let noteNativeButtons = <><h3>{card.notesNativeLanguage}</h3><PrimaryButton text="Edit note" onClick={() => {
        setNoteEditMode(2)
    }
    }/></>

    if (noteEditMode == 2) {
        //edit mode, show the text area
        noteNativeButtons = <>
        
        <div className={styles.row}>
            <textarea defaultValue={card.notesNativeLanguage} onChange={(e) => {
            }}/>
            <PrimaryButton text="Save" onClick={() => {
                let text = (document.querySelector("textarea") as HTMLTextAreaElement).value
                let data:APIRequest = {
                    cardID:((card as Card).id) + "",
                    nativeNote:text
                }
                fetch('/api/editNote',{
                    method:'POST',
                    body:JSON.stringify(data),
                }).then((response)=>{
                    setCard({...card as Card, notesNativeLanguage:text})
                    setNoteEditMode(0)
                })
            }}/>
            <PrimaryButton text="Cancel" onClick={() => {
                setNoteEditMode(0)
            }}/>
        </div> </>
    }

    let difficultyData = <h3>No difficulty data yet - this card hasn't been attempted.</h3>
    card = (card as (Card&{cardAttempts:CardAttempt[],transations:translations[]}))
    if ((card as (Card&{cardAttempts:CardAttempt[]})).cardAttempts.length > 0) {
        let attempts = (card as (Card&{cardAttempts:CardAttempt[]})).cardAttempts
        let correctAttempts = attempts.filter((attempt) => {
            return attempt.relativeStrength > 2
        })
        let incorrectAttempts = attempts.filter((attempt) => {
            return attempt.relativeStrength < 2
        })
        let correctPercentage = correctAttempts.length / attempts.length
        let incorrectPercentage = incorrectAttempts.length / attempts.length
        let correctPercentageDisplay = (correctPercentage * 100).toFixed(2)
        let incorrectPercentageDisplay = (incorrectPercentage * 100).toFixed(2)
        difficultyData = <div>
            <h3>Correct percentage: {correctPercentageDisplay}%</h3>
            <h3>Incorrect percentage: {incorrectPercentageDisplay}%</h3>
        </div>
    }

    let translationRows = (card as (Card&{translations:translations[]})).translations.map((translation)=>{
        return <div className={styles.row} style={{justifyContent:"center", alignItems:"center", marginTop:"10px"}}>
            <p style={{width:"600px"}}>{translation.value}</p><h2>=</h2><p style={{width:"600px", marginLeft:"30px"}}>{translation.key}</p>
        </div>
    })


    return <div className={styles.centerForm}>
        <div className={styles.row} style={{alignItems:"center"}}><h2 style={{marginRight:"10px"}}>Foreign language:</h2><h3>{card.foreignLanguageMessage}</h3></div>
        <div className={styles.row}>
            {noteForeignButtons}
        </div>
        <div className={styles.row} style={{alignItems:"center"}}><h2 style={{marginRight:"10px"}}>Native language:</h2><h3>{card.nativeLanguageMessage}</h3></div>
        <div className={styles.row}>
            {noteNativeButtons}
        </div>
        <h2 style={{marginTop:"20px"}}>Extra data</h2>
        <div className={styles.row}>
            <h3>English Commonality rank: </h3><h3 style={{marginLeft:"10px"}}>{card.EnglishCommonality<10000?card.EnglishCommonality:"Greater than 10000"}</h3>
        </div>
        <div className={styles.row}>
            <h3>Times unmasked: </h3><h3 style={{marginLeft:"10px"}}>{card.unmasks}</h3>
        </div>
        <h2 style={{marginTop:"20px"}}>Difficulty information:</h2>
        {difficultyData}
        <h2 style={{marginTop:"20px"}}>Translations featuring this:</h2>
        {translationRows}
    </div>
}


