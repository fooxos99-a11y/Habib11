"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Clock, Target, Zap } from "lucide-react"

interface PathToGoalChallengeProps {
  onSuccess: () => void
  onFailure: (message: string) => void
  timeLimit?: number
}

export function PathToGoalChallenge({ onSuccess, onFailure, timeLimit = 60 }: PathToGoalChallengeProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [timerActive, setTimerActive] = useState(true)
  const [isDrawing, setIsDrawing] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [path, setPath] = useState<{ x: number; y: number }[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Responsive canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 })
  const [startPos, setStartPos] = useState({ x: 50, y: 250 })
  const [goalPos, setGoalPos] = useState({ x: 750, y: 250 })

  // إعادة رسم العقبات عند تغيير الحجم
  const [obstacles, setObstacles] = useState<any[]>([])

  // تحديث حجم الكانفس حسب الشاشة
  useEffect(() => {
    function updateSize() {
      let w = window.innerWidth
      let h = window.innerHeight
      // اجعل الكانفس يأخذ 98% من العرض و 60-80% من الارتفاع حسب الاتجاه
      let isPortrait = h > w
      let width = isPortrait ? w * 0.98 : w * 0.8
      let height = isPortrait ? h * 0.55 : h * 0.8
      // الحد الأدنى والأقصى
      width = Math.max(320, Math.min(width, 900))
      height = Math.max(220, Math.min(height, 700))
      setCanvasSize({ width, height })
      setStartPos({ x: width * 0.06, y: height / 2 })
      setGoalPos({ x: width * 0.94, y: height / 2 })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    window.addEventListener('orientationchange', updateSize)
    return () => {
      window.removeEventListener('resize', updateSize)
      window.removeEventListener('orientationchange', updateSize)
    }
  }, [])

  // إعادة رسم العقبات عند تغيير الحجم
  useEffect(() => {
    const obs = []
    const canvasHeight = canvasSize.height
    const canvasWidth = canvasSize.width
    const gapSize = Math.max(40, canvasHeight * 0.09)
    // عدد الأعمدة حسب العرض
    const columns = []
    let colCount = Math.floor((canvasWidth - 100) / 100)
    for (let i = 1; i <= colCount; i++) {
      columns.push(80 + i * ((canvasWidth - 160) / (colCount + 1)))
    }
    columns.forEach((xPos) => {
      const minGap = 40
      const maxGap = canvasHeight - gapSize - 40
      const gapStart = minGap + Math.random() * (maxGap - minGap)
      const gapEnd = gapStart + gapSize
      if (gapStart > 20) {
        obs.push({ type: 'line', x1: xPos, y1: 15, x2: xPos, y2: gapStart, thickness: 6 })
      }
      if (gapEnd < canvasHeight - 20) {
        obs.push({ type: 'line', x1: xPos, y1: gapEnd, x2: xPos, y2: canvasHeight - 15, thickness: 6 })
      }
    })
    setObstacles(obs)
  }, [canvasSize])

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) {
      if (timeLeft <= 0) {
        setTimerActive(false)
        onFailure("انتهى الوقت قبل الوصول للهدف")
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false)
          onFailure("انتهى الوقت قبل الوصول للهدف")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timerActive, timeLeft])

  useEffect(() => {
    drawCanvas()
  }, [path, obstacles, canvasSize])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const gradient = ctx.createLinearGradient(0, 0, canvasSize.width, canvasSize.height)
    gradient.addColorStop(0, "#faf8f5")
    gradient.addColorStop(0.5, "#f5f0e8")
    gradient.addColorStop(1, "#faf8f5")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    obstacles.forEach((obs) => {
      if (obs.type === 'line') {
        // Draw vertical line obstacles
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        
        // Main line - darker red
        ctx.strokeStyle = "#8b2e24"
        ctx.lineWidth = obs.thickness
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(obs.x1, obs.y1)
        ctx.lineTo(obs.x2, obs.y2)
        ctx.stroke()

        // Inner line - lighter red for depth
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.strokeStyle = "#c0392b"
        ctx.lineWidth = obs.thickness - 1
        ctx.beginPath()
        ctx.moveTo(obs.x1, obs.y1)
        ctx.lineTo(obs.x2, obs.y2)
        ctx.stroke()
        
        // Center highlight for 3D effect
        ctx.strokeStyle = "#d35945"
        ctx.lineWidth = obs.thickness - 2
        ctx.beginPath()
        ctx.moveTo(obs.x1, obs.y1)
        ctx.lineTo(obs.x2, obs.y2)
        ctx.stroke()
      }
    })

    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Draw start flag
    ctx.shadowColor = "rgba(216, 163, 85, 0.5)"
    ctx.shadowBlur = 10

    // Flag pole
    ctx.fillStyle = "#8b6f47"
    ctx.fillRect(startPos.x - 3, startPos.y - canvasSize.height * 0.07, 6, canvasSize.height * 0.14)

    // Flag (smaller and closer to pole for better scaling)
    ctx.fillStyle = "#d8a355"
    ctx.beginPath()
    // Top of pole
    const flagTopX = startPos.x + 3
    const flagTopY = startPos.y - canvasSize.height * 0.07
    // Make the flag width and height relative but smaller
    const flagWidth = Math.max(18, canvasSize.width * 0.025)
    const flagHeight = Math.max(18, canvasSize.height * 0.045)
    ctx.moveTo(flagTopX, flagTopY)
    ctx.lineTo(flagTopX + flagWidth, flagTopY + flagHeight * 0.25)
    ctx.lineTo(flagTopX, flagTopY + flagHeight)
    ctx.closePath()
    ctx.fill()
    
    // Flag border
    ctx.shadowBlur = 0
    ctx.strokeStyle = "#c89547"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw goal door
    ctx.shadowColor = "rgba(39, 174, 96, 0.5)"
    ctx.shadowBlur = 15
    
    const doorWidth = canvasSize.width * 0.06
    const doorHeight = canvasSize.height * 0.14
    const doorX = goalPos.x - doorWidth / 2
    const doorY = goalPos.y - doorHeight / 2
    
    // Door frame
    ctx.fillStyle = "#1e7e34"
    ctx.fillRect(doorX - 5, doorY - 5, doorWidth + 10, doorHeight + 10)
    
    // Door
    ctx.shadowBlur = 0
    ctx.fillStyle = "#27ae60"
    ctx.fillRect(doorX, doorY, doorWidth, doorHeight)
    
    // Door panels
    ctx.strokeStyle = "#2ecc71"
    ctx.lineWidth = 3
    ctx.strokeRect(doorX + 5, doorY + 5, doorWidth - 10, doorHeight / 2 - 7)
    ctx.strokeRect(doorX + 5, doorY + doorHeight / 2 + 2, doorWidth - 10, doorHeight / 2 - 7)
    
    // Door knob
    ctx.fillStyle = "#f1c40f"
    ctx.beginPath()
    ctx.arc(doorX + doorWidth - 12, goalPos.y, 4, 0, Math.PI * 2)
    ctx.fill()

    if (path.length > 0) {
      ctx.shadowColor = "rgba(216, 163, 85, 0.3)"
      ctx.shadowBlur = 6

      ctx.strokeStyle = "#d8a355"
      ctx.lineWidth = 8
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      path.forEach((point) => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()

      // Inner glow
      ctx.shadowBlur = 0
      ctx.strokeStyle = "#e6b870"
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      path.forEach((point) => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    }

    ctx.shadowBlur = 0
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    // احسب نسبة scale بين حجم العنصر المعروض وحجم الكانفس الفعلي
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const checkCollision = (x: number, y: number) => {
    return obstacles.some((obs) => {
      if (obs.type === 'line') {
        // Calculate distance from point to vertical line
        const lineX = obs.x1
        
        // Check if point is within the horizontal range of the line
        if (Math.abs(x - lineX) <= obs.thickness / 2 + 4) {
          // Check if point is within the vertical range of the line
          if (y >= obs.y1 && y <= obs.y2) {
            return true
          }
        }
      }
      return false
    })
  }

  const checkGoalReached = (x: number, y: number) => {
    // Check if point is within the door area
    const doorWidth = 50
    const doorHeight = 70
    const doorX = goalPos.x - doorWidth / 2
    const doorY = goalPos.y - doorHeight / 2
    
    return x >= doorX && x <= doorX + doorWidth && y >= doorY && y <= doorY + doorHeight
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!timerActive || gameOver) return

    const pos = getMousePos(e)
    // Check if mouse is near the start flag pole
    const distanceToStart = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2))

    if (distanceToStart <= 35) {
      setIsDrawing(true)
      // Always start path at the center bottom of the flag pole
      const flagBase = {
        x: startPos.x,
        y: startPos.y
      }
      setPath([flagBase])
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !timerActive || gameOver) return

    const pos = getMousePos(e)

    if (checkCollision(pos.x, pos.y)) {
      setIsDrawing(false)
      setPath([])
      return
    }

    if (checkGoalReached(pos.x, pos.y)) {
      setIsDrawing(false)
      setTimerActive(false)
      onSuccess()
      return
    }

    setPath((prev) => [...prev, pos])
  }

  const handleMouseUp = () => {
    if (isDrawing && path.length > 0) {
      setPath([])
    }
    setIsDrawing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#faf8f5] via-[#f5ead8] to-[#faf8f5] !p-0">
      <div className="absolute top-6 right-6">
        <div className="flex items-center gap-3 bg-gradient-to-r from-[#d8a355] to-[#c89547] backdrop-blur px-6 py-3 rounded-2xl shadow-xl">
          <Clock className="w-6 h-6 text-white" />
          <span className={`text-3xl font-bold ${timeLeft <= 10 ? "text-red-100 animate-pulse" : "text-white"}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <Target className="w-10 h-10 text-[#d8a355]" />
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2332]">
            وصّل الهدف!
          </h2>
          <Zap className="w-10 h-10 text-[#d8a355]" />
        </div>
        <p className="text-lg sm:text-xl text-[#1a2332]/70">
          ارسم مسار من البداية للهدف دون لمس العقبات الحمراء أو التوقف
        </p>
      </div>

      <div className="relative shadow-2xl rounded-3xl w-full flex items-center justify-center" style={{height:canvasSize.height+32}}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="border-8 border-[#d8a355] rounded-3xl bg-white cursor-crosshair hover:border-[#c89547] transition-colors w-full h-full"
          style={{maxWidth:'100vw',maxHeight:'80vh',touchAction:'none'}}
        />
        {!isDrawing && path.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-r from-[#d8a355] to-[#c89547] text-white px-4 py-2 sm:px-8 sm:py-4 rounded-2xl flex items-center gap-3 shadow-2xl animate-bounce text-xs sm:text-lg">
              <Zap className="w-6 h-6" />
              <span className="font-bold">اضغط على البداية وابدأ الرسم بدون توقف!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
