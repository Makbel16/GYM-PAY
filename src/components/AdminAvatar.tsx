import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function AdminAvatar({ size = 68 }: { size?: number }) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Soft Sky Blue Background Circle */}
        <Circle cx="50" cy="50" r="50" fill="#DBEAFE" />

        {/* Navy Crewneck Shirt */}
        <Path
          d="M20 100 C20 76 34 70 50 70 C66 70 80 76 80 100 Z"
          fill="#1E3A8A"
        />
        {/* Shirt Collar cutout */}
        <Path
          d="M42 70 Q50 78 58 70 Z"
          fill="#B47348"
        />

        {/* Neck */}
        <Rect x="42" y="58" width="16" height="15" fill="#A05A32" rx="4" />

        {/* Face */}
        <Path
          d="M32 40 C32 25 68 25 68 40 C68 56 58 64 50 64 C42 64 32 56 32 40 Z"
          fill="#B47348"
        />

        {/* Ears */}
        <Circle cx="30" cy="43" r="4.5" fill="#A05A32" />
        <Circle cx="70" cy="43" r="4.5" fill="#A05A32" />

        {/* Curly Hair Silhouette */}
        <Path
          d="M28 35 C26 22 38 12 50 12 C62 12 74 22 72 35 C68 26 62 23 50 23 C38 23 32 26 28 35 Z"
          fill="#14110E"
        />
        {/* Hair Curls Details */}
        <Circle cx="35" cy="20" r="6" fill="#14110E" />
        <Circle cx="45" cy="16" r="7" fill="#14110E" />
        <Circle cx="55" cy="16" r="7" fill="#14110E" />
        <Circle cx="65" cy="20" r="6" fill="#14110E" />
        <Circle cx="30" cy="26" r="5" fill="#14110E" />
        <Circle cx="70" cy="26" r="5" fill="#14110E" />

        {/* Eyebrows */}
        <Path d="M37 34 Q42 31 46 34" stroke="#14110E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <Path d="M54 34 Q58 31 63 34" stroke="#14110E" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Eyes */}
        <Circle cx="42" cy="39" r="2.5" fill="#14110E" />
        <Circle cx="58" cy="39" r="2.5" fill="#14110E" />
        <Circle cx="43" cy="38" r="0.8" fill="#FFFFFF" />
        <Circle cx="59" cy="38" r="0.8" fill="#FFFFFF" />

        {/* Nose */}
        <Path d="M48 42 Q50 47 52 42" stroke="#8A4A24" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Mustache */}
        <Path d="M43 50 Q50 48 57 50 Q50 53 43 50 Z" fill="#14110E" />

        {/* Warm White Smile */}
        <Path d="M44 52 Q50 59 56 52 Z" fill="#FFFFFF" />
        <Path d="M44 52 Q50 59 56 52" stroke="#14110E" strokeWidth="1" fill="none" />

        {/* Trimmed Beard */}
        <Path
          d="M35 45 C35 59 44 63 50 63 C56 63 65 59 65 45 C64 54 56 59 50 59 C44 59 36 54 35 45 Z"
          fill="#14110E"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
