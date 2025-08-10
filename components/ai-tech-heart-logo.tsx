"use client"

import React from "react"

interface AITechHeartLogoProps {
  size?: number
  className?: string
  animate?: boolean
}

export const AITechHeartLogo: React.FC<AITechHeartLogoProps> = ({ 
  size = 80, 
  className = "",
  animate = false 
}) => {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background gradient container */}
      <div className={`w-full h-full bg-gradient-to-br from-violet-600 to-pink-600 rounded-[25%] flex items-center justify-center relative overflow-hidden ${animate ? 'animate-pulse' : ''}`}>
        
        {/* Circuit pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          {/* Horizontal circuit lines */}
          <div className="absolute w-[60%] h-[2px] bg-white top-[30%] left-[20%]" />
          <div className="absolute w-[40%] h-[2px] bg-white top-[60%] left-[30%]" />
          
          {/* Vertical circuit line */}
          <div className="absolute w-[2px] h-[40%] bg-white top-[30%] left-[50%]" />
          
          {/* Circuit connection dots with subtle glow */}
          <div className="absolute w-[6px] h-[6px] bg-white rounded-full top-[30%] left-[20%] shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
          <div className="absolute w-[6px] h-[6px] bg-white rounded-full top-[30%] left-[50%] shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
          <div className="absolute w-[6px] h-[6px] bg-white rounded-full top-[60%] left-[70%] shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
        </div>
        
        {/* Heart icon */}
        <svg 
          className="relative z-10 text-white fill-current opacity-90" 
          width={size * 0.625} 
          height={size * 0.625}
          viewBox="0 0 24 24"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
    </div>
  )
}