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

class SoundManager {
    constructor() {
        this.sounds = {
            cardPlay: new Audio('sounds/card_play.mp3'),
            cardDraw: new Audio('sounds/card_draw.mp3'),
            enemyHit: new Audio('sounds/enemy_hit.mp3'),
            playerHit: new Audio('sounds/player_hit.mp3'),
            block: new Audio('sounds/block.mp3'),
            shield: new Audio('sounds/shield.mp3'),
            turnEnd: new Audio('sounds/turn_end.mp3'),
            victory: new Audio('sounds/victory.mp3'),
            defeat: new Audio('sounds/defeat.mp3')
        };

        // Set volume levels
        this.sounds.cardPlay.volume = 0.5;
        this.sounds.cardDraw.volume = 0.4;
        this.sounds.enemyHit.volume = 0.6;
        this.sounds.playerHit.volume = 0.6;
        this.sounds.block.volume = 0.5;
        this.sounds.shield.volume = 0.4;
        this.sounds.turnEnd.volume = 0.3;
        this.sounds.victory.volume = 0.7;
        this.sounds.defeat.volume = 0.7;
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            // Reset the sound to start if it's already playing
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.log('Audio play failed:', e));
        }
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
        this.soundManager = new SoundManager();
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
        this.soundManager.play('turnEnd');
        
        // Hide UI elements
        document.getElementById('endTurnButton').style.display = 'none';
        const handElement = document.getElementById('hand');
        handElement.classList.remove('visible');
        handElement.classList.add('hidden');
        
        // Move remaining cards to discard pile
        this.discardPile.push(...this.hand);
        this.hand = [];
        
        this.currentEnergy = this.maxEnergy;
        this.drawHand();
        
        // Make enemy turn async
        await this.enemyTurn();
        
        // Reset block after enemy turn
        this.playerBlock = 0;
        
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
            this.soundManager.play('enemyHit');
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
            }),
            // New card: Rage
            new Card('Rage', 1, 'Deal damage equal to the damage you took this turn', () => {
                const damageTaken = this.maxPlayerHealth - this.playerHealth;
                if (damageTaken > 0) {
                    this.dealDamageToEnemy(damageTaken);
                }
            }),
            // New card: Riposte
            new Card('Riposte', 2, 'Gain 8 block. Deal damage equal to the block you have', () => {
                this.playerBlock += 8;
                this.dealDamageToEnemy(this.playerBlock);
            }),
            // New card: Blood Pact
            new Card('Blood Pact', 0, 'Lose 3 health. Gain 2 energy', () => {
                this.playerHealth = Math.max(1, this.playerHealth - 3);
                this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + 2);
                this.showPlayerDamage(3);
                updateUI();
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
                // Play draw sound for each card
                this.soundManager.play('cardDraw');
            }
        }
        
        this.renderHand();
    }

    playCard(card) {
        if (this.currentEnergy >= card.cost) {
            card.effect();
            this.currentEnergy -= card.cost;
            
            // Play card sound
            this.soundManager.play('cardPlay');
            
            // Show shield effect for Block cards
            if (card.name === 'Defend') {
                const playerArea = document.querySelector('.player-area');
                const shield = document.createElement('div');
                shield.className = 'shield-effect';
                playerArea.appendChild(shield);
                
                // Play shield sound
                this.soundManager.play('shield');
                
                // Remove shield after animation
                setTimeout(() => shield.remove(), 1500);
            }
            
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
            const cardElement = card.createElement();
            
            // Disable card if player doesn't have enough energy
            if (this.currentEnergy < card.cost) {
                cardElement.classList.add('disabled');
            }
            
            handElement.appendChild(cardElement);
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
        updateUI();
        
        // Wait for the attack animation to complete
        await new Promise(resolve => setTimeout(resolve, 550));
        
        // Remove screen shake and attacking class
        gameContainer.classList.remove('screen-shake');
        enemy.classList.remove('attacking');
        
        // Restore floating animation
        enemy.style.animation = 'float 3s ease-in-out infinite';
        
        // Shorter delay before ending turn
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // Final UI update before ending turn
        updateUI();
    }

    takeDamage(amount) {
        let damageToHealth = amount;
        
        // First reduce block
        if (this.playerBlock > 0) {
            const blockedAmount = Math.min(this.playerBlock, amount);
            this.playerBlock -= blockedAmount;
            damageToHealth = amount - blockedAmount;
            
            if (blockedAmount > 0) {
                this.showBlockedDamage(blockedAmount);
                this.soundManager.play('block');
            }
        }
        
        // Then reduce health if there's remaining damage
        if (damageToHealth > 0) {
            const oldHealth = this.playerHealth;
            this.playerHealth = Math.max(0, this.playerHealth - damageToHealth);
            const actualDamage = oldHealth - this.playerHealth;
            
            if (actualDamage > 0) {
                this.showPlayerDamage(actualDamage);
                this.soundManager.play('playerHit');
            }
        }
        
        updateUI();
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
        blockNumber.textContent = `${amount} BLOCKED!`;
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