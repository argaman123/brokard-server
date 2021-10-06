const {deck, drawCard} = require("./Deck")

/*
    color,
    name,
    cards: deck.splice(deck.length - 4, 4),
    special: null,
    tokens: {}, // type: amount
    draws: 1,
    total: 0,
    turn: color
 */

const players = []
const availableColors = ["yellow", "blue"]

function resetPlayers() {
    for (let i = 0; i < players.length; i++) {
        players[i] = newPlayer(players[i].color, players[i].name)
    }
}

function getPlayerByColor(color) {
    for (const player of players)
        if (player.color === color)
            return player
    return null
}

function getAvailableColors() {
    const colors = []
    for (const c of availableColors) {
        if (getPlayerByColor(c) == null)
            colors.push(c)
    }
    return colors
}

function nameToColor(name) {
    for (const p of players)
        if (p.name === name)
            return p.color
    return null
}

function getPlayerByName(name) {
    for (const p of players)
        if (p.name === name)
            return p
    return null
}

function newPlayer(color = null, name = color) {
    if (color == null || !color.trim()) {
        const all = getAvailableColors()
        if (all.length > 0)
            color = all[0]
    }
    if (color == null || !color.trim() || deck.length < 4) {
        return null
    } else {
        console.log("color:"+color + ",name: " + name)
        return {
            color,
            name: (name == null || !name.trim()) ? color : name,
            cards: deck.splice(deck.length - 4, 4),
            special: null,
            tokens: {},
            draws: true,
            total: 0,
            turn: color
        }
    }
}

function isTokenAvailable(color, types) {
    const player = getPlayerByColor(color)
    const amounts = {1: 0, 2: 0, 3: 0}
    for (const type of Object.keys(player.tokens))
        if (player.tokens[type].amount !== 0)
            amounts[player.tokens[type].amount] += 1
    // ADD JOKER SUPPORT
    const res = []
    for (let i = 0; i < types.length; i++) {
        if (types[i] in player.tokens) {
            if (player.tokens[types[i]].amount + 1 <= 3)
                if (amounts[player.tokens[types[i]].amount + 1] + 1 > 2)
                    continue
        } else {
            if (amounts[1] + 1 > 2)
                continue
        }
        res.push(types[i])
    }
    return res
}

function addDraws(player) {
    player.draws = true
}

function useDraw(color, types) {
    const player = getPlayerByColor(color)
    player.draws = false
    player.special = drawCard()
    if (player.special != null) {
        if (types.includes(player.special.type))
            player.special.playableAs = [player.special.type]
        else
            player.special.playableAs = types
    }
    return player.special != null
}

function getCardIndex(player, card) {
    let index = 0
    for (const c of player.cards)
        if (c.type === card.type && c.number === card.number)
            return index
        else
            index += 1
    return -1
}

function clearSpecial(player) {
    const special = player.special
    player.special = null
    return special
}

function claimSpecial(color, card) {
    const player = getPlayerByColor(color)
    player.cards[getCardIndex(player, card)] = {...player.special}
    clearSpecial(player)
    /*player.cards.splice(getCardIndex(player, card), 1)
    if (player.special != null) {
        player.cards.push(player.special)
        clearSpecial(player)
    }*/
}

function useSpecial(color) {
    const player = getPlayerByColor(color)
    return clearSpecial(player)
}

function useToken(color, card, real = null) {
    if (real == null)
        real = card
    const player = getPlayerByColor(color)
    player.cards.splice(getCardIndex(player, real), 1)
    const c = drawCard()
    if (c != null) player.cards.push(c)
    if (!(card.type in player.tokens))
        player.tokens[card.type] = {amount: 1}
    else if (player.tokens[card.type].amount <= 2)
        player.tokens[card.type].amount += 1
    addDraws(player)
}

function claimToken(color, type, worth) {
    const player = getPlayerByColor(color)
    delete player.tokens[type]
    player.total += worth
    addDraws(player)
}

module.exports = {
    players,
    availableColors,
    getPlayerByName,
    nameToColor,
    getAvailableColors,
    isTokenAvailable,
    useToken,
    claimToken,
    newPlayer,
    useDraw,
    useSpecial,
    claimSpecial,
    getPlayerByColor,
    clearSpecial,
    addDraws,
    resetPlayers
}