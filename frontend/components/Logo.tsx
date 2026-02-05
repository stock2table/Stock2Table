import React from 'react';
import Svg, { Circle, Rect, Path, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface LogoProps {
  size?: number;
  showBackground?: boolean;
}

export default function Logo({ size = 120, showBackground = true }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        {/* Vibrant green gradient for background */}
        <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4ade80" />
          <Stop offset="50%" stopColor="#22c55e" />
          <Stop offset="100%" stopColor="#15803d" />
        </LinearGradient>
        
        {/* Gold/Orange gradient for utensils */}
        <LinearGradient id="utensilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="50%" stopColor="#f59e0b" />
          <Stop offset="100%" stopColor="#d97706" />
        </LinearGradient>
        
        {/* Plate shine gradient */}
        <RadialGradient id="plateGradient" cx="40%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#ffffff" />
          <Stop offset="100%" stopColor="#f3f4f6" />
        </RadialGradient>
        
        {/* Fresh leaf gradient */}
        <LinearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4ade80" />
          <Stop offset="100%" stopColor="#16a34a" />
        </LinearGradient>
        
        {/* Sparkle gradient */}
        <RadialGradient id="sparkleGradient" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#fef3c7" />
          <Stop offset="100%" stopColor="#fbbf24" />
        </RadialGradient>
      </Defs>
      
      {/* Background Circle with gradient */}
      {showBackground && (
        <>
          <Circle cx="256" cy="256" r="248" fill="url(#bgGradient)" />
          {/* Outer glow ring */}
          <Circle cx="256" cy="256" r="240" fill="none" stroke="#86efac" strokeWidth="4" opacity={0.6} />
        </>
      )}
      
      {/* Decorative outer ring sparkles */}
      <Circle cx="120" cy="150" r="12" fill="url(#sparkleGradient)" />
      <Circle cx="392" cy="150" r="10" fill="url(#sparkleGradient)" />
      <Circle cx="100" cy="300" r="8" fill="url(#sparkleGradient)" />
      <Circle cx="412" cy="320" r="11" fill="url(#sparkleGradient)" />
      <Circle cx="150" cy="400" r="9" fill="url(#sparkleGradient)" />
      <Circle cx="362" cy="410" r="7" fill="url(#sparkleGradient)" />
      
      {/* Main Plate with shine */}
      <Circle cx="256" cy="270" r="165" fill="#e5e7eb" />
      <Circle cx="256" cy="270" r="158" fill="url(#plateGradient)" />
      <Circle cx="256" cy="270" r="135" fill="none" stroke="#d1d5db" strokeWidth="2" />
      
      {/* Plate decorative inner ring */}
      <Circle cx="256" cy="270" r="120" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="8 4" />
      
      {/* Fork (Left) - Gold */}
      <G transform="translate(115, 175)">
        <Rect x="22" y="65" width="10" height="125" rx="5" fill="url(#utensilGradient)" />
        <Rect x="8" y="0" width="7" height="55" rx="3.5" fill="url(#utensilGradient)" />
        <Rect x="19" y="0" width="7" height="60" rx="3.5" fill="url(#utensilGradient)" />
        <Rect x="30" y="0" width="7" height="55" rx="3.5" fill="url(#utensilGradient)" />
        <Path d="M8 55 Q24 75 42 55" stroke="url(#utensilGradient)" strokeWidth="7" fill="none" strokeLinecap="round" />
        {/* Fork shine */}
        <Rect x="24" y="70" width="3" height="80" rx="1.5" fill="#fef3c7" opacity={0.6} />
      </G>
      
      {/* Knife (Right) - Gold */}
      <G transform="translate(340, 175)">
        <Rect x="18" y="65" width="12" height="125" rx="6" fill="url(#utensilGradient)" />
        <Path d="M12 0 L38 0 L32 65 L18 65 Z" fill="url(#utensilGradient)" />
        {/* Knife shine */}
        <Path d="M20 5 L28 5 L25 60 L20 60 Z" fill="#fef3c7" opacity={0.4} />
      </G>
      
      {/* Colorful food on plate */}
      {/* Main leaf/herb */}
      <G transform="translate(205, 215)">
        <Path d="M51 85 Q20 50 51 5 Q82 50 51 85" fill="url(#leafGradient)" />
        <Path d="M51 85 L51 25" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
        <Path d="M51 50 Q35 40 30 55" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M51 38 Q67 28 72 43" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
      </G>
      
      {/* Tomato slice */}
      <Circle cx="290" cy="290" r="22" fill="#ef4444" />
      <Circle cx="290" cy="290" r="16" fill="#fca5a5" opacity={0.5} />
      <Circle cx="285" cy="285" r="4" fill="#fef2f2" opacity={0.8} />
      
      {/* Carrot piece */}
      <Path d="M300 240 Q320 250 315 275 Q305 280 295 265 Q290 250 300 240" fill="#f97316" />
      <Path d="M302 245 L308 260" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" />
      
      {/* Lemon wedge */}
      <Path d="M220 310 Q200 290 220 270 Q240 290 220 310" fill="#fde047" />
      <Path d="M220 310 L220 275" stroke="#facc15" strokeWidth="2" />
      
      {/* Stock to Table arrow - Flashy */}
      <G transform="translate(256, 130)">
        {/* Arrow glow */}
        <Path d="M-50 0 L35 0" stroke="#86efac" strokeWidth="12" strokeLinecap="round" opacity={0.5} />
        <Path d="M-50 0 L35 0" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <Path d="M-50 0 L35 0" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
        
        {/* Arrow head */}
        <Path d="M25 -15 L45 0 L25 15" stroke="#15803d" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M27 -12 L43 0 L27 12" stroke="#4ade80" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
      
      {/* Floating ingredient particles */}
      <Circle cx="165" cy="120" r="10" fill="#ef4444" />
      <Circle cx="185" cy="140" r="7" fill="#f97316" />
      <Circle cx="160" cy="150" r="6" fill="#fbbf24" />
      <Circle cx="340" cy="125" r="8" fill="#22c55e" />
      <Circle cx="355" cy="145" r="6" fill="#3b82f6" />
      
      {/* Sparkle stars */}
      <G transform="translate(140, 100)">
        <Path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#fef3c7" />
      </G>
      <G transform="translate(370, 100)">
        <Path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#fef3c7" />
      </G>
      <G transform="translate(420, 260)">
        <Path d="M0 -5 L1 -1 L5 0 L1 1 L0 5 L-1 1 L-5 0 L-1 -1 Z" fill="#fef3c7" />
      </G>
    </Svg>
  );
}
