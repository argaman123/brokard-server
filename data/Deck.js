const deck = initDeck()
shuffleDeck()

function resetDeck(){
    deck.splice(0)
    initDeck(deck)
    shuffleDeck()
}

function initDeck(deck = []) {
    const types = ["Hearts", "Spades", "Clubs", "Diamonds"]
    for (const type of types) {
        for (let number = 1; number <= 13; number++) {
            deck.push({
                type,
                number
            })
        }
    }
    return deck
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCard(){
    if (deck.length <= 0) return null
    return deck.splice(0, 1)[0]
}

module.exports = {deck, shuffleDeck, initDeck, drawCard, resetDeck}