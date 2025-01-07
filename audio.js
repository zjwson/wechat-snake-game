// 音频管理器
const audioManager = {
    bgm: null,
    eatSound: null,
    gameOverSound: null,
    
    init() {
        // 背景音乐
        this.bgm = wx.createInnerAudioContext()
        this.bgm.src = 'audio/bgm.mp3'
        this.bgm.loop = true
        
        // 吃食物音效
        this.eatSound = wx.createInnerAudioContext()
        this.eatSound.src = 'audio/eat.mp3'
        
        // 游戏结束音效
        this.gameOverSound = wx.createInnerAudioContext()
        this.gameOverSound.src = 'audio/gameover.mp3'
    },
    
    playBGM() {
        this.bgm && this.bgm.play()
    },
    
    pauseBGM() {
        this.bgm && this.bgm.pause()
    },
    
    playEatSound() {
        if (this.eatSound) {
            this.eatSound.stop()
            this.eatSound.play()
        }
    },
    
    playGameOverSound() {
        this.gameOverSound && this.gameOverSound.play()
    }
}

export default audioManager
