import jquery from 'jquery';

function handleComments(){

}

function handlemainPage(){
    let list:string[] = [];
    //get all titles
    let titleDOMs = jquery("a.title")
    titleDOMs.each((index, element) => {
        // list.push(jquery(element).text())
        //if index = 0, make a request to the server
        if (true){
            console.log("original text: ", jquery(element).text())
            let ogtext = jquery(element).text()
            jquery(element).text("Translating...")
            translateText(ogtext, (translatedText:string) => {
                // console.log("translated text: ", translatedText)
                //replace the text with the translated text
                //split the text into words
                let words = translatedText.split(" ")
                
                //each word needs to be its own span with the correct word id
                let wordSpans = words.map((word, index) => {
                    return `<span class="word" id="${index}" style="position:relative; display:inline-flex">${word}</span>`
                })

                jquery(element).html(wordSpans.join(" "))
                jquery(element).attr('id', 'title'+index)

                jquery(element).children('.word').mouseenter((event)=>{
                    //box the word
                    let wordId = jquery(event.target).attr('id')
                    //delete all other hoverboxes
                    jquery('.hoverbox').remove()
                    let hoverElement = jquery(`<div style="position:absolute; left:0; top:0px; font-size:6px" class='hoverbox'>Unmask</div>`)
                    
                    jquery(event.target).append(hoverElement)

                    hoverElement.click((event)=>{
                        event.preventDefault()
                        console.log("Requesting unmask for word: ", wordId, "in sentence: ", translatedText)
                        //make a request to the server to unmask the word
                        unmaskWord(wordId, translatedText, (unmaskedWord:string) => {
                            // jquery(".word"+'#'+wordId).text(unmaskedWord)
                            //replace the word with the unmasked word
                            jquery("#title"+index).children('.word').each((index, element) => {
                                if (jquery(element).attr('id') == wordId){
                                    jquery(element).text(unmaskedWord)
                                }
                            })

                            //clear the hover event
                            jquery(".word"+'#'+wordId).off('mouseenter')
                            jquery(".word"+'#'+wordId).off('mouseleave')
                            jquery(".word"+'#'+wordId).off('click')
                            //remove the hoverbox
                            jquery('.hoverbox').remove()
                        })
                    })

                })

                jquery(element).children('.word').mouseleave((event)=>{
                    //unbox the word
                    let wordId = jquery(event.target).attr('id')
                    jquery(event.target).children('.hoverbox').remove()
                })

            })
        }
    })

    console.log("titles:", list)
}

function main(){
    // alert("Hello from content script");
    
    //read the URL
    let url = window.location.href;
    if (url.indexOf("comments") > -1){
        handleComments()
    }else{
        handlemainPage()
    }
}

function translateText(text:string, thenFunc:Function){

    let response = null
    console.log("GOing out!")
    fetch("http://localhost:3000/api/translate", {
        method: 'POST',
        body: JSON.stringify({
            text: text
        })
    }).then((response) => {
        console.log("response: ", response)
        return response.json()
    }).then((data) => {
        console.log("data: ", data)
        thenFunc(data.message)
    }).catch((error) => {
        console.log("error: ", error)
    })
}

function unmaskWord(wordId:string, sentence:string, thenFunc:Function){
    fetch("http://localhost:3000/api/unmask", {
        method: 'POST',
        body: JSON.stringify({
            text: sentence,
            sub: {
                type: "word",
                wordIndex: parseInt(wordId)
            }
        })
    }).then((response) => {
        return response.json()
    }).then((data) => {
        thenFunc(data.message)
    }).catch((error) => {
        console.log("error: ", error)
    })
}

main();