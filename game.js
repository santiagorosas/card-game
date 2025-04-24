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
        this.isPlayerTurn = true;
        this.initializeDeck();
        this.drawHand();
        this.createEndTurnButton();
    }

    createEndTurnButton() {
        const endTurnButton = document.createElement('button');
        endTurnButton.textContent = 'End Turn';
        endTurnButton.style.position = 'fixed';
        endTurnButton.style.bottom = '20px';
        endTurnButton.style.right = '20px';
        endTurnButton.id = 'endTurnButton';
        endTurnButton.addEventListener('click', () => this.endTurn());
        document.body.appendChild(endTurnButton);
    }

    async endTurn() {
        this.isPlayerTurn = false;
        
        // Hide UI elements
        document.getElementById('endTurnButton').style.display = 'none';
        const handElement = document.getElementById('hand');
        handElement.classList.remove('visible');
        handElement.classList.add('hidden');
        
        // Move remaining cards to discard pile
        this.discardPile.push(...this.hand);
        this.hand = [];
        
        this.currentEnergy = this.maxEnergy;
        this.playerBlock = 0;
        this.drawHand();
        
        // Make enemy turn async
        await this.enemyTurn();
        
        // Return to player's turn
        this.isPlayerTurn = true;
        
        // Show UI elements
        document.getElementById('endTurnButton').style.display = 'block';
        handElement.classList.remove('hidden');
        handElement.classList.add('visible');
        
        updateUI();
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
        
        // Add visible class if it's player's turn
        if (this.isPlayerTurn) {
            handElement.classList.remove('hidden');
            handElement.classList.add('visible');
        } else {
            handElement.classList.remove('visible');
            handElement.classList.add('hidden');
        }
        
        this.hand.forEach(card => {
            handElement.appendChild(card.createElement());
        });
    }

    async enemyTurn() {
        const enemy = document.querySelector('.enemy');
        
        // Stop the floating animation
        enemy.style.animation = 'none';
        
        // Wait a moment before attacking
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Add attacking class to trigger animation
        enemy.classList.add('attacking');
        
        // Wait for the attack animation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Deal damage
        this.takeDamage(8);
        
        // Wait for the damage animation and numbers to show
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Remove attacking class and restore floating animation
        enemy.classList.remove('attacking');
        enemy.style.animation = 'float 3s ease-in-out infinite';
        
        // Additional delay before ending turn
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    takeDamage(amount) {
        // First reduce block
        if (this.playerBlock > 0) {
            const remainingBlock = this.playerBlock - amount;
            if (remainingBlock >= 0) {
                this.playerBlock = remainingBlock;
                this.showBlockedDamage(amount);
                return;
            } else {
                amount = -remainingBlock;
                this.playerBlock = 0;
            }
        }
        
        // Then reduce health and show damage
        const oldHealth = this.playerHealth;
        this.playerHealth = Math.max(0, this.playerHealth - amount);
        const actualDamage = oldHealth - this.playerHealth;
        
        if (actualDamage > 0) {
            this.showPlayerDamage(actualDamage);
        }
    }

    showPlayerDamage(amount) {
        const playerArea = document.querySelector('.player-area');
        const damageNumber = document.createElement('div');
        damageNumber.className = 'player-damage-number';
        damageNumber.textContent = amount;
        
        // Position the damage number in the player area
        damageNumber.style.left = '50%';
        damageNumber.style.top = '40%';
        damageNumber.style.transform = 'translateX(-50%)';
        
        playerArea.appendChild(damageNumber);
        
        // Remove the damage number after animation
        setTimeout(() => {
            damageNumber.remove();
        }, 1000);
    }

    showBlockedDamage(amount) {
        const playerArea = document.querySelector('.player-area');
        const blockNumber = document.createElement('div');
        blockNumber.className = 'player-damage-number';
        blockNumber.textContent = 'BLOCKED!';
        blockNumber.style.color = '#4CAF50';
        blockNumber.style.fontSize = '2rem';
        
        // Position the block text in the player area
        blockNumber.style.left = '50%';
        blockNumber.style.top = '40%';
        blockNumber.style.transform = 'translateX(-50%)';
        
        playerArea.appendChild(blockNumber);
        
        // Remove the block text after animation
        setTimeout(() => {
            blockNumber.remove();
        }, 1000);
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