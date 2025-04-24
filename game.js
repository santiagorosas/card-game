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

    dealDamageToEnemy(amount) {
        const oldHealth = this.enemyHealth;
        this.enemyHealth = Math.max(0, this.enemyHealth - amount);
        const actualDamage = oldHealth - this.enemyHealth;
        
        if (actualDamage > 0) {
            // Create damage number
            const enemy = document.querySelector('.enemy');
            const damageNumber = document.createElement('div');
            damageNumber.className = 'damage-number';
            damageNumber.textContent = actualDamage;
            
            // Position the damage number randomly around the enemy
            const randomX = Math.random() * 40 - 20; // Random position ±20px
            damageNumber.style.left = `calc(50% + ${randomX}px)`;
            damageNumber.style.top = '50%';
            
            // Add shake and flash effect to enemy
            enemy.classList.add('damaged');
            
            // Remove the damaged class after animation
            setTimeout(() => {
                enemy.classList.remove('damaged');
            }, 300);

            // Add the damage number to the enemy area
            enemy.appendChild(damageNumber);
            
            // Remove the damage number after animation
            setTimeout(() => {
                damageNumber.remove();
            }, 1000);
        }
        
        updateUI();
    }

    initializeDeck() {
        const starterDeck = [
            new Card('Strike', 1, 'Deal 6 damage', () => {
                this.dealDamageToEnemy(6);
            }),
            new Card('Strike', 1, 'Deal 6 damage', () => {
                this.dealDamageToEnemy(6);
            }),
            new Card('Strike', 1, 'Deal 6 damage', () => {
                this.dealDamageToEnemy(6);
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
                this.dealDamageToEnemy(8);
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
            
            this.renderHand();
            updateUI();
        }
    }

    renderHand() {
        const handElement = document.getElementById('hand');
        handElement.innerHTML = '';
        this.hand.forEach(card => {
            handElement.appendChild(card.createElement());
        });
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