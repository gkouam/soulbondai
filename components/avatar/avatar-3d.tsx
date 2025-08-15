"use client"

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { VoiceEmotionData } from '@/lib/voice/emotion-detector'
import { PersonalityAvatar, AVATAR_PERSONALITIES } from '@/lib/avatar/emotive-avatar'

interface Avatar3DProps {
  personality: string
  emotion?: VoiceEmotionData
  speaking?: boolean
  gazeTarget?: { x: number, y: number }
  onReady?: () => void
}

export function Avatar3D({
  personality,
  emotion,
  speaking,
  gazeTarget,
  onReady
}: Avatar3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [avatarState, setAvatarState] = useState<any>(null)
  
  const avatarPersonality = AVATAR_PERSONALITIES[personality] || AVATAR_PERSONALITIES['The Gentle']
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Initialize Three.js scene
    const initScene = async () => {
      // Dynamic import to avoid SSR issues
      const THREE = await import('three')
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader')
      
      const canvas = canvasRef.current!
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      
      // Scene setup
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x1a1a2e)
      scene.fog = new THREE.Fog(0x1a1a2e, 10, 50)
      
      // Camera
      const camera = new THREE.PerspectiveCamera(
        45,
        width / height,
        0.1,
        1000
      )
      camera.position.set(0, 1.5, 3)
      camera.lookAt(0, 1.2, 0)
      
      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
      
      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(5, 10, 5)
      directionalLight.castShadow = true
      directionalLight.shadow.camera.near = 0.1
      directionalLight.shadow.camera.far = 50
      directionalLight.shadow.camera.left = -10
      directionalLight.shadow.camera.right = 10
      directionalLight.shadow.camera.top = 10
      directionalLight.shadow.camera.bottom = -10
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      scene.add(directionalLight)
      
      // Rim light for better silhouette
      const rimLight = new THREE.DirectionalLight(0x6366f1, 0.4)
      rimLight.position.set(-5, 5, -5)
      scene.add(rimLight)
      
      // Create stylized avatar (placeholder geometry for now)
      const createAvatar = () => {
        const avatar = new THREE.Group()
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.5, 32, 32)
        const headMaterial = new THREE.MeshPhysicalMaterial({
          color: avatarPersonality.archetype.skinTone || 0xfdbcb4,
          roughness: 0.5,
          metalness: 0,
          clearcoat: 0.3,
          clearcoatRoughness: 0.4
        })
        const head = new THREE.Mesh(headGeometry, headMaterial)
        head.position.y = 1.5
        head.castShadow = true
        head.receiveShadow = true
        avatar.add(head)
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16)
        const eyeMaterial = new THREE.MeshPhysicalMaterial({
          color: avatarPersonality.archetype.eyeColor || 0x4a90e2,
          roughness: 0.1,
          metalness: 0.5,
          clearcoat: 1,
          clearcoatRoughness: 0
        })
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
        leftEye.position.set(-0.15, 1.55, 0.4)
        avatar.add(leftEye)
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
        rightEye.position.set(0.15, 1.55, 0.4)
        avatar.add(rightEye)
        
        // Pupils
        const pupilGeometry = new THREE.SphereGeometry(0.04, 8, 8)
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
        
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
        leftPupil.position.set(-0.15, 1.55, 0.46)
        avatar.add(leftPupil)
        
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
        rightPupil.position.set(0.15, 1.55, 0.46)
        avatar.add(rightPupil)
        
        // Eyebrows (for expressions)
        const eyebrowGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.05)
        const eyebrowMaterial = new THREE.MeshBasicMaterial({ 
          color: avatarPersonality.archetype.hairColor || 0x3a3a3a 
        })
        
        const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial)
        leftEyebrow.position.set(-0.15, 1.65, 0.45)
        avatar.add(leftEyebrow)
        
        const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial)
        rightEyebrow.position.set(0.15, 1.65, 0.45)
        avatar.add(rightEyebrow)
        
        // Mouth (for speaking animation)
        const mouthGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI)
        const mouthMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xd98880,
          roughness: 0.3,
          metalness: 0
        })
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial)
        mouth.position.set(0, 1.35, 0.45)
        mouth.rotation.z = Math.PI
        avatar.add(mouth)
        
        // Body (simplified)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 16)
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
          color: avatarPersonality.archetype.outfitColor || 0x6366f1,
          roughness: 0.7,
          metalness: 0.1
        })
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
        body.position.y = 0.6
        body.castShadow = true
        body.receiveShadow = true
        avatar.add(body)
        
        // Hair (stylized)
        const hairGeometry = new THREE.SphereGeometry(0.55, 16, 12)
        const hairMaterial = new THREE.MeshPhysicalMaterial({
          color: avatarPersonality.archetype.hairColor || 0x3a3a3a,
          roughness: 0.8,
          metalness: 0
        })
        const hair = new THREE.Mesh(hairGeometry, hairMaterial)
        hair.position.y = 1.6
        hair.scale.y = 0.7
        avatar.add(hair)
        
        return {
          group: avatar,
          head,
          leftEye,
          rightEye,
          leftPupil,
          rightPupil,
          leftEyebrow,
          rightEyebrow,
          mouth,
          body,
          hair
        }
      }
      
      const avatar = createAvatar()
      scene.add(avatar.group)
      
      // Animation state
      let time = 0
      let blinkTimer = 0
      let nextBlink = Math.random() * 3 + 2
      
      // Emotion-based animations
      const applyEmotionExpression = (emotion: VoiceEmotionData | undefined) => {
        if (!emotion) return
        
        const primary = emotion.primaryEmotion
        const intensity = emotion.confidence
        
        // Adjust eyebrow positions based on emotion
        switch (primary) {
          case 'joy':
          case 'excitement':
            avatar.leftEyebrow.position.y = 1.65 + intensity * 0.02
            avatar.rightEyebrow.position.y = 1.65 + intensity * 0.02
            avatar.leftEyebrow.rotation.z = -intensity * 0.1
            avatar.rightEyebrow.rotation.z = intensity * 0.1
            break
          case 'sadness':
            avatar.leftEyebrow.position.y = 1.63
            avatar.rightEyebrow.position.y = 1.63
            avatar.leftEyebrow.rotation.z = intensity * 0.2
            avatar.rightEyebrow.rotation.z = -intensity * 0.2
            break
          case 'anger':
            avatar.leftEyebrow.position.y = 1.62
            avatar.rightEyebrow.position.y = 1.62
            avatar.leftEyebrow.rotation.z = intensity * 0.3
            avatar.rightEyebrow.rotation.z = -intensity * 0.3
            break
          case 'surprise':
            avatar.leftEyebrow.position.y = 1.68 + intensity * 0.03
            avatar.rightEyebrow.position.y = 1.68 + intensity * 0.03
            avatar.leftEye.scale.setScalar(1 + intensity * 0.2)
            avatar.rightEye.scale.setScalar(1 + intensity * 0.2)
            break
          case 'love':
            avatar.leftEyebrow.position.y = 1.64
            avatar.rightEyebrow.position.y = 1.64
            avatar.leftEyebrow.rotation.z = -0.05
            avatar.rightEyebrow.rotation.z = 0.05
            // Slightly close eyes
            avatar.leftEye.scale.y = 0.8
            avatar.rightEye.scale.y = 0.8
            break
        }
        
        // Adjust mouth based on emotion
        if (primary === 'joy' || primary === 'excitement') {
          avatar.mouth.scale.x = 1 + intensity * 0.3
          avatar.mouth.rotation.z = Math.PI - intensity * 0.2
        } else if (primary === 'sadness') {
          avatar.mouth.rotation.z = Math.PI + intensity * 0.2
          avatar.mouth.scale.x = 0.8
        } else if (primary === 'surprise') {
          avatar.mouth.scale.setScalar(1 + intensity * 0.4)
        }
      }
      
      // Controls
      const controls = new OrbitControls(camera, canvas)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.minDistance = 2
      controls.maxDistance = 10
      controls.maxPolarAngle = Math.PI / 1.8
      controls.target.set(0, 1.2, 0)
      
      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate)
        
        time += 0.016 // ~60fps
        
        // Idle animation (breathing)
        avatar.body.scale.x = 1 + Math.sin(time * 2) * 0.02
        avatar.body.scale.z = 1 + Math.sin(time * 2) * 0.02
        avatar.head.position.y = 1.5 + Math.sin(time * 2) * 0.01
        
        // Speaking animation
        if (speaking) {
          avatar.mouth.scale.y = 1 + Math.sin(time * 15) * 0.3
          avatar.mouth.scale.x = 1 + Math.cos(time * 15) * 0.1
          avatar.head.rotation.x = Math.sin(time * 8) * 0.02
        }
        
        // Blinking
        blinkTimer += 0.016
        if (blinkTimer > nextBlink) {
          avatar.leftEye.scale.y = 0.1
          avatar.rightEye.scale.y = 0.1
          setTimeout(() => {
            avatar.leftEye.scale.y = 1
            avatar.rightEye.scale.y = 1
          }, 150)
          blinkTimer = 0
          nextBlink = Math.random() * 4 + 2
        }
        
        // Apply emotion expression
        applyEmotionExpression(emotion)
        
        // Eye tracking (follow cursor)
        if (gazeTarget) {
          const targetX = (gazeTarget.x - 0.5) * 0.3
          const targetY = (gazeTarget.y - 0.5) * 0.2
          
          avatar.leftPupil.position.x = -0.15 + targetX * 0.03
          avatar.leftPupil.position.y = 1.55 + targetY * 0.02
          avatar.rightPupil.position.x = 0.15 + targetX * 0.03
          avatar.rightPupil.position.y = 1.55 + targetY * 0.02
          
          avatar.head.rotation.y = targetX * 0.2
          avatar.head.rotation.x = -targetY * 0.1
        }
        
        // Micro-movements for life-like appearance
        avatar.head.rotation.z = Math.sin(time * 0.5) * 0.01
        avatar.body.rotation.y = Math.sin(time * 0.3) * 0.02
        
        controls.update()
        renderer.render(scene, camera)
      }
      
      // Handle resize
      const handleResize = () => {
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }
      
      window.addEventListener('resize', handleResize)
      
      // Start animation
      animate()
      setIsLoading(false)
      setAvatarState(avatar)
      onReady?.()
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
        renderer.dispose()
      }
    }
    
    initScene()
  }, [personality])
  
  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl"
        style={{ display: isLoading ? 'none' : 'block' }}
      />
      
      {/* Emotion indicator */}
      {emotion && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {emotion.primaryEmotion} ({Math.round(emotion.confidence * 100)}%)
        </div>
      )}
    </div>
  )
}