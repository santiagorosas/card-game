class Card {
    constructor(name, cost, description, effect) {
        this.name = name;
        this.cost = cost;
        this.description = description;
        this.effect = effect;
    }

    createElement() {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <div class="card-cost">${this.cost}</div>
            <div class="card-name">${this.name}</div>
            <div class="card-description">${this.description}</div>
        `;
        cardElement.addEventListener('click', () => gameState.playCard(this));
        return cardElement;
    }
}

class GameState {
    constructor() {
        this.playerHealth = 80;
        this.maxPlayerHealth = 80;
        this.enemyHealth = 100;
        this.maxEnemyHealth = 100;
        this.maxEnergy = 3;
        this.currentEnergy = 3;
        this.playerBlock = 0;
        this.hand = [];
        this.deck = [];
        this.discardPile = [];
        this.initializeDeck();
        this.drawHand();
    }

    initializeDeck() {
        const starterDeck = [
            new Card('Strike', 1, 'Deal 6 damage', () => {
                this.enemyHealth = Math.max(0, this.enemyHealth - 6);
            }),
            new Card('Strike', 1, 'Deal 6 damage', () => {
                this.enemyHealth = Math.max(0, this.enemyHealth - 6);
            }),
            new Card('Strike', 1, 'Deal 6 damage', () => {
                this.enemyHealth = Math.max(0, this.enemyHealth - 6);
            }),
            new Card('Defend', 1, 'Gain 5 block', () => {
                this.playerBlock += 5;
            }),
            new Card('Defend', 1, 'Gain 5 block', () => {
                this.playerBlock += 5;
            }),
            new Card('Defend', 1, 'Gain 5 block', () => {
                this.playerBlock += 5;
            }),
            new Card('Bash', 2, 'Deal 8 damage and gain 3 block', () => {
                this.enemyHealth = Math.max(0, this.enemyHealth - 8);
                this.playerBlock += 3;
            })
        ];

        this.deck = [...starterDeck];
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
        if (this.deck.length === 0) {
            if (this.discardPile.length === 0) {
                return null;
            }
            this.deck = [...this.discardPile];
            this.discardPile = [];
            this.shuffleDeck();
        }
        return this.deck.pop();
    }

    drawHand() {
        const cardsToDraw = 5 - this.hand.length;
        
        for (let i = 0; i < cardsToDraw; i++) {
            const card = this.drawCard();
            if (card) {
                this.hand.push(card);
            }
        }
        
        this.renderHand();
    }

    playCard(card) {
        if (this.currentEnergy >= card.cost) {
            card.effect();
            this.currentEnergy -= card.cost;
            
            const cardIndex = this.hand.indexOf(card);
            if (cardIndex !== -1) {
                this.hand.splice(cardIndex, 1);
                this.discardPile.push(card);
            }
            
            updateUI();
        }
    }

    endTurn() {
        this.discardPile.push(...this.hand);
        this.hand = [];
        
        this.currentEnergy = this.maxEnergy;
        this.playerBlock = 0;
        this.drawHand();
        this.enemyTurn();
        updateUI();
    }

    enemyTurn() {
        this.takeDamage(8);
    }

    takeDamage(amount) {
        if (this.playerBlock > 0) {
            const remainingBlock = this.playerBlock - amount;
            if (remainingBlock >= 0) {
                this.playerBlock = remainingBlock;
                return;
            } else {
                amount = -remainingBlock;
                this.playerBlock = 0;
            }
        }
        this.playerHealth = Math.max(0, this.playerHealth - amount);
    }
}

const gameState = new GameState();

function updateUI() {
    document.querySelector('.player-health').textContent = 
        `${gameState.playerHealth}/${gameState.maxPlayerHealth}`;
    document.querySelector('.enemy-health').textContent = 
        `${gameState.enemyHealth}/${gameState.maxEnemyHealth}`;
    document.querySelector('.player-energy').textContent = 
        `${gameState.currentEnergy}/${gameState.maxEnergy}`;
    
    const playerStats = document.querySelector('.player-stats');
    if (!document.querySelector('.player-block')) {
        const blockElement = document.createElement('div');
        blockElement.className = 'player-block';
        playerStats.appendChild(blockElement);
    }
    document.querySelector('.player-block').textContent = 
        `Block: ${gameState.playerBlock}`;
}

const endTurnButton = document.createElement('button');
endTurnButton.textContent = 'End Turn';
endTurnButton.style.position = 'absolute';
endTurnButton.style.bottom = '20px';
endTurnButton.style.right = '20px';
endTurnButton.addEventListener('click', () => gameState.endTurn());
document.body.appendChild(endTurnButton);

updateUI(); 