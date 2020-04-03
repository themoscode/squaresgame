        'use strict';
      
        document.addEventListener('DOMContentLoaded', () => {

            //variables

            let words=[];
            let stats=[];
            let chosenLetters = [];
            let word="";
            let totalTries = 6;
            let lostTry = 0;


            let btnStart = document.querySelector("#btnStart");
            let btnStats = document.querySelectorAll(".btnStats");
            
            let startContainer = document.querySelector("#startContainer");
            let wordSpaces = document.querySelector("#wordSpaces");
            let chosenLetter = document.querySelector("#letters");
            let imgContainer = document.querySelector("#imgContainer");
            let gameArea = document.querySelector("#gameArea");
            
            let winMsg = document.querySelector("#winMsg");
            let loseMsg = document.querySelector("#loseMsg");
            let letters = document.querySelector("#letters");
            let spanLetters = document.querySelectorAll("#letters span");
            let initBtns = document.querySelectorAll(".initBtn");
            
            //variables end


            //SOCKETS
            let socket = io.connect();
            let socketID = null;
            
            socket.emit ( 'clientSendsInit', {
                text: "init",
            }); 

            socket.on('connect', function() {
                //const sessionID = socket.socket.sessionid; //
                
                socketID = socket.id;
               // console.log("socket.id",socketID);
              });

            socket.on ( 'ServerSendsInit', (data, socketID) => {

                chosenLetters = [];
                totalTries = 6;
                lostTry = 0;

                loadHangImage(lostTry);
                fadeOut(gameArea);
                
                setTimeout(function(){ 
                    
                    displayBlock(startContainer);
                    displayNone(letters);
                    displayNone(loseMsg);
                    displayNone(winMsg);
                    displayNone(wordSpaces);
                    displayBlock(gameArea);
                    fadeIn(gameArea);
                    enableSpanLetters();
                    }, 1000);
  
            });

            socket.on ( 'ServerSendsWord', (data, socketID) => {

                word = data.word;
                console.log(data.word);
                displayNone(startContainer);
                createWordSpaces(word);
                displayBlock(wordSpaces);
                displayBlock(letters);
                fadeIn(letters);

            })

           


            socket.on ( 'ServerSendsLetter', (data, socketID) => {
                //console.log( socketID );
                //console.log(data);
                let letterToFind = data.letter;
                //console.log(letterToFind); 

                let indexFoundChosenLetters = chosenLetters.indexOf(letterToFind);

                if (indexFoundChosenLetters == -1) { //index in choosen letters

                    chosenLetters.push(letterToFind);

                    //console.log(letterToFind);
                    
                    let indexes = []; // array who keepes the indexes of an letter found in the word
                    for(let i=0; i<word.length;i++) {
                        if (word[i] === letterToFind) indexes.push(i);
                    }
                    
                    if (indexes.length == 0) { //letter no found
                        lostTry++;
                        loadHangImage(lostTry);

                        
                        if (lostTry == totalTries) {
                            
                            getStatsUpdate(false);
                            fadeOut(gameArea);
                            disableSpanLetters();
                            setTimeout(function(){ 
                                wordSpaces.innerHTML = word;
                                displayNone(letters);
                                displayBlock(loseMsg);
                                fadeIn(gameArea);
                                }, 1000);
                            
                            //fadeIn(gameArea);
                        };
                        
                    } else {

                        createLetterInWordSpaces(letterToFind,indexes);

                    }

                    
                    disableSpanLetter(letterToFind);

                }


            })

 
            const disableSpanLetter = (letterToFind) =>{

                let found;
                    for (let i = 0; i < spanLetters.length; i++) {
                        if (spanLetters[i].textContent == letterToFind) {
                            found = spanLetters[i];
                            found.className = 'disabledLetter';
                            break;
                        }
                    }

            }

            socket.on ( 'ServerSendsRestart', (data, socketID) => {

                fadeOut(gameArea);
                
                displayNone(startContainer);
                    setTimeout(function(){ 
                            
                            displayNone(winMsg);
                            displayNone(loseMsg);
                            enableSpanLetters();
                            displayBlock(letters);
                            displayBlock(gameArea);
                            fadeIn(gameArea);
                            startGame();    
                    }, 1000);

            })

            //sockets end

            //event listeners

            for (const button of initBtns) {
                button.addEventListener('click', function(event) {
                    
                    socket.emit ( 'clientSendsRestart', {
                        text: "restart",
                    }); 
                    
                })
            }

            for (const button of btnStats) {
                button.addEventListener('click', function(event) {
                    
                    window.open("graphStats.html");
                    
                })
            }

            

            btnStart.addEventListener('click',(e) => {
                   
                startGame();
               
            });

            chosenLetter.addEventListener('click',(e) => {
                   
                let letterToFind = e.target.innerHTML;
                
                if (e.target.className == "enabledLetter") {

                    socket.emit ( 'clientSendsLetter', {
                        letter: letterToFind,
                        
                    });  
                }

                
            });

            //event listeners end

            

            //functions
            const startGame = () => {

                chosenLetters = [];
                totalTries = 6;
                lostTry = 0;
               
                loadHangImage(lostTry);

                fetch('/words').then(
                    antwort => antwort.json()
                    ).then(
                    antwort => {
                        words = antwort;

                        //console.log(words);

                        word = words[Math.floor(Math.random() * words.length)];
                        
                        //console.log(word);
                        
                        socket.emit ( 'clientSendsWord', {
                            word: word,
                        }); 
                        
                    }
                    ).catch(
                        err => console.log ( err )
                    );

            }

            const getStatsUpdate = (found) =>{
                fetch("/statsUpdate?word="+word+"&found="+found+"&socketID="+socketID).then(
                    antwort => antwort.text()
                    ).then(
                    antwort => {
                         
                    //console.log(antwort);
                        
                    }
                    ).catch(
                        err => console.log ( err )
                    );
            }

            const createLetterInWordSpaces = (letterToFind,indexes) =>{


                const replaceAt = (string, index, replace) => {
                    return string.substring(0, index) + replace + string.substring(index + 1);
                }

                for (let i=0;i<indexes.length;i++){
                    wordSpaces.innerHTML = replaceAt(wordSpaces.innerHTML, indexes[i], letterToFind);
                }
                
                if (word == wordSpaces.innerHTML) {

                    getStatsUpdate(true);
                   fadeOut(gameArea);
                   disableSpanLetters();
                   setTimeout(function(){ 
                        displayNone(letters);
                        displayBlock(winMsg);
                        fadeIn(gameArea);
                        }, 1000);
                }
            }
 
            const loadHangImage = (lostTry) => {

                imgContainer.style.background = "url(images/"+lostTry+".jpg)";

            }

            const createWordSpaces = (word) => {
                let res = "";
                for (let i=0;i<word.length;i++){
                    res = res + "-";
                }
                wordSpaces.innerHTML=res;
            }


            const fadeIn = (el) =>{
                el.classList.add('show');
                el.classList.remove('hide');  
                }

            const fadeOut = (el) =>{
                el.classList.add('hide');
                el.classList.remove('show');
                }
            
            const displayNone = (el) =>{
                el.style.display='none';
            }

            const displayBlock = (el) =>{
                el.style.display='block';
            }
            
            const enableSpanLetters = () =>{
                for (const spanLetter of spanLetters) {
                    spanLetter.className = "enabledLetter";
                }
            }

            const disableSpanLetters = () =>{
                for (const spanLetter of spanLetters) {
                    spanLetter.className = "disabledLetter";
                }
            }
            //functions end
             
        });

    