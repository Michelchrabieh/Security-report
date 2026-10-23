import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

const stories = [
  {
    value: 62,
    body: 'An agent accessed data or systems outside its intended scope. 31% of organizations experienced this multiple times.',
  },
  {
    value: 23,
    body: "An agent was connected to MCP servers or tools without security's knowledge.",
  },
  {
    value: 57,
    body: 'An agent was manipulated via prompt injection into taking an unintended action.',
  },
]

const detailStories = [
  {
    value: 55,
    body: 'An agent took a consequential action without approval.',
  },
]

const storySegments = 5 + detailStories.length
const storyOutroStart = 0.99

function getStoryPhase(progress: number) {
  if (progress < storyOutroStart) {
    return (progress / storyOutroStart) * 5
  }

  return (
    5 +
    ((progress - storyOutroStart) / (1 - storyOutroStart)) *
      (storySegments - 5)
  )
}

const giantFillTiles = Array.from({ length: 60 }, (_, index) => {
  const row = Math.floor(index / 10)
  const column = index % 10
  const columnOrder = [4, 8, 1, 6, 3, 9, 0, 7, 2, 5]

  return {
    index,
    revealOrder: (5 - row) * 10 + columnOrder[column],
  }
})
const controlsRows = [
  {
    value: 62,
    theme: 'blue',
    body: 'An agent accessed data or systems outside its intended scope',
  },
  {
    value: 97,
    theme: 'lavender',
    body: 'An agent accessed data or systems outside its intended scope',
  },
  {
    value: 62,
    theme: 'coral',
    body: 'An agent accessed data or systems outside its intended scope',
  },
]
const riskItems = [
  {
    value: 48,
    body: 'Code that developers could not adequately explain or maintain',
  },
  {
    value: 45,
    body: 'Security vulnerabilities',
  },
  {
    value: 42,
    body: 'Proprietary code, credentials or sensitive data being shared with AI tools',
  },
  {
    value: 39,
    body: 'Licensing, copyright or provenance concerns',
  },
  {
    value: 37,
    body: 'Fabricated or non-existent packages, libraries or APIs',
  },
]

function HeroMosaic() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const hero = canvas?.closest('.hero')
    if (!canvas || !hero || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const gl = canvas.getContext('webgl', { alpha: true })
    if (!gl) return

    const vertexSource = `
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `
    const fragmentSource = `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D image;
      uniform vec2 resolution;
      uniform vec2 pointer;
      uniform float strength;
      uniform float time;

      void main() {
        vec2 pixel = vec2(uv.x * resolution.x, (1.0 - uv.y) * resolution.y);
        float cellSize = 8.0;
        vec2 cellCenter = (floor(pixel / cellSize) + 0.5) * cellSize;
        vec2 delta = cellCenter - pointer;
        float distanceToPointer = length(delta);
        float radius = 155.0;
        float influence = max(0.0, 1.0 - distanceToPointer / radius);
        vec2 direction = distanceToPointer > 0.1 ? delta / distanceToPointer : vec2(0.0);
        vec2 samplePixel = pixel - direction * strength * influence * influence;
        samplePixel = clamp(samplePixel, vec2(0.0), resolution - vec2(1.0));
        vec2 sampleUv = vec2(fract(samplePixel.x / 972.0), 1.0 - samplePixel.y / 550.0);
        vec4 color = texture2D(image, sampleUv);

        vec2 cellId = floor(cellCenter / cellSize);
        float random = fract(sin(dot(cellId, vec2(12.9898, 78.233))) * 43758.5453);
        float horizontalPosition = cellCenter.x / resolution.x;
        float revealDelay = horizontalPosition * 0.9 + random * 0.32;
        float reveal = smoothstep(revealDelay, revealDelay + 0.34, time * 0.62);

        float sweepCenter = time * 0.48 - 0.12;
        float sweepDistance = horizontalPosition - sweepCenter;
        float openingShimmer = exp(-(sweepDistance * sweepDistance) / 0.006);
        openingShimmer *= 1.0 - smoothstep(1.9, 3.2, time);

        float quietPulse = (sin(time * 1.05 + random * 6.28318) * 0.5 + 0.5) * 0.026;
        float light = quietPulse + openingShimmer * 0.2;
        color.rgb = mix(color.rgb, vec3(1.0), light);
        gl_FragColor = mix(vec4(1.0), color, reveal);
      }
    `
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
    }
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource)
    const program = gl.createProgram()
    if (!vertexShader || !fragmentShader || !program) return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

    const buffer = gl.createBuffer()
    const texture = gl.createTexture()
    const positionLocation = gl.getAttribLocation(program, 'position')
    const resolutionLocation = gl.getUniformLocation(program, 'resolution')
    const pointerLocation = gl.getUniformLocation(program, 'pointer')
    const strengthLocation = gl.getUniformLocation(program, 'strength')
    const timeLocation = gl.getUniformLocation(program, 'time')
    if (!buffer || !texture) return

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    let frame = 0
    let running = false
    let strength = 0
    let targetStrength = 0
    const startTime = performance.now()
    const pointer = { x: 972, y: 275 }
    const targetPointer = { ...pointer }
    const image = new Image()

    const draw = (timestamp = performance.now()) => {
      strength += (targetStrength - strength) * 0.14
      pointer.x += (targetPointer.x - pointer.x) * 0.2
      pointer.y += (targetPointer.y - pointer.y) * 0.2

      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform2f(pointerLocation, pointer.x, pointer.y)
      gl.uniform1f(strengthLocation, strength * 22)
      gl.uniform1f(timeLocation, (timestamp - startTime) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      frame = requestAnimationFrame(draw)
    }
    const start = () => {
      if (running || !image.complete) return
      running = true
      frame = requestAnimationFrame(draw)
    }
    const onPointerMove = (event: Event) => {
      const pointerEvent = event as PointerEvent
      const rect = canvas.getBoundingClientRect()
      targetPointer.x = ((pointerEvent.clientX - rect.left) / rect.width) * canvas.width
      targetPointer.y = ((pointerEvent.clientY - rect.top) / rect.height) * canvas.height
      targetStrength = 1
      start()
    }
    const onPointerLeave = () => {
      targetStrength = 0
      start()
    }

    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      )
      start()
    }
    image.src = '/assets/4f41e.png'
    hero.addEventListener('pointermove', onPointerMove)
    hero.addEventListener('pointerleave', onPointerLeave)

    return () => {
      cancelAnimationFrame(frame)
      hero.removeEventListener('pointermove', onPointerMove)
      hero.removeEventListener('pointerleave', onPointerLeave)
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [])

  return (
    <div className="hero-mosaic" aria-hidden="true">
      <img src="/assets/4f41e.png" alt="" />
      <img src="/assets/4f41e.png" alt="" />
      <canvas className="hero-displacement" ref={canvasRef} width={1944} height={550} />
    </div>
  )
}

function useStoryProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const distance = rect.height - window.innerHeight
      setProgress(Math.min(1, Math.max(0, -rect.top / Math.max(distance, 1))))
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [ref])

  return progress
}

function useViewportEntryProgress(
  ref: React.RefObject<HTMLDivElement | null>,
  viewportDistance = 0.32,
) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const entryDistance = window.innerHeight * viewportDistance
      setProgress(
        Math.min(
          1,
          Math.max(0, (window.innerHeight - rect.top) / entryDistance),
        ),
      )
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [ref, viewportDistance])

  return progress
}

function ShieldField({ progress }: { progress: number }) {
  const shields = useMemo(() => Array.from({ length: 2376 }), [])
  const organicRanks = useMemo(
    () =>
      stories.map((_, storyIndex) => {
        const ranked = Array.from({ length: 2376 }, (_, index) => {
          const column = index % 66
          const row = Math.floor(index / 66)
          const noise =
            Math.sin((index + 1) * (12.9898 + storyIndex * 2.17)) * 43758.5453
          const random = noise - Math.floor(noise)
          const score =
            row * 2.15 +
            Math.sin(column * 0.72 + storyIndex * 1.9) * 3.5 +
            random * 15
          return { index, score }
        }).sort((a, b) => b.score - a.score)

        const ranks = new Array<number>(2376)
        ranked.forEach((item, rank) => {
          ranks[item.index] = rank
        })
        return ranks
      }),
    [],
  )
  const phase = getStoryPhase(progress)
  const stage = Math.min(stories.length - 1, Math.floor(phase))
  const local = progress === 1 ? 1 : phase - stage
  const transition = Math.min(1, local / 0.3)
  const previousValue = stage === 0 ? 0 : stories[stage - 1].value
  const nextValue = stories[stage].value
  const previousCount = Math.round((previousValue / 100) * shields.length)
  const nextCount = Math.round((nextValue / 100) * shields.length)
  const morphProgress =
    phase < 3 ? 0 : phase < 4 ? Math.min(1, phase - 3) : 1
  const zoomProgress = Math.min(1, morphProgress / 0.45)
  const zoomEase = zoomProgress * zoomProgress * (3 - 2 * zoomProgress)
  const holeProgress = Math.min(
    1,
    Math.max(0, (morphProgress - 0.38) / 0.4),
  )
  const holeEase = holeProgress * holeProgress * (3 - 2 * holeProgress)
  return (
    <div
      className="shield-field"
      aria-hidden="true"
      style={{
        '--grid-zoom': 1 + zoomEase * 0.35,
        '--grid-shift': '0vw',
      } as CSSProperties}
    >
      {shields.map((_, index) => {
        const column = index % 66
        const row = Math.floor(index / 66)
        const previousRank = organicRanks[Math.max(0, stage - 1)][index]
        const nextRank = organicRanks[stage][index]
        const previousActive = stage > 0 && previousRank < previousCount ? 1 : 0
        const nextActive = nextRank < nextCount ? 1 : 0
        const nextOffset = nextCount > 0 ? (nextRank / nextCount) * 0.78 : 1
        const previousOffset =
          previousCount > 0 ? (previousRank / previousCount) * 0.78 : 1
        const nextRevealProgress = Math.min(
          1,
          Math.max(0, (transition - nextOffset) / 0.22),
        )
        const previousHideProgress = Math.min(
          1,
          Math.max(0, (transition - previousOffset) / 0.22),
        )
        const nextReveal =
          nextRevealProgress *
          nextRevealProgress *
          (3 - 2 * nextRevealProgress)
        const previousHide =
          previousHideProgress *
          previousHideProgress *
          (3 - 2 * previousHideProgress)
        const organicYellow =
          previousActive && nextActive
            ? 1
            : nextActive
              ? nextReveal
              : previousActive
                ? 1 - previousHide
                : 0
        const yellowOpacity = phase < 3 ? organicYellow : 0
        const isInsideShieldSpace =
          Math.abs(column - 41) <= 5 && Math.abs(row - 17.5) <= 5.5
        const spaceOpacity = isInsideShieldSpace ? 1 - holeEase : 1
        return (
          <span className="shield" key={index} style={{ opacity: spaceOpacity }}>
            <span className="shield-highlight" style={{ opacity: yellowOpacity }} />
          </span>
        )
      })}
    </div>
  )
}

function ConfidenceSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [barDrops, setBarDrops] = useState([0, 0, 0])
  const [coralDrop, setCoralDrop] = useState(0)
  const progress = useStoryProgress(sectionRef)
  const titleEnterProgress = useViewportEntryProgress(sectionRef)
  const titleEnterEase =
    titleEnterProgress *
    titleEnterProgress *
    (3 - 2 * titleEnterProgress)
  const buildProgress = Math.min(1, progress / 0.38)
  const buildEase = buildProgress * buildProgress * (3 - 2 * buildProgress)
  const firstExitProgress = Math.min(1, Math.max(0, (progress - 0.48) / 0.22))
  const firstExitEase =
    firstExitProgress * firstExitProgress * (3 - 2 * firstExitProgress)
  const secondEnterProgress = Math.min(1, Math.max(0, (progress - 0.58) / 0.25))
  const secondEnterEase =
    secondEnterProgress *
    secondEnterProgress *
    (3 - 2 * secondEnterProgress)
  const baseline = 420
  const bars = [
    { initialX: 0, initialHeight: 260, color: 'coral' },
    { initialX: 250, initialHeight: 150, color: 'black' },
    { initialX: 500, initialHeight: 220, color: 'purple' },
  ]
  const barLayouts = bars.map((bar) => {
    const index = bars.indexOf(bar)
    const builtHeight = bar.initialHeight * buildEase * (1 - barDrops[index])
    const initialY = baseline - builtHeight
    return {
      ...bar,
      x: bar.initialX,
      y: initialY,
      width: 250,
      height: builtHeight,
    }
  })
  const initialStats = [28, 16, 24]
  const practitionerBuild = Math.min(1, secondEnterProgress / 0.62)
  const leaderBuild = Math.min(
    1,
    Math.max(0, (secondEnterProgress - 0.22) / 0.78),
  )
  const practitionerMaxHeight = 420 * 0.46
  const practitionerHeight =
    practitionerMaxHeight * practitionerBuild * (1 - coralDrop)
  const leaderHeight = 420 * leaderBuild

  return (
    <section className="confidence-section" ref={sectionRef}>
      <div className="confidence-sticky">
        <div
          className="confidence-title"
          role="heading"
          aria-level={2}
          style={{
            opacity: titleEnterEase,
            position:
              progress === 0 && titleEnterProgress > 0
                ? 'fixed'
                : 'absolute',
            transform: `translate3d(-50%, ${(1 - titleEnterEase) * -28}px, 0)`,
          }}
        >
          2. Confidence is high and doesn’t track either the security controls in place or
          resulting outcomes
        </div>
        <div
          className="confidence-chart"
          style={{ opacity: Math.min(1, progress / 0.035) }}
        >
          <div
            className="initial-chart-layer"
            style={{
              opacity: 1 - firstExitEase,
              transform: `translate3d(0, ${-firstExitEase * 18}px, 0) scale(${1 - firstExitEase * 0.025})`,
              pointerEvents: firstExitEase < 0.7 ? 'auto' : 'none',
            }}
          >
            {barLayouts.map((bar, index) => (
              <span
                className="bar-hit-area"
                key={bar.color}
                style={{
                  left: `${bar.x}px`,
                  top: `${baseline - bar.initialHeight}px`,
                  width: `${bar.width}px`,
                  height: `${bar.initialHeight}px`,
                }}
                onPointerMove={(event) => {
                  const layer = event.currentTarget.parentElement?.getBoundingClientRect()
                  if (!layer) return
                  const localY = event.clientY - layer.top
                  const availableHeight = Math.min(
                    bar.initialHeight,
                    Math.max(0, baseline - localY),
                  )
                  const drop = 1 - availableHeight / bar.initialHeight
                  setBarDrops((current) =>
                    current.map((value, itemIndex) => (itemIndex === index ? drop : value)),
                  )
                }}
                onPointerLeave={() =>
                  setBarDrops((current) =>
                    current.map((value, itemIndex) => (itemIndex === index ? 0 : value)),
                  )
                }
              >
                <span
                  className={`confidence-bar bar-${bar.color}`}
                  style={{ height: `${bar.height}px` }}
                />
              </span>
            ))}
            <div className="initial-chart-labels" style={{ opacity: buildEase }}>
              {barLayouts.map((bar, index) => (
                <span
                  key={initialStats[index]}
                  style={{
                    left: `${bar.x + 8}px`,
                    top: `${bar.y - 70}px`,
                  }}
                >
                  {Math.round(initialStats[index] * (1 - barDrops[index]))}%
                </span>
              ))}
            </div>
            <div className="chart-baseline" />
          </div>
          <div
            className="final-comparison"
            style={{
              opacity: secondEnterEase,
              transform: `translate3d(0, ${(1 - secondEnterEase) * 28}px, 0) scale(${0.975 + secondEnterEase * 0.025})`,
              pointerEvents: secondEnterEase > 0.7 ? 'auto' : 'none',
            }}
          >
            <div className="comparison-stack">
              <span
                className="comparison-leaders"
                style={{ height: `${leaderHeight}px` }}
              />
              <span
                className="comparison-hit comparison-hit-practitioners"
                style={{ height: `${practitionerMaxHeight}px` }}
                onPointerMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  const drop = Math.min(
                    1,
                    Math.max(0, (event.clientY - rect.top) / rect.height),
                  )
                  setCoralDrop(drop)
                }}
                onPointerLeave={() => setCoralDrop(0)}
              >
                <span
                  className="comparison-practitioners"
                  style={{ height: `${practitionerHeight}px` }}
                />
              </span>
            </div>
            <div className="final-chart-labels">
              <div className="final-label leaders">
                <strong>54%</strong>
                <span>of leaders agree</span>
              </div>
              <div className="final-label practitioners">
                <strong>46%</strong>
                <span>of practitioners agree</span>
              </div>
            </div>
            <div className="chart-baseline" />
          </div>
        </div>
      </div>
    </section>
  )
}

function ControlsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const progress = useStoryProgress(sectionRef)

  return (
    <section className="controls-section" ref={sectionRef}>
      <div className="controls-inner">
        <div className="controls-title" role="heading" aria-level={2}>
          3. Confidence is high and doesn’t track either
          <br />
          the security controls in place
        </div>
        <div className="controls-rows">
          {controlsRows.map((row, rowIndex) => {
            const rowProgress = Math.min(
              1,
              Math.max(0, (progress - (0.04 + rowIndex * 0.3)) / 0.25),
            )
            const rowEase = rowProgress * rowProgress * (3 - 2 * rowProgress)

            return (
              <div className={`controls-row controls-row-${row.theme}`} key={row.theme}>
                <div className="controls-shield-grid" aria-hidden="true">
                  {Array.from({ length: 84 }, (_, index) => {
                    const score = (index * 37 + Math.floor(index / 21) * 17) % 100
                    const tileStart = (index / 84) * 0.82
                    const tileProgress = Math.min(
                      1,
                      Math.max(0, (rowEase - tileStart) / 0.18),
                    )
                    const tileEase =
                      tileProgress *
                      tileProgress *
                      (3 - 2 * tileProgress)

                    return (
                      <span
                        className={`controls-shield ${score < row.value ? 'is-active' : ''}`}
                        key={index}
                        style={{
                          opacity: tileEase,
                          transform: `translate3d(0, ${(1 - tileEase) * 9}px, 0) scale(${0.82 + tileEase * 0.18})`,
                        }}
                      />
                    )
                  })}
                </div>
                <div
                  className="controls-stat"
                  style={{
                    opacity: rowEase,
                    transform: `translate3d(${(1 - rowEase) * 32}px, 0, 0)`,
                  }}
                >
                  <div className="controls-value">
                    {Math.round(row.value * rowEase)}%
                  </div>
                  <p>{row.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function RiskSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const progress = useStoryProgress(sectionRef)

  return (
    <section className="risk-section" ref={sectionRef}>
      <div className="risk-sticky">
        <div className="risk-panel">
          <div className="risk-title" role="heading" aria-level={2}>
            4. Risk isn’t confined to agent behavior. It’s also in
            <br />
            the code and in who’s allowed to build.
          </div>
          <div className="risk-title-rule" />
          <div className="risk-chart">
            {riskItems.map((item, index) => {
              const itemProgress = Math.min(
                1,
                Math.max(0, (progress - index * 0.19) / 0.15),
              )
              const itemEase =
                itemProgress *
                itemProgress *
                (3 - 2 * itemProgress)

              return (
                <div className="risk-column" key={item.value}>
                  <p
                    style={{
                      opacity: itemEase,
                      transform: `translate3d(0, ${(1 - itemEase) * 12}px, 0)`,
                    }}
                  >
                    {item.body}
                  </p>
                  <div className="risk-measure">
                    <div
                      className="risk-value"
                      style={{
                        opacity: itemEase,
                        transform: `translate3d(0, ${(1 - itemEase) * 16}px, 0)`,
                      }}
                    >
                      {Math.round(item.value * itemEase)}%
                    </div>
                    <div
                      className="risk-bar"
                      style={{ height: `${item.value * 2.75 * itemEase}px` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const storyRef = useRef<HTMLDivElement>(null)
  const progress = useStoryProgress(storyRef)
  const timeline = Math.min(1, Math.max(0, (progress - 0.1) / 0.9))
  const phase = getStoryPhase(timeline)
  const stage = Math.min(stories.length - 1, Math.floor(phase))
  const local = timeline === 1 ? 1 : phase - Math.floor(phase)
  const isDetailStory = phase >= 4
  const detailIndex = Math.min(
    detailStories.length - 1,
    Math.max(0, Math.floor(phase) - 4),
  )
  const value = isDetailStory ? detailStories[detailIndex].value : stories[stage].value
  const enter = Math.min(1, local / 0.3)
  const enterEase = enter * enter * (3 - 2 * enter)
  const exit =
    phase >= 3 && phase < 4
      ? 0
      : isDetailStory
        ? Math.min(1, Math.max(0, (local - 0.78) / 0.22))
        : Math.min(1, Math.max(0, (local - (stage === 2 ? 0.7 : 0.82)) / (stage === 2 ? 0.3 : 0.18)))
  const exitEase = exit * exit * (3 - 2 * exit)
  const cardY =
    phase >= 3 && phase < 4
      ? 105
      : 105 * (1 - enterEase) - 105 * exitEase
  const cardVisible =
    timeline === 0 || phase >= 5 || (phase >= 3 && phase < 4)
      ? 0
      : Math.min(1, enterEase * 1.4)
  const cardSide = isDetailStory ? 0 : stage % 2
  const giantEnter = Math.min(1, Math.max(0, (phase - 3.56) / 0.36))
  const giantEnterEase = giantEnter * giantEnter * (3 - 2 * giantEnter)
  const giantExit = Math.min(1, Math.max(0, phase - 5))
  const giantExitEase = giantExit * giantExit * (3 - 2 * giantExit)
  const giantOpacity = giantEnterEase * (1 - giantExitEase)
  const giantFillProgress = Math.min(1, Math.max(0, phase - 4))
  const giantFillEase =
    giantFillProgress * giantFillProgress * (3 - 2 * giantFillProgress)
  const fullscreenProgress = Math.min(1, Math.max(0, (phase - 3) / 0.28))
  const fullscreenEase =
    fullscreenProgress * fullscreenProgress * (3 - 2 * fullscreenProgress)
  const panelOffset = 274 * (1 - fullscreenEase)
  const outroProgress = Math.min(1, Math.max(0, phase - 5))
  const outroEase = outroProgress * outroProgress * (3 - 2 * outroProgress)

  return (
    <main>
      <nav className="nav-shell" aria-label="Primary">
        <img className="brand" src="/assets/e0d5d.svg" alt="Harness" />
        <div
          className="report-link"
          role="button"
          tabIndex={0}
          onClick={() => window.open('/report.pdf', '_blank')}
          onKeyDown={(event) => event.key === 'Enter' && window.open('/report.pdf', '_blank')}
        >
          Get the report
        </div>
      </nav>

      <section className="hero">
        <HeroMosaic />
        <div className="hero-copy">
          <div className="display-title" role="heading" aria-level={1}>
            State of
            <br />
            Agent Security Report 2026
          </div>
          <p>
            Organizations deploying AI agents report confidence across every domain we tested, but
            in most of those domains.
          </p>
          <div
            className="download"
            role="button"
            tabIndex={0}
            onClick={() => window.open('/report.pdf', '_blank')}
            onKeyDown={(event) =>
              event.key === 'Enter' && window.open('/report.pdf', '_blank')
            }
          >
            Download PDF
          </div>
        </div>
      </section>

      <section className="summary">
        <div className="summary-inner">
          <div className="section-title" role="heading" aria-level={2}>
            Executive summary
          </div>
          <div className="summary-copy">
            <p>Organizations are pushing AI agents into production faster than they can govern them.</p>
            <p>
              An AI agent isn’t like deterministic software: the same agent can behave differently
              from one run to the next. That means every stage of the software development lifecycle
              that organizations trust — test, deploy, secure, optimize, release, govern — has to be
              rebuilt for the agent development lifecycle (Agent DLC). From our survey analysis, we
              found out that most organizations haven’t rebuilt these stages yet. They’ve just kept
              deploying more agents.
            </p>
            <p>
              We wanted to understand the gap between an organization’s confidence and the actual
              controls in place, stage by stage. 700 engineers and engineering leaders from across
              the US, UK, France, Germany, and India were surveyed to provide information about their
              organization’s Agent DLC, how they build, test, secure, deploy, and govern the AI agents
              deployed in their environments.
            </p>
          </div>
        </div>
      </section>

      <div className="incident-sequence">
        <section
          className="incident-intro"
          style={{
            opacity: 1 - fullscreenEase,
            transform: `translate3d(0, ${-fullscreenEase * 100}%, 0)`,
          }}
        >
          <div className="incident-heading">
            <div className="incident-title" role="heading" aria-level={2}>
              1. Agent security incidents
              <br />
              are increasingly the norm
            </div>
            <p>
              As AI agents scale, security incidents are rising, exposing organizations to data
              breaches, compliance risks, and growing governance challenges.
            </p>
          </div>
          <div className="glitch-tile">
            <img src="/assets/47834.png" alt="" />
          </div>
        </section>

        <section className="story" ref={storyRef}>
          <div
            className="sticky-visual"
            style={{
              top: `${panelOffset}px`,
              height: `calc(100vh - ${panelOffset}px)`,
              opacity: 1 - outroEase,
            }}
          >
            <ShieldField progress={timeline} />
            <div
              className="giant-shield"
              aria-hidden="true"
              style={{
                opacity: giantOpacity,
                '--giant-scale': 0.18 + giantEnterEase * 0.82,
                '--giant-x': '23vw',
              } as CSSProperties}
            >
              <span className="giant-shield-fill">
                {giantFillTiles.map((tile) => {
                  const revealStart = (tile.revealOrder / giantFillTiles.length) * 0.94
                  const tileProgress = Math.min(
                    1,
                    Math.max(0, (giantFillEase - revealStart) / 0.06),
                  )
                  const shimmer = Math.sin(tileProgress * Math.PI)

                  return (
                    <span
                      className="giant-shield-tile"
                      key={tile.index}
                      style={{
                        opacity: tileProgress,
                        transform: `scale(${0.94 + tileProgress * 0.06})`,
                        backgroundColor: `rgb(255 ${Math.round(152 + shimmer * 48)} ${Math.round(113 + shimmer * 54)})`,
                      }}
                    />
                  )
                })}
              </span>
            </div>
            <div
              className={`stat-card card-side-${cardSide}`}
              style={{
                opacity: cardVisible,
                '--card-y': `${cardY}vh`,
                '--card-scale': 0.97 + cardVisible * 0.03,
              } as CSSProperties}
            >
              <div className="stat-value">{value}%</div>
              <p>{isDetailStory ? detailStories[detailIndex].body : stories[stage].body}</p>
            </div>
            <div className="progress-rail">
              <span style={{ transform: `scaleX(${timeline})` }} />
            </div>
          </div>
        </section>
      </div>
      <ConfidenceSection />
      <ControlsSection />
      <RiskSection />
    </main>
  )
}
