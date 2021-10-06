const {deck, shuffleDeck, resetDeck} = require("./data/Deck")
const {players, newPlayer, isTokenAvailable, useToken, claimToken, useDraw, useSpecial, claimSpecial, getPlayerByColor,
    clearSpecial, addDraws, resetPlayers, getAvailableColors
} = require("./data/Players")
const {stocks, buyStock, sellStock, pushToStock, getPlayableAs, stockTypes, getWorth, resetStocks, getStock} = require("./data/Stocks")

const express = require("express")()
const http = require("http").Server(express)
const socketIO = require("socket.io")(http, {
    cors: {
        origin: '*',
    }
})

const sockets = {
    mains: [],
    players: []
}

const commands = {}
let currentPlayerIndex = 0

commands.buyStock = ({color, card, real=null}) => {
    // CHECK INSIDE THE APP ITSELF
    //if (canBuyStock(card) && isTokenAvailable(color, card)){
    if (real == null)
        real = card
    buyStock(color, card)
    useToken(color, card, real)
    nextPlayer()
        //return true
    //}
    //return false
}

commands.sellStock = ({color, type}) => {
    claimToken(color, type, sellStock(color, type))
    nextPlayer()
}

commands.drawCard = ({color}) => {
    if (!useDraw(color, stockTypes()))
        nextPlayer()
}

commands.forceReplace = ({color, card}) => {
    claimSpecial(color, card)
    nextPlayer()
}

commands.forceStock = ({color, type=null}) => {
    const special = useSpecial(color)
    if (type != null) special.type = type
    pushToStock(special)
    nextPlayer()
}

commands.clearSpecial = ({color}) => {
    clearSpecial(getPlayerByColor(color))
    nextPlayer()
}

let firstSkipped = ""

function figureWinner(){
    let maxPlayer = ""
    let maxScore = -1
    let maxName = ""
    for (const player of players)
        if (player.total > maxScore){
            maxPlayer = player.color
            maxScore = player.total
            maxName = player.name
        }
    return {color: maxPlayer, name: maxName, score: maxScore}
}

function resetAll(){
    resetDeck()
    resetStocks()
    resetPlayers()
    refresh()
}

function win(){
    console.log("win")
    for (const main of sockets.mains)
        main.emit("win", figureWinner())
    setTimeout(() => {
        resetAll()
        for (const main of sockets.mains)
            main.emit("win", null)
    }, 10000);
}

commands.skipTurn = ({color}) => {
    addDraws(getPlayerByColor(color))
    nextPlayer(true)
    if (firstSkipped === "")
        firstSkipped = color
    else if (firstSkipped === players[currentPlayerIndex].color)
        win()
}

function nextPlayer(skip=false){
    if (players.length > 0)
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length
    else
        currentPlayerIndex = 0
    if (!skip)
        firstSkipped = ""
}

function refresh(){
    for (const color of Object.keys(sockets.players)) {
        const player = getPlayerByColor(color)
        player.turn = {name: players[currentPlayerIndex].name, color: players[currentPlayerIndex].color}
        for (const token of Object.keys(player.tokens)) {
            player.tokens[token].worth = getWorth(color, token)
        }
        for (let i = 0; i < player.cards.length; i++)
            player.cards[i].playableAs = isTokenAvailable(color, getPlayableAs(player.cards[i]))
            //player.cards[i].playable = canBuyStock(player.cards[i]) && isTokenAvailable(color, player.cards[i])
        sockets.players[color].emit("init", player)
    }
    // refresh stock
    if (sockets.mains.length > 0) {
        let color = null
        let name = null
        if (currentPlayerIndex < players.length){
            color = players[currentPlayerIndex].color
            name = players[currentPlayerIndex].name
        }
        for (const main of sockets.mains)
            main.emit("init", {stocks, color, name, cardsLeft: deck.length})
    }
}

const waiting = []

function refreshWaiting(){
    for (const socket of waiting)
        socket.emit("available", getAvailableColors())
}

function handlePlayer(socket) {
    socket.emit("available", getAvailableColors())
    waiting.push(socket)
    socket.on("info", ({color, name}) => {
        console.log(color, name)
        const player = newPlayer(color, name)
        if (player == null) {
            socket.emit("bad")
            return
        }
        waiting.splice(waiting.indexOf(socket), 1)
        console.log("New Player!")
        players.push(player)
        sockets.players[player.color] = socket
        refresh()
        refreshWaiting()
        for (const command of Object.keys(commands))
            socket.on(command, data => {
                console.log(command)
                commands[command]({color: player.color, ...data})
                stocks.currentColor = players[currentPlayerIndex].color
                refresh()
            })

        socket.on("disconnect", () => {
            console.log("Player Disconnected!")
            deck.push(...player.cards)
            if (player.special != null) deck.push(player.special)
            shuffleDeck(deck)
            for (const type of Object.keys(player.tokens))
                getStock(type).tokens[player.color] = 0
            players.splice(players.findIndex(p => p.color === player.color), 1)
            delete sockets.players[player.color]
            nextPlayer()
            refresh()
            refreshWaiting()
        })
    })
}

function handleMain(socket) {
    console.log("Main Connected!")
    resetAll()
    sockets.mains.push(socket)
    let color = null
    let name = null
    if (currentPlayerIndex < players.length){
        color = players[currentPlayerIndex].color
        name = players[currentPlayerIndex].name
    }
    socket.emit("init", {stocks, color, name, cardsLeft: deck.length})
    /* const updateStocks = () => {
         stocks.forEach(stock => {
             for (let i = deck.length - 1; i >= 0; i--) {
                 if (deck[i].type === stock.type) {
                     let card = deck.splice(i, 1)[0]
                     console.log(card)
                     stock.history.push(card.number)
                     break
                 }
             }
         })
         socket.emit("init", stocks)
         if (deck.length > 3)
             setTimeout(updateStocks, 3000);
     }

     setTimeout(updateStocks, 3000);*/
    socket.on("disconnect", () => {
        console.log("Main Disconnected!")
        sockets.mains.splice(sockets.mains.indexOf(socket), 1)
    })
}

// handle joker types and letting the player know of that

socketIO.on("connection", socket => {
    let handled = false
    socket.on("type", (type) => {
        if (!handled) {
            handled = true
            if (type === "player") handlePlayer(socket)
            else if (type === "main") handleMain(socket)
            else handled = false
        }
    })
})

http.listen(25123, () => {
    console.log("Listening at :25123")
})