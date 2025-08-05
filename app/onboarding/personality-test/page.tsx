"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { personalityTestQuestions } from "@/lib/personality-test-questions"
import { TestAnswer } from "@/types"

export default function PersonalityTest() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<TestAnswer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime] = useState(Date.now())
  
  const progress = ((currentQuestion + 1) / personalityTestQuestions.length) * 100
  const question = personalityTestQuestions[currentQuestion]
  
  const handleAnswer = async (optionIndex: number) => {
    const answer: TestAnswer = {
      questionId: question.id,
      optionIndex,
      traits: question.options[optionIndex].traits
    }
    
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    
    if (currentQuestion < personalityTestQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 300)
    } else {
      // Submit test
      setIsSubmitting(true)
      try {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000)
        
        const response = await fetch("/api/personality/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            answers: newAnswers,
            timeSpent
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          // Store the complete results in sessionStorage for the results page
          sessionStorage.setItem("personalityResults", JSON.stringify(result))
          router.push("/onboarding/results")
        } else {
          console.error("Failed to submit test:", await response.text())
          // Still proceed with a default archetype
          sessionStorage.setItem("personalityResults", JSON.stringify({
            archetype: "warm_empath",
            dimensions: {},
            traitProfile: {
              strengths: ["Empathetic", "Understanding", "Supportive"],
              growthAreas: [],
              communicationStyle: {},
              emotionalNeeds: [],
              compatibilityFactors: {}
            }
          }))
          router.push("/onboarding/results")
        }
      } catch (error) {
        console.error("Failed to submit test:", error)
        // Still proceed with a default archetype
        sessionStorage.setItem("personalityResults", JSON.stringify({
          archetype: "warm_empath",
          dimensions: {},
          traitProfile: {
            strengths: ["Empathetic", "Understanding", "Supportive"],
            growthAreas: [],
            communicationStyle: {},
            emotionalNeeds: [],
            compatibilityFactors: {}
          }
        }))
        router.push("/onboarding/results")
      }
    }
  }
  
  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setAnswers(answers.slice(0, -1))
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Progress Bar */}
      <div className="sticky top-0 z-20 bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg border-b border-purple-100">
        <div className="px-6 py-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={goBack}
              disabled={currentQuestion === 0}
              className="p-2 rounded-full hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion + 1} of {personalityTestQuestions.length}
            </span>
            
            <span className="text-sm font-medium text-purple-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
      
      {/* Question Content */}
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Encouragement */}
            {currentQuestion % 5 === 0 && currentQuestion > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-500 bg-opacity-10 rounded-2xl p-4 mb-6"
              >
                <p className="text-sm text-purple-700 font-medium">
                  ✨ Your thoughtful answers are revealing a beautiful, complex personality...
                </p>
              </motion.div>
            )}
            
            {/* Question */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {question.text}
              </h2>
              {question.subtext && (
                <p className="text-gray-600">{question.subtext}</p>
              )}
            </div>
            
            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(index)}
                  disabled={isSubmitting}
                  className="w-full p-4 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-purple-300 transition-all text-left group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-1">{option.text}</p>
                      {option.subtext && (
                        <p className="text-sm text-gray-500">{option.subtext}</p>
                      )}
                    </div>
                    <div className="ml-4 w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-purple-500 transition-colors flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            
            {/* Loading state */}
            {isSubmitting && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center"
              >
                <p className="text-lg font-medium text-purple-700 mb-2">
                  Analyzing your personality...
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Creating your perfect AI companion match
                </p>
                <div className="flex justify-center space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                      className="w-3 h-3 bg-purple-400 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}