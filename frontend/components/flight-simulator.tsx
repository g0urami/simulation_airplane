"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, RotateCcw, AlertTriangle, Lightbulb, BookOpen, Target, CheckCircle } from "lucide-react"

interface FlightParameters {
  airspeed: number // km/h
  angleOfAttack: number // degrees
  altitude: number // meters
  throttle: number // percentage
  weight: number // kg
  wingArea: number // m²
  liftCoefficient: number
  dragCoefficient: number
}

interface Forces {
  lift: number
  drag: number
  thrust: number
  weight: number
}

const tutorialSteps = [
  {
    id: 1,
    title: "Understanding Airspeed",
    description:
      "Airspeed is crucial for generating lift. Try increasing airspeed from 100 to 300 km/h and observe how lift increases.",
    target: "airspeed",
    minValue: 250,
    explanation:
      "Higher airspeed means more air flowing over the wings, creating greater lift according to the formula L = ½ρv²ACₗ",
  },
  {
    id: 2,
    title: "Angle of Attack Effects",
    description:
      "Adjust the angle of attack between 0° and 10°. Notice how lift increases, but be careful not to exceed 15°!",
    target: "angleOfAttack",
    minValue: 8,
    maxValue: 12,
    explanation:
      "Increasing angle of attack deflects more air downward, creating more lift until the critical angle where stall occurs.",
  },
  {
    id: 3,
    title: "Stall Recognition",
    description:
      "Carefully increase angle of attack beyond 15° to experience a stall. Watch how lift drops dramatically!",
    target: "angleOfAttack",
    minValue: 16,
    explanation:
      "At high angles of attack, airflow separates from the wing's upper surface, causing a sudden loss of lift.",
  },
  {
    id: 4,
    title: "Altitude Effects",
    description: "Change altitude from sea level to 10,000m. Notice how thinner air affects lift generation.",
    target: "altitude",
    minValue: 8000,
    explanation:
      "Air density decreases with altitude, requiring higher speeds or larger angles of attack to maintain the same lift.",
  },
  {
    id: 5,
    title: "Thrust vs Drag Balance - Flight Analysis",
    description:
      "Observe how thrust and drag forces interact. Try different throttle settings and watch the real-time balance analysis below.",
    target: "throttle",
    explanation:
      "For steady flight, thrust must equal drag. This is an ongoing analysis - experiment with different settings to understand force relationships.",
    isInformational: true,
  },
]

export function FlightSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedAircraft, setSelectedAircraft] = useState("boeing-737")
  const [parameters, setParameters] = useState<FlightParameters>({
    airspeed: 250,
    angleOfAttack: 5,
    altitude: 3000,
    throttle: 75,
    weight: 41400,
    wingArea: 125,
    liftCoefficient: 1.2,
    dragCoefficient: 0.025,
  })

  const [forces, setForces] = useState<Forces>({
    lift: 0,
    drag: 0,
    thrust: 0,
    weight: 0,
  })

  const [position, setPosition] = useState({ x: 400, y: 300, rotation: 0 })
  const [velocity, setVelocity] = useState({ x: 0, y: 0, angular: 0 })
  const [isStalling, setIsStalling] = useState(false)
  const [currentTutorial, setCurrentTutorial] = useState<number>(0)
  const [tutorialActive, setTutorialActive] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showHints, setShowHints] = useState(true)
  const [parameterFeedback, setParameterFeedback] = useState<string>("")
  const [currentTips, setCurrentTips] = useState<string[]>([])
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false)

  // Aircraft presets
  const aircraftPresets = {
    "boeing-737": { weight: 41400, wingArea: 125, name: "Boeing 737-800" },
    "boeing-747": { weight: 200000, wingArea: 541, name: "Boeing 747-8" },
    "airbus-a320": { weight: 42000, wingArea: 122, name: "Airbus A320" },
    "cessna-172": { weight: 1157, wingArea: 16.2, name: "Cessna 172" },
  }

  // Physics calculations
  useEffect(() => {
    const airDensity = 1.225 * Math.exp(-parameters.altitude / 8400) // Air density at altitude
    const velocityMs = parameters.airspeed / 3.6 // Convert km/h to m/s

    // Check for stall condition
    const criticalAngle = 15
    const stalling = parameters.angleOfAttack > criticalAngle
    setIsStalling(stalling)

    // Calculate forces
    const dynamicPressure = 0.5 * airDensity * velocityMs * velocityMs

    let lift = dynamicPressure * parameters.wingArea * parameters.liftCoefficient
    if (stalling) {
      lift *= 0.3 // Dramatic lift reduction in stall
    }

    const drag = dynamicPressure * parameters.wingArea * parameters.dragCoefficient
    const thrust = (parameters.throttle / 100) * 120000 // Max thrust in Newtons
    const weight = parameters.weight * 9.81 // Convert to Newtons

    setForces({ lift, drag, thrust, weight })
  }, [parameters])

  // Animation loop
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setPosition((prev) => {
        const dt = 0.1 // Time step
        const mass = parameters.weight

        // Net forces
        const netVertical = forces.lift - forces.weight
        const netHorizontal = forces.thrust - forces.drag

        // Accelerations
        const accelX = netHorizontal / mass
        const accelY = -netVertical / mass // Negative because up is negative Y

        // Update velocity
        const newVelX = velocity.x + accelX * dt
        const newVelY = velocity.y + accelY * dt

        // Update position
        const newX = Math.max(50, Math.min(750, prev.x + newVelX * dt * 100))
        const newY = Math.max(50, Math.min(550, prev.y + newVelY * dt * 100))

        // Update rotation based on angle of attack and flight path
        const newRotation = parameters.angleOfAttack * (Math.PI / 180)

        setVelocity({ x: newVelX, y: newVelY, angular: 0 })

        return { x: newX, y: newY, rotation: newRotation }
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isRunning, forces, velocity, parameters.angleOfAttack, parameters.weight])

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(1, "#E0F6FF")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw ground
    ctx.fillStyle = "#8B7355"
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50)

    // Draw aircraft
    ctx.save()
    ctx.translate(position.x, position.y)
    ctx.rotate(position.rotation)

    // Aircraft body
    ctx.fillStyle = isStalling ? "#EF4444" : "#3B82F6"
    ctx.fillRect(-30, -5, 60, 10)

    // Wings
    ctx.fillStyle = isStalling ? "#DC2626" : "#1E40AF"
    ctx.fillRect(-15, -20, 30, 40)

    // Nose
    ctx.beginPath()
    ctx.moveTo(30, 0)
    ctx.lineTo(40, -3)
    ctx.lineTo(40, 3)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    // Draw force vectors
    const scale = 0.0001

    // Lift (green, upward)
    if (forces.lift > 0) {
      ctx.strokeStyle = "#10B981"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(position.x, position.y)
      ctx.lineTo(position.x, position.y - forces.lift * scale)
      ctx.stroke()

      ctx.fillStyle = "#10B981"
      ctx.font = "12px sans-serif"
      ctx.fillText(`Lift: ${Math.round(forces.lift)}N`, position.x + 10, position.y - forces.lift * scale)
    }

    // Drag (red, backward)
    if (forces.drag > 0) {
      ctx.strokeStyle = "#EF4444"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(position.x, position.y)
      ctx.lineTo(position.x - forces.drag * scale * 2, position.y)
      ctx.stroke()

      ctx.fillStyle = "#EF4444"
      ctx.font = "12px sans-serif"
      ctx.fillText(`Drag: ${Math.round(forces.drag)}N`, position.x - forces.drag * scale * 2 - 60, position.y - 10)
    }

    // Thrust (blue, forward)
    if (forces.thrust > 0) {
      ctx.strokeStyle = "#3B82F6"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(position.x, position.y)
      ctx.lineTo(position.x + forces.thrust * scale * 2, position.y)
      ctx.stroke()

      ctx.fillStyle = "#3B82F6"
      ctx.font = "12px sans-serif"
      ctx.fillText(
        `Thrust: ${Math.round(forces.thrust)}N`,
        position.x + forces.thrust * scale * 2 + 10,
        position.y - 10,
      )
    }

    // Weight (orange, downward)
    if (forces.weight > 0) {
      ctx.strokeStyle = "#F59E0B"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(position.x, position.y)
      ctx.lineTo(position.x, position.y + forces.weight * scale)
      ctx.stroke()

      ctx.fillStyle = "#F59E0B"
      ctx.font = "12px sans-serif"
      ctx.fillText(`Weight: ${Math.round(forces.weight)}N`, position.x + 10, position.y + forces.weight * scale)
    }
  }, [position, forces, isStalling])

  // Parameter change feedback system
  useEffect(() => {
    let feedback = ""
    const tips = []

    if (parameters.airspeed < 150) {
      feedback = "⚠️ Low airspeed - insufficient lift for most aircraft."
      tips.push("Increase speed or angle of attack to generate more lift")
      tips.push("Formula: Lift = ½ × air density × velocity² × wing area × lift coefficient")
    } else if (parameters.airspeed > 400) {
      feedback = "⚡ High speed flight - drag increases significantly."
      tips.push("Drag increases with velocity squared - doubling speed quadruples drag")
      tips.push("Consider reducing throttle to maintain efficient flight")
    }

    if (parameters.angleOfAttack > 12 && parameters.angleOfAttack <= 15) {
      feedback = "⚠️ Approaching critical angle of attack. Stall warning!"
      tips.push("Most aircraft stall between 15-18° angle of attack")
      tips.push("Reduce angle of attack or increase airspeed to maintain safe flight")
    } else if (parameters.angleOfAttack > 15) {
      feedback = "🚨 STALL CONDITION - Airflow separated from wing surface!"
      tips.push("Immediately reduce angle of attack and increase throttle")
      tips.push("In real flight, push the nose down to recover from stall")
    } else if (parameters.angleOfAttack < 0) {
      feedback = "📉 Negative angle of attack - aircraft will descend rapidly."
      tips.push("Negative angles create downward lift - useful for aerobatic maneuvers")
    }

    if (parameters.altitude > 8000) {
      feedback = "🏔️ High altitude - reduced air density affects performance."
      tips.push("Air density at 10,000m is about 26% of sea level density")
      tips.push("Higher speeds or larger angles needed to maintain same lift")
    }

    const thrustDragDiff = Math.abs(forces.thrust - forces.drag)
    const liftWeightDiff = Math.abs(forces.lift - forces.weight)

    if (thrustDragDiff < 5000 && liftWeightDiff < 10000) {
      feedback = "✅ Excellent! Forces are well balanced for steady flight."
      tips.push("This is ideal for cruise flight - minimal energy waste")
      tips.push("Small adjustments maintain altitude and speed efficiently")
    }

    setParameterFeedback(feedback)
    setCurrentTips(tips)
  }, [parameters, forces])

  useEffect(() => {
    if (!tutorialActive || currentTutorial >= tutorialSteps.length) return

    const step = tutorialSteps[currentTutorial]

    if (step.isInformational) return

    const currentValue = parameters[step.target as keyof FlightParameters]

    let completed = false
    if (step.minValue && step.maxValue) {
      completed = currentValue >= step.minValue && currentValue <= step.maxValue
    } else if (step.minValue) {
      completed = currentValue >= step.minValue
    }

    if (completed && !completedSteps.includes(step.id)) {
      setCompletedSteps((prev) => [...prev, step.id])
      setTimeout(() => {
        if (currentTutorial < tutorialSteps.length - 1) {
          setCurrentTutorial((prev) => prev + 1)
        }
      }, 2000)
    }
  }, [parameters, currentTutorial, tutorialActive, completedSteps])

  const resetSimulation = () => {
    setIsRunning(false)
    setPosition({ x: 400, y: 300, rotation: 0 })
    setVelocity({ x: 0, y: 0, angular: 0 })
  }

  const updateParameter = (key: keyof FlightParameters, value: number) => {
    setParameters((prev) => ({ ...prev, [key]: value }))
  }

  const selectAircraft = (aircraftId: string) => {
    setSelectedAircraft(aircraftId)
    const preset = aircraftPresets[aircraftId as keyof typeof aircraftPresets]
    if (preset) {
      updateParameter("weight", preset.weight)
      updateParameter("wingArea", preset.wingArea)
    }
  }

  const startTutorial = () => {
    setTutorialActive(true)
    setCurrentTutorial(0)
    setCompletedSteps([])
    resetSimulation()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Simulation Canvas */}
      <div className="lg:col-span-2 space-y-4">
        {/* Tutorial progress and guidance */}
        {tutorialActive && (
          <Card className="border-primary bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-sans">
                    Step {currentTutorial + 1}: {tutorialSteps[currentTutorial]?.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {tutorialSteps[currentTutorial]?.isInformational ? (
                    <Badge variant="outline" className="font-serif">
                      Analysis Mode
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="font-serif">
                      {completedSteps.length}/{tutorialSteps.length - 1} Complete
                    </Badge>
                  )}
                </div>
              </div>
              {!tutorialSteps[currentTutorial]?.isInformational && (
                <Progress value={(completedSteps.length / (tutorialSteps.length - 1)) * 100} className="h-2" />
              )}
            </CardHeader>
            <CardContent>
              <p className="font-serif text-muted-foreground mb-3">{tutorialSteps[currentTutorial]?.description}</p>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-serif text-muted-foreground">
                    {tutorialSteps[currentTutorial]?.explanation}
                  </p>
                </div>
              </div>

              {tutorialSteps[currentTutorial]?.isInformational && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-sans font-semibold text-blue-900 mb-2">Real-time Force Analysis:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-serif text-blue-700">Thrust vs Drag:</span>
                      <div
                        className={`font-sans font-bold ${Math.abs(forces.thrust - forces.drag) < 5000 ? "text-green-600" : "text-orange-600"}`}
                      >
                        {forces.thrust > forces.drag ? "+" : ""}
                        {Math.round(forces.thrust - forces.drag)}N
                      </div>
                    </div>
                    <div>
                      <span className="font-serif text-blue-700">Lift vs Weight:</span>
                      <div
                        className={`font-sans font-bold ${Math.abs(forces.lift - forces.weight) < 10000 ? "text-green-600" : "text-orange-600"}`}
                      >
                        {forces.lift > forces.weight ? "+" : ""}
                        {Math.round(forces.lift - forces.weight)}N
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-serif text-blue-600">
                    {Math.abs(forces.thrust - forces.drag) < 5000 && Math.abs(forces.lift - forces.weight) < 10000
                      ? "✅ Perfect balance achieved! This is steady, efficient flight."
                      : "⚖️ Adjust throttle and other parameters to achieve force balance."}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTutorial(Math.max(0, currentTutorial - 1))}
                  disabled={currentTutorial === 0}
                  className="font-serif"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentTutorial < tutorialSteps.length - 1) {
                      setCurrentTutorial(currentTutorial + 1)
                    } else {
                      setTutorialActive(false)
                    }
                  }}
                  className="font-serif"
                >
                  {currentTutorial === tutorialSteps.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced parameter feedback with tips */}
        {parameterFeedback && showHints && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-serif">{parameterFeedback}</AlertDescription>
              </Alert>
              {currentTips.length > 0 && (
                <div className="mt-3 space-y-1">
                  {currentTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1 h-1 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="font-serif text-yellow-800">{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-sans">Flight Simulation</CardTitle>
                <CardDescription className="font-serif">
                  Real-time physics visualization with educational guidance
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isStalling && (
                  <Badge variant="destructive" className="font-serif">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    STALL
                  </Badge>
                )}
                <Button
                  variant={isRunning ? "secondary" : "default"}
                  size="sm"
                  onClick={() => setIsRunning(!isRunning)}
                  className="font-serif"
                >
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={resetSimulation} className="font-serif bg-transparent">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full border border-border rounded-lg bg-gradient-to-b from-blue-100 to-blue-50"
            />
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="space-y-6">
        {/* Learning controls */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Learning Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={startTutorial}
              className="w-full font-serif"
              variant={tutorialActive ? "secondary" : "default"}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {tutorialActive ? "Tutorial Active" : "Start Guided Tutorial"}
            </Button>
            <div className="flex items-center justify-between">
              <span className="text-sm font-serif">Show Hints</span>
              <Button variant="outline" size="sm" onClick={() => setShowHints(!showHints)} className="font-serif">
                {showHints ? "Hide" : "Show"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-serif">Advanced Metrics</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                className="font-serif"
              >
                {showAdvancedMetrics ? "Hide" : "Show"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Aircraft Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Aircraft Selection</CardTitle>
            <CardDescription className="font-serif">
              Different aircraft have unique flight characteristics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedAircraft} onValueChange={selectAircraft}>
              <SelectTrigger className="font-serif">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(aircraftPresets).map(([id, preset]) => (
                  <SelectItem key={id} value={id} className="font-serif">
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Flight Parameters with enhanced descriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Flight Parameters</CardTitle>
            <CardDescription className="font-serif">
              Adjust these values to see how they affect flight physics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium font-serif">Airspeed: {parameters.airspeed} km/h</label>
                {tutorialActive && tutorialSteps[currentTutorial]?.target === "airspeed" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Slider
                value={[parameters.airspeed]}
                onValueChange={([value]) => updateParameter("airspeed", value)}
                min={50}
                max={500}
                step={10}
              />
              <p className="text-xs font-serif text-muted-foreground mt-1">
                Higher speed = more lift, but also more drag (v² relationship)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium font-serif">
                  Angle of Attack: {parameters.angleOfAttack}°
                  {parameters.angleOfAttack > 15 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      STALL
                    </Badge>
                  )}
                </label>
                {tutorialActive && tutorialSteps[currentTutorial]?.target === "angleOfAttack" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Slider
                value={[parameters.angleOfAttack]}
                onValueChange={([value]) => updateParameter("angleOfAttack", value)}
                min={-10}
                max={25}
                step={0.5}
              />
              <p className="text-xs font-serif text-muted-foreground mt-1">
                Optimal range: 2-12°. Beyond 15° causes stall in most aircraft
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium font-serif">Altitude: {parameters.altitude} m</label>
                {tutorialActive && tutorialSteps[currentTutorial]?.target === "altitude" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Slider
                value={[parameters.altitude]}
                onValueChange={([value]) => updateParameter("altitude", value)}
                min={0}
                max={12000}
                step={100}
              />
              <p className="text-xs font-serif text-muted-foreground mt-1">
                Higher altitude = thinner air = less lift at same speed
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium font-serif">Throttle: {parameters.throttle}%</label>
                {tutorialActive && tutorialSteps[currentTutorial]?.target === "throttle" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Slider
                value={[parameters.throttle]}
                onValueChange={([value]) => updateParameter("throttle", value)}
                min={0}
                max={100}
                step={5}
              />
              <p className="text-xs font-serif text-muted-foreground mt-1">
                Controls thrust. Must balance with drag for steady flight
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Force Display */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Force Analysis</CardTitle>
            <CardDescription className="font-serif">Understanding the four forces of flight</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-serif text-green-700">Lift ↑</div>
                <div className="text-lg font-bold font-sans text-green-800">
                  {Math.round(forces.lift).toLocaleString()}N
                </div>
                <div className="text-xs font-serif text-green-600 mt-1">
                  {forces.lift > forces.weight ? "Climbing" : forces.lift < forces.weight ? "Descending" : "Level"}
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm font-serif text-red-700">Drag ←</div>
                <div className="text-lg font-bold font-sans text-red-800">
                  {Math.round(forces.drag).toLocaleString()}N
                </div>
                <div className="text-xs font-serif text-red-600 mt-1">Opposes motion</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-serif text-blue-700">Thrust →</div>
                <div className="text-lg font-bold font-sans text-blue-800">
                  {Math.round(forces.thrust).toLocaleString()}N
                </div>
                <div className="text-xs font-serif text-blue-600 mt-1">
                  {forces.thrust > forces.drag
                    ? "Accelerating"
                    : forces.thrust < forces.drag
                      ? "Decelerating"
                      : "Steady"}
                </div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-sm font-serif text-orange-700">Weight ↓</div>
                <div className="text-lg font-bold font-sans text-orange-800">
                  {Math.round(forces.weight).toLocaleString()}N
                </div>
                <div className="text-xs font-serif text-orange-600 mt-1">Always downward</div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-sm font-serif text-muted-foreground mb-2">Net Forces & Flight State:</div>
              <div className="space-y-1">
                <div className="text-sm font-serif flex justify-between">
                  <span>Vertical:</span>
                  <span
                    className={
                      forces.lift > forces.weight
                        ? "text-green-600"
                        : forces.lift < forces.weight
                          ? "text-red-600"
                          : "text-gray-600"
                    }
                  >
                    {Math.round(forces.lift - forces.weight).toLocaleString()}N
                  </span>
                </div>
                <div className="text-sm font-serif flex justify-between">
                  <span>Horizontal:</span>
                  <span
                    className={
                      forces.thrust > forces.drag
                        ? "text-blue-600"
                        : forces.thrust < forces.drag
                          ? "text-red-600"
                          : "text-gray-600"
                    }
                  >
                    {Math.round(forces.thrust - forces.drag).toLocaleString()}N
                  </span>
                </div>
              </div>
            </div>

            {showAdvancedMetrics && (
              <div className="pt-4 border-t border-border">
                <div className="text-sm font-serif font-semibold mb-3">Advanced Flight Metrics:</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-serif">
                    <span>Lift-to-Drag Ratio:</span>
                    <span className="font-sans font-bold">
                      {forces.drag > 0 ? (forces.lift / forces.drag).toFixed(2) : "∞"}
                    </span>
                  </div>
                  <div className="flex justify-between font-serif">
                    <span>Power Loading:</span>
                    <span className="font-sans font-bold">
                      {(parameters.weight / ((forces.thrust * parameters.airspeed) / 3.6)).toFixed(3)} kg/W
                    </span>
                  </div>
                  <div className="flex justify-between font-serif">
                    <span>Wing Loading:</span>
                    <span className="font-sans font-bold">
                      {(parameters.weight / parameters.wingArea).toFixed(1)} kg/m²
                    </span>
                  </div>
                  <div className="flex justify-between font-serif">
                    <span>Air Density:</span>
                    <span className="font-sans font-bold">
                      {(1.225 * Math.exp(-parameters.altitude / 8400)).toFixed(3)} kg/m³
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
