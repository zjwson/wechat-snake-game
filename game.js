import audioManager from './audio.js'
import particleSystem from './particles.js'

const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')
const systemInfo = wx.getSystemInfoSync()

// 设置画布尺寸为屏幕尺寸
canvas.width = systemInfo.windowWidth
canvas.height = systemInfo.windowHeight

// 游戏配置
const config = {
    gridSize: Math.floor(Math.min(canvas.width, canvas.height - 200) / 30), // 减去控制区域高度
    snakeColor: '#4CAF50',
    foodColor: '#FF5722',
    backgroundColor: '#1a1a1a',
    borderColor: '#333333',
    baseSpeed: 200, // 基础速度
    minSpeed: 80,   // 最快速度
    initialSnakeLength: 3,
    controlAreaHeight: 180, // 控制区域高度
    scoreAreaHeight: 60,    // 分数区域高度
    controlButtonSize: 60,
    controlPadding: 20,
    foodTypes: [
        { color: '#FF5722', points: 1, probability: 0.7 },  // 普通食物
        { color: '#FFC107', points: 2, probability: 0.2 },  // 金色食物
        { color: '#E91E63', points: 3, probability: 0.1 }   // 稀有食物
    ]
}

// 游戏状态
let gameState = {
    snake: [],
    food: null,
    direction: 'right',
    score: 0,
    isGameOver: false,
    isPaused: false,
    highScore: 0,
    combo: 0,
    lastFoodType: null,
    particles: [],  // 特效粒子
    gameLevel: 1    // 当前等级
}

// 粒子系统
class Particle {
    constructor(x, y, color) {
        this.x = x
        this.y = y
        this.color = color
        this.size = Math.random() * 4 + 2
        this.speedX = (Math.random() - 0.5) * 6
        this.speedY = (Math.random() - 0.5) * 6
        this.life = 1.0
    }

    update() {
        this.x += this.speedX
        this.y += this.speedY
        this.life -= 0.02
        this.size *= 0.97
    }

    draw(ctx) {
        ctx.fillStyle = this.color + Math.floor(this.life * 255).toString(16).padStart(2, '0')
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
    }
}

// 控制按钮布局优化
const controlButtons = {
    up: {
        x: canvas.width / 2 - config.controlButtonSize / 2,
        y: canvas.height - config.controlAreaHeight + config.controlPadding,
        width: config.controlButtonSize,
        height: config.controlButtonSize,
        icon: '↑'
    },
    down: {
        x: canvas.width / 2 - config.controlButtonSize / 2,
        y: canvas.height - config.controlAreaHeight + config.controlPadding * 3 + config.controlButtonSize,
        width: config.controlButtonSize,
        height: config.controlButtonSize,
        icon: '↓'
    },
    left: {
        x: canvas.width / 2 - config.controlButtonSize - config.controlPadding * 2.5,
        y: canvas.height - config.controlAreaHeight + config.controlPadding * 2 + config.controlButtonSize / 2,
        width: config.controlButtonSize,
        height: config.controlButtonSize,
        icon: '←'
    },
    right: {
        x: canvas.width / 2 + config.controlButtonSize - config.controlPadding / 2,
        y: canvas.height - config.controlAreaHeight + config.controlPadding * 2 + config.controlButtonSize / 2,
        width: config.controlButtonSize,
        height: config.controlButtonSize,
        icon: '→'
    },
    pause: {
        x: canvas.width - config.controlButtonSize - config.controlPadding,
        y: canvas.height - config.controlAreaHeight + config.controlPadding * 3 + config.controlButtonSize,
        width: config.controlButtonSize,
        height: config.controlButtonSize,
        icon: '⏸'
    }
}

// 计算当前速度（优化速度增长曲线）
function getCurrentSpeed() {
    const baseDecrease = Math.min((gameState.snake.length - config.initialSnakeLength) * 3, 100)
    const levelDecrease = (gameState.gameLevel - 1) * 10
    const totalDecrease = baseDecrease + levelDecrease
    return Math.max(config.minSpeed, config.baseSpeed - totalDecrease)
}

// 生成食物
function generateFood() {
    const maxY = Math.floor((canvas.height - config.controlAreaHeight - config.scoreAreaHeight) / config.gridSize)
    let foodType = selectFoodType()
    
    const food = {
        x: Math.floor(Math.random() * (canvas.width / config.gridSize)),
        y: Math.floor(Math.random() * maxY),
        type: foodType
    }

    // 确保食物不会生成在蛇身上
    while (gameState.snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food.x = Math.floor(Math.random() * (canvas.width / config.gridSize))
        food.y = Math.floor(Math.random() * maxY)
    }

    return food
}

// 选择食物类型
function selectFoodType() {
    const rand = Math.random()
    let cumProb = 0
    for (const type of config.foodTypes) {
        cumProb += type.probability
        if (rand <= cumProb) return type
    }
    return config.foodTypes[0]
}

// 添加粒子效果
function addParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color))
    }
}

// 更新粒子
function updateParticles() {
    gameState.particles = gameState.particles.filter(particle => {
        particle.update()
        return particle.life > 0
    })
}

// 绘制游戏界面
function render() {
    // 清空画布
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 绘制游戏区域边框
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 2
    ctx.strokeRect(0, config.scoreAreaHeight, canvas.width, 
                  canvas.height - config.controlAreaHeight - config.scoreAreaHeight)

    // 绘制控制区域背景
    ctx.fillStyle = '#222'
    ctx.fillRect(0, canvas.height - config.controlAreaHeight, 
                canvas.width, config.controlAreaHeight)
    
    // 绘制分数区域
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, canvas.width, config.scoreAreaHeight)
    
    // 绘制分数和最高分
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`分数: ${gameState.score}`, 20, config.scoreAreaHeight / 2)
    
    ctx.textAlign = 'right'
    ctx.fillText(`最高分: ${gameState.highScore}`, canvas.width - 20, config.scoreAreaHeight / 2)
    
    // 绘制等级
    ctx.textAlign = 'center'
    ctx.fillText(`Level ${gameState.gameLevel}`, canvas.width / 2, config.scoreAreaHeight / 2)
    
    // 绘制连击数
    if (gameState.combo > 1) {
        ctx.fillStyle = '#FFC107'
        ctx.font = 'bold 20px Arial'
        ctx.fillText(`${gameState.combo}连击!`, canvas.width / 2, config.scoreAreaHeight + 30)
    }

    // 绘制蛇
    gameState.snake.forEach((segment, index) => {
        const x = segment.x * config.gridSize
        const y = segment.y * config.gridSize + config.scoreAreaHeight
        
        // 蛇头
        if (index === 0) {
            ctx.fillStyle = '#66BB6A'
            ctx.beginPath()
            ctx.arc(x + config.gridSize/2, y + config.gridSize/2, 
                   config.gridSize/2, 0, Math.PI * 2)
            ctx.fill()
            
            // 眼睛
            ctx.fillStyle = '#000'
            const eyeSize = config.gridSize/6
            ctx.beginPath()
            ctx.arc(x + config.gridSize/2 - eyeSize*2, y + config.gridSize/2, 
                   eyeSize, 0, Math.PI * 2)
            ctx.arc(x + config.gridSize/2 + eyeSize*2, y + config.gridSize/2, 
                   eyeSize, 0, Math.PI * 2)
            ctx.fill()
        } 
        // 蛇身
        else {
            const gradient = ctx.createRadialGradient(
                x + config.gridSize/2, y + config.gridSize/2, 0,
                x + config.gridSize/2, y + config.gridSize/2, config.gridSize/2
            )
            gradient.addColorStop(0, '#4CAF50')
            gradient.addColorStop(1, '#388E3C')
            
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(x + config.gridSize/2, y + config.gridSize/2, 
                   config.gridSize/2 - 1, 0, Math.PI * 2)
            ctx.fill()
        }
    })
    
    // 绘制食物
    if (gameState.food) {
        const x = gameState.food.x * config.gridSize
        const y = gameState.food.y * config.gridSize + config.scoreAreaHeight
        
        ctx.fillStyle = gameState.food.type.color
        ctx.beginPath()
        ctx.arc(x + config.gridSize/2, y + config.gridSize/2, 
               config.gridSize/2 - 1, 0, Math.PI * 2)
        ctx.fill()
        
        // 食物光晕效果
        ctx.strokeStyle = gameState.food.type.color + '80'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x + config.gridSize/2, y + config.gridSize/2, 
               config.gridSize/2 + Math.sin(Date.now()/200) * 3, 0, Math.PI * 2)
        ctx.stroke()
    }
    
    // 绘制粒子
    gameState.particles.forEach(particle => particle.draw(ctx))
    
    // 绘制控制按钮
    drawControlButtons()
    
    // 游戏结束或暂停显示
    if (gameState.isGameOver || gameState.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 40px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(
            gameState.isGameOver ? '游戏结束!' : '已暂停',
            canvas.width / 2,
            canvas.height / 2 - 40
        )
        
        if (gameState.isGameOver) {
            ctx.font = '24px Arial'
            ctx.fillText(
                `最终得分: ${gameState.score}`,
                canvas.width / 2,
                canvas.height / 2 + 10
            )
            if (gameState.score > gameState.highScore) {
                ctx.fillStyle = '#FFC107'
                ctx.fillText(
                    '新纪录！',
                    canvas.width / 2,
                    canvas.height / 2 + 50
                )
            }
        }
        
        ctx.font = '20px Arial'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(
            gameState.isGameOver ? '点击屏幕重新开始' : '点击继续游戏',
            canvas.width / 2,
            canvas.height / 2 + 90
        )
    }
}

// 绘制控制按钮
function drawControlButtons() {
    for (const [direction, button] of Object.entries(controlButtons)) {
        // 绘制按钮背景
        const gradient = ctx.createRadialGradient(
            button.x + button.width/2, 
            button.y + button.height/2, 
            0,
            button.x + button.width/2, 
            button.y + button.height/2, 
            button.width/2
        )
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)')
        
        ctx.fillStyle = gradient
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        
        // 圆形按钮
        ctx.beginPath()
        ctx.arc(
            button.x + button.width/2,
            button.y + button.height/2,
            button.width/2,
            0,
            Math.PI * 2
        )
        ctx.fill()
        ctx.stroke()

        // 绘制按钮图标
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 28px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        if (direction === 'pause') {
            ctx.fillText(
                gameState.isPaused ? '▶' : '⏸',
                button.x + button.width/2,
                button.y + button.height/2
            )
        } else {
            ctx.fillText(
                button.icon,
                button.x + button.width/2,
                button.y + button.height/2
            )
        }
    }
}

// 处理触摸事件
wx.onTouchStart((event) => {
    const touch = event.touches[0]
    const x = touch.clientX
    const y = touch.clientY

    if (gameState.isGameOver) {
        initGame()
        return
    }

    // 检查是否点击了控制按钮
    for (const [direction, button] of Object.entries(controlButtons)) {
        const dx = x - (button.x + button.width/2)
        const dy = y - (button.y + button.height/2)
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance <= button.width/2) {
            if (direction === 'pause') {
                gameState.isPaused = !gameState.isPaused
                if (gameState.isPaused) {
                    audioManager.pauseBGM()
                } else {
                    audioManager.playBGM()
                }
                return
            }

            // 防止蛇反向移动
            if ((direction === 'left' && gameState.direction !== 'right') ||
                (direction === 'right' && gameState.direction !== 'left') ||
                (direction === 'up' && gameState.direction !== 'down') ||
                (direction === 'down' && gameState.direction !== 'up')) {
                gameState.direction = direction
            }
            return
        }
    }
})

// 游戏主循环
function gameLoop() {
    if (!gameState.isGameOver && !gameState.isPaused) {
        // 更新蛇的位置
        const head = {...gameState.snake[0]}
        
        switch(gameState.direction) {
            case 'up': head.y--; break
            case 'down': head.y++; break
            case 'left': head.x--; break
            case 'right': head.x++; break
        }
        
        // 检查是否吃到食物
        if (gameState.food && head.x === gameState.food.x && head.y === gameState.food.y) {
            // 更新分数和连击
            gameState.combo++;
            
            const points = gameState.food.type.points * gameState.combo
            gameState.score += points
            
            // 更新最高分
            gameState.highScore = Math.max(gameState.score, gameState.highScore)
            
            // 更新等级
            gameState.gameLevel = Math.floor(gameState.score / 50) + 1
            
            // 播放音效
            audioManager.playEatSound()
            
            // 添加特效
            const foodX = gameState.food.x * config.gridSize + config.gridSize/2
            const foodY = gameState.food.y * config.gridSize + config.scoreAreaHeight + config.gridSize/2
            addParticles(foodX, foodY, gameState.food.type.color)
            
            // 生成新食物
            gameState.food = generateFood()
        } else {
            gameState.snake.pop()
        }
        
        // 检查游戏结束条件
        const maxY = Math.floor((canvas.height - config.controlAreaHeight - config.scoreAreaHeight) / config.gridSize)
        if (head.x < 0 || head.x >= canvas.width / config.gridSize ||
            head.y < 0 || head.y >= maxY ||
            gameState.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            gameState.isGameOver = true
            audioManager.playGameOverSound()
            return
        }
        
        gameState.snake.unshift(head)
    }
    
    // 更新粒子
    updateParticles()
    
    // 渲染游戏画面
    render()
}

// 初始化游戏
function initGame() {
    const centerX = Math.floor(canvas.width / (2 * config.gridSize))
    const centerY = Math.floor((canvas.height - config.controlAreaHeight - config.scoreAreaHeight) / (2 * config.gridSize))
    
    gameState.snake = []
    for (let i = 0; i < config.initialSnakeLength; i++) {
        gameState.snake.push({x: centerX - i, y: centerY})
    }
    
    gameState.food = generateFood()
    gameState.direction = 'right'
    gameState.score = 0
    gameState.isGameOver = false
    gameState.isPaused = false
    gameState.combo = 0
    gameState.lastFoodType = null
    gameState.particles = []
    gameState.gameLevel = 1
    
    // 开始播放背景音乐
    audioManager.playBGM()
}

// 启动游戏
initGame()

// 使用可变速度的游戏循环
let lastTime = 0
function animate(currentTime) {
    if (lastTime === 0) {
        lastTime = currentTime
    }
    
    const deltaTime = currentTime - lastTime
    const speed = getCurrentSpeed()
    
    if (deltaTime > speed) {
        gameLoop()
        lastTime = currentTime
    }
    
    requestAnimationFrame(animate)
}

requestAnimationFrame(animate)
