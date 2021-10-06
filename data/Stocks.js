const {deck} = require("./Deck");
const {availableColors} = require("./Players")

/*
    type: card.type,
    history: [card.number],
    tokens: {
        yellow: 0,
        blue: 0
    },
    status: constant
 */

const stocks = initStocks()

function getStock(type) {
    for (const stock of stocks)
        if (stock.type === type)
            return stock
    return null
}

function getIndex(type) {
    let i = 0
    for (const stock of stocks)
        if (stock.type === type)
            return i
        else
            i += 1
    return -1
}

function stockTypes() {
    return stocks.map(v => v.type)
}

function getPlayableAs(card) {
    const types = stockTypes()
    const res = []
    if (types.includes(card.type))
        return canBuyStock(card) ? [card.type] : []
    else
        for (const type of types)
            if (canBuyStock({type, number: card.number}))
                res.push(type)
    return res
}

function resetStocks() {
    stocks.splice(0)
    initStocks(stocks)
}

function initStocks(stocks = [], once=false) {
    for (let i = deck.length - 1; i >= 0 && (stocks.length < 3 || once); i--) {
        let found = false
        for (const stock of stocks) {
            if (stock.type === deck[i].type) {
                found = true
                break
            }
        }
        if (!found) {
            let card = deck.splice(i, 1)[0]
            const stock = {
                type: card.type,
                history: [card.number],
                tokens: {},
                status: "constant"
            }
            for (const color of availableColors)
                stock.tokens[color] = 0
            if (!once)
                stocks.push(stock)
            else
                return stock
        }
    }
    if (once) return null
    for (let i = deck.length - 1; i >= 0; i--)
        for (const stock of stocks)
            if (stock.type === deck[i].type) {
                pushToStock(deck.splice(i, 1)[0], stock)
                return stocks
            }
}

function canBuyStock(card) {
    const stock = getStock(card.type)
    if (stock == null) return true
    if (card.number === stock.history[stock.history.length - 1] || stock.status === "constant") return true
    return (card.number > stock.history[stock.history.length - 1] && stock.status === "up") ||
            (card.number < stock.history[stock.history.length - 1] && stock.status === "down")
    /*if (card.number > stock.history[stock.history.length - 1]) {
        if (stock.history.length >= 2 && stock.history[stock.history.length - 1] < stock.history[stock.history.length - 2])
            return false
    } else if (card.number < stock.history[stock.history.length - 1]) {
        if (stock.history.length >= 2 && stock.history[stock.history.length - 1] > stock.history[stock.history.length - 2])
            return false
    }
    return true*/
}

function pushToStock(card, s=null) {
    const stock = s || getStock(card.type)
    if (card.number < stock.history[stock.history.length - 1]) stock.status = "down"
    else if (card.number > stock.history[stock.history.length - 1]) stock.status = "up"
    stock.history.push(card.number)
}

function buyStock(color, card) {
    const stock = getStock(card.type)
    if (stock.tokens[color] < 3)
        stock.tokens[color]++
    pushToStock(card)
}

function getWorth(color, type){
    const stock = getStock(type)
    let only = true
    for (const c of Object.keys(stock.tokens))
        if (c !== color && stock.tokens[c] !== 0) {
            only = false
            break
        }
    if (stock.tokens[color] === 3 && only) {
        let sum = 0
        for (const n of stock.history)
            sum += n
        return sum
    } else {
        const values = stock.history.slice(stock.history.length - stock.tokens[color])
        let sum = 0
        for (const n of values)
            sum += n
        return sum
    }
}

function replaceStock(stock) {
    let sum = 0
    for (const n of stock.history)
        sum += n
    const s = initStocks(stocks, true)
    if (s != null)
        stocks[getIndex(stock.type)] = s
    else
        stocks.splice(getIndex(stock.type), 1)
    return sum
}

function sellStock(color, type) {
    const stock = getStock(type)
    let only = true
    for (const c of Object.keys(stock.tokens))
        if (c !== color && stock.tokens[c] !== 0) {
            only = false
            break
        }

    if (stock.tokens[color] === 3 && only) {
        return replaceStock(stock)
    } else {
        const values = stock.history.splice(stock.history.length - stock.tokens[color])
        stock.tokens[color] = 0
        let status = "constant"
        for (let i = stock.history.length-1; i > 0; i--) {
            if (stock.history[i] < stock.history[i-1]){
                status = "down"
                break
            } else if (stock.history[i] > stock.history[i-1]){
                status = "up"
                break
            }
        }
        stock.status = status
        let sum = 0
        for (const n of values)
            sum += n
        return sum
    }
}

module.exports = {stocks, sellStock,getStock, canBuyStock, buyStock, pushToStock, getPlayableAs, stockTypes, getWorth, resetStocks}