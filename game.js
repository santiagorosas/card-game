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
            const enemy = document.querySelector('.enemy');
            
            // Create slash container if it doesn't exist
            let slashContainer = document.querySelector('.slash-container');
            if (!slashContainer) {
                slashContainer = document.createElement('div');
                slashContainer.className = 'slash-container';
                enemy.appendChild(slashContainer);
            }
            
            // Create and animate slash effect
            const slash = document.createElement('div');
            slash.className = 'slash';
            slashContainer.appendChild(slash);
            
            // Create blood particles
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'blood-particle';
                
                // Random position within the enemy
                const x = Math.random() * 100 - 50;
                const y = Math.random() * 100 - 50;
                particle.style.left = `calc(50% + ${x}px)`;
                particle.style.top = `calc(50% + ${y}px)`;
                
                // Random direction for spray
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 50;
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;
                
                particle.style.setProperty('--dx', `${dx}px`);
                particle.style.setProperty('--dy', `${dy}px`);
                particle.style.animation = 'bloodSpray 0.5s ease-out forwards';
                
                enemy.appendChild(particle);
                
                // Remove particle after animation
                setTimeout(() => particle.remove(), 500);
            }
            
            // Add hit reaction
            enemy.classList.add('hit');
            
            // Create damage number
            const damageNumber = document.createElement('div');
            damageNumber.className = 'damage-number';
            damageNumber.textContent = actualDamage;
            
            // Position the damage number randomly around the enemy
            const randomX = Math.random() * 40 - 20;
            damageNumber.style.left = `calc(50% + ${randomX}px)`;
            damageNumber.style.top = '50%';
            
            enemy.appendChild(damageNumber);
            
            // Remove elements after animations
            setTimeout(() => {
                slash.remove();
                damageNumber.remove();
                enemy.classList.remove('hit');
            }, 500);
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
        const gameContainer = document.querySelector('.game-container');
        
        // Stop the floating animation
        enemy.style.animation = 'none';
        
        // Short pause before attack
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Add attacking class to trigger animation
        enemy.classList.add('attacking');
        
        // Wait until the enemy reaches its lowest point (45% of animation)
        await new Promise(resolve => setTimeout(resolve, 450));
        
        // Add screen shake and deal damage at the lowest point
        gameContainer.classList.add('screen-shake');
        this.takeDamage(8);
        
        // Wait for the attack animation to complete
        await new Promise(resolve => setTimeout(resolve, 550));
        
        // Remove screen shake and attacking class
        gameContainer.classList.remove('screen-shake');
        enemy.classList.remove('attacking');
        
        // Restore floating animation
        enemy.style.animation = 'float 3s ease-in-out infinite';
        
        // Shorter delay before ending turn
        await new Promise(resolve => setTimeout(resolve, 700));
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