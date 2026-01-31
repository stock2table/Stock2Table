import React from 'react';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';

interface LogoProps {
  size?: number;
  showBackground?: boolean;
}

export default function Logo({ size = 120, showBackground = true }: LogoProps) {
  const scale = size / 512;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      {/* Background Circle */}
      {showBackground && (
        <Circle cx="256" cy="256" r="240" fill="#22c55e" />
      )}
      
      {/* Inner Circle (Plate) */}
      <Circle cx="256" cy="270" r="160" fill="white" opacity={0.95} />
      <Circle cx="256" cy="270" r="140" fill="none" stroke="#e5e7eb" strokeWidth="3" />
      
      {/* Fork (Left) */}
      <G transform="translate(130, 180)">
        <Rect x="20" y="60" width="8" height="120" rx="4" fill="#22c55e" />
        <Rect x="8" y="0" width="6" height="50" rx="3" fill="#22c55e" />
        <Rect x="18" y="0" width="6" height="55" rx="3" fill="#22c55e" />
        <Rect x="28" y="0" width="6" height="50" rx="3" fill="#22c55e" />
        <Path d="M8 50 Q24 70 40 50" stroke="#22c55e" strokeWidth="6" fill="none" strokeLinecap="round" />
      </G>
      
      {/* Knife (Right) */}
      <G transform="translate(330, 180)">
        <Rect x="20" y="60" width="10" height="120" rx="5" fill="#22c55e" />
        <Path d="M15 0 L35 0 L30 60 L20 60 Z" fill="#22c55e" />
      </G>
      
      {/* Leaf/Fresh ingredient on plate */}
      <G transform="translate(200, 220)">
        <Path d="M56 80 Q30 50 56 10 Q82 50 56 80" fill="#16a34a" />
        <Path d="M56 80 L56 30" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
        <Path d="M56 50 Q40 40 35 55" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M56 40 Q72 30 77 45" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
      </G>
      
      {/* Arrow indicating transformation (Stock → Table) */}
      <G transform="translate(256, 140)">
        <Path d="M-40 0 L30 0" stroke="#166534" strokeWidth="6" strokeLinecap="round" />
        <Path d="M20 -12 L35 0 L20 12" stroke="#166534" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
      
      {/* Small ingredient dots around arrow */}
      <Circle cx="180" cy="130" r="8" fill="#fbbf24" />
      <Circle cx="200" cy="145" r="6" fill="#ef4444" />
      <Circle cx="175" cy="155" r="5" fill="#f97316" />
    </Svg>
  );
}
