'use client'
import Image from "next/image";
import styles from "./main.module.css";
import { Card, PrismaClient } from "@prisma/client";
import Link from "next/link";
import { useRef, useState } from "react";
import { CardAndAttempts, count, deleteCard, getAllCards, getCards } from "@/getCards";
import { PrimaryButton } from "./primaryButton";
import { getCardStats } from "@/cardStats";

import { TrashIcon } from "@heroicons/react/24/solid";

export default function Page() {
  let [currentCards, setCurrentCards] = useState<(CardAndAttempts)[]>([])

  if (!currentCards || currentCards.length == 0){
    getAllCards().then((incomingCards)=>{
      incomingCards.sort((a,b)=>{
        let { knownNess: aKnownNess, comingUpNess: aComingUpNess, importance: aImportance, attempts: aAttempts } = getCardStats(a)
        let { knownNess: bKnownNess, comingUpNess: bComingUpNess, importance: bImportance, attempts: bAttempts } = getCardStats(b)
        return (bImportance) - (aImportance)
      })

      setCurrentCards(incomingCards as CardAndAttempts[])
    })
  }

  if (!currentCards || currentCards.length == 0){
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    )
  }

  return (
    <div>
      <h1>Current card count:</h1>
      <h2>{currentCards.length}</h2>
      <h3> Remember, there are too many to ever learn them all. We'll be dynamically giving them to you based on our learning algorithm.</h3>
      <Link href="/practice">
        <PrimaryButton text="Start practicing" onClick={()=>{}}/>
      </Link>
      <div className={styles.cardContainer}>
        {currentCards.map((card:CardAndAttempts)=>{
          let { knownNess, comingUpNess, importance, attempts } = getCardStats(card)
          let nextDueDate = new Date()
          if (attempts.length > 0){
            nextDueDate = new Date(new Date(attempts[0].createdAt).getTime() + comingUpNess)
          }

          return (<Link href={`card/${card.id}`}>
            <div className={styles.card}>
              <h3>{card.foreignLanguageMessage}</h3>
              <h3>{card.nativeLanguageMessage}</h3>
              <h3 className={styles.cardDataLine}>Attempts: {card.cardAttempts.length}</h3>
              <h3 className={styles.cardDataLine}>Unknownness: {(knownNess).toFixed(3)}</h3>
              <h3 className={styles.cardDataLine}>Importance: {importance}</h3>
              <h3 className={styles.cardDataLine}>Next due date: {nextDueDate.toLocaleString()}</h3>
              <div className={styles.deleteCardButton} onClick={
                ()=>{
                  //prevent the click from propagating to the card
                  
                  if (confirm("Are you sure you want to delete this card?")){
                    deleteCard(card.id)
                  }
                }
              }><TrashIcon></TrashIcon></div>
            </div>
          </Link>)
        })}
      </div>
    </div>
  )
}