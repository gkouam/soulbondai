"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { predefinedPersonalities, AIPersonality, blendPersonalities } from "@/lib/ai-personalities"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PersonalitySelectorProps {
  selectedPersonality: AIPersonality | null
  onSelect: (personality: AIPersonality) => void
}

export function PersonalitySelector({ selectedPersonality, onSelect }: PersonalitySelectorProps) {
  const [blendMode, setBlendMode] = useState(false)
  const [personality1, setPersonality1] = useState<string>('sage')
  const [personality2, setPersonality2] = useState<string>('playful')
  const [blendWeight, setBlendWeight] = useState([0.5])

  const handlePresetSelect = (personalityId: string) => {
    const personality = predefinedPersonalities[personalityId]
    onSelect(personality)
  }

  const handleBlend = () => {
    const p1 = predefinedPersonalities[personality1]
    const p2 = predefinedPersonalities[personality2]
    const blended = blendPersonalities(p1, p2, blendWeight[0])
    onSelect(blended)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="presets">Preset Personalities</TabsTrigger>
          <TabsTrigger value="blend">Blend Personalities</TabsTrigger>
          <TabsTrigger value="custom">Custom (Coming Soon)</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(predefinedPersonalities).map((personality) => (
              <Card 
                key={personality.id}
                className={`cursor-pointer transition-all ${
                  selectedPersonality?.id === personality.id 
                    ? 'ring-2 ring-violet-500 bg-gray-900' 
                    : 'hover:bg-gray-900'
                }`}
                onClick={() => handlePresetSelect(personality.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{personality.avatar}</span>
                      <CardTitle>{personality.name}</CardTitle>
                    </div>
                    {selectedPersonality?.id === personality.id && (
                      <Badge variant="secondary">Selected</Badge>
                    )}
                  </div>
                  <CardDescription>{personality.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-400">Specialties</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {personality.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-400">Key Traits</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {Object.entries(personality.traits)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 4)
                          .map(([trait, value]) => (
                            <div key={trait} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{trait.replace('_', ' ')}</span>
                              <div className="flex items-center space-x-1">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-violet-500 h-2 rounded-full"
                                    style={{ width: `${value * 10}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400">{value}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="blend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blend Two Personalities</CardTitle>
              <CardDescription>
                Create a unique personality by combining traits from two different personalities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Personality</Label>
                  <select 
                    className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-md"
                    value={personality1}
                    onChange={(e) => setPersonality1(e.target.value)}
                  >
                    {Object.entries(predefinedPersonalities).map(([id, p]) => (
                      <option key={id} value={id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Second Personality</Label>
                  <select 
                    className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-md"
                    value={personality2}
                    onChange={(e) => setPersonality2(e.target.value)}
                  >
                    {Object.entries(predefinedPersonalities).map(([id, p]) => (
                      <option key={id} value={id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <Label>Blend Ratio</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm">{predefinedPersonalities[personality1].name}</span>
                  <Slider 
                    value={blendWeight} 
                    onValueChange={setBlendWeight}
                    max={1}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm">{predefinedPersonalities[personality2].name}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {Math.round(blendWeight[0] * 100)}% / {Math.round((1 - blendWeight[0]) * 100)}%
                </p>
              </div>
              
              <Button onClick={handleBlend} className="w-full">
                Create Blended Personality
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Personality Training</CardTitle>
              <CardDescription>
                Train your AI companion with custom examples and preferences (Premium feature)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">
                  Create truly unique personalities by providing examples of how you'd like your AI to respond.
                </p>
                <Button disabled variant="outline">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}