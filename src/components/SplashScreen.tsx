import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import WalkingPerson from './WalkingPerson';

const COLORS = [
  '#E76F51', // Terracotta
  '#2A9D8F', // Teal
  '#E9C46A', // Yellow
  '#F4A261', // Orange
  '#264653', // Dark Blue
  '#8AB17D', // Sage
  '#5A5A40', // Olive
];

interface Person {
  id: number;
  y: number;
  scale: number;
  speed: number;
  color: string;
  delay: number;
}

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    // Generate a wave of people moving right to left
    const initialPeople = Array.from({ length: 45 }).map((_, i) => {
      return {
        id: i,
        y: 5 + Math.random() * 85, // Vertical spread (5% to 90%)
        scale: 0.4 + Math.random() * 0.8, // Depth perception
        speed: 2 + Math.random() * 3, // Fast walk! 2-5 seconds to cross
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 1.5, // Start between 0 and 1.5s
      };
    });
    
    // Sort by scale so larger (closer) people render on top
    initialPeople.sort((a, b) => a.scale - b.scale);
    
    setPeople(initialPeople);

    // End splash screen after 3.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-earthy-cream overflow-hidden flex items-center justify-center"
    >
      {/* Central Logo / Text */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        className="relative z-50 text-center bg-earthy-cream/60 backdrop-blur-md py-8 px-16 rounded-3xl border border-white/20 shadow-2xl"
      >
        <h1 className="font-fraunces text-6xl text-earthy-dark mb-3 drop-shadow-sm">SkillShare</h1>
        <p className="font-jakarta text-earthy-dark/70 tracking-[0.2em] uppercase text-sm font-bold">
          Join the movement
        </p>
      </motion.div>

      {/* The Crowd Walking Right to Left */}
      {people.map((person) => {
        return (
          <motion.div
            key={person.id}
            initial={{ x: '120vw' }}
            animate={{ x: '-20vw' }}
            transition={{
              duration: person.speed,
              ease: "linear",
              delay: person.delay
            }}
            style={{
              position: 'absolute',
              left: 0,
              top: `${person.y}%`,
              zIndex: Math.floor(person.scale * 100),
              scale: person.scale,
              opacity: 0.8 + (person.scale * 0.2),
              filter: `blur(${Math.max(0, (1.2 - person.scale) * 3)}px)`
            }}
            className="flex flex-col items-center"
          >
            <WalkingPerson 
              id={`splash-${person.id}`}
              color={person.color}
              speed={person.speed}
              direction={-1}
              className="w-16 h-32"
            />
            <div className="w-12 h-2 bg-black/15 rounded-full mt-[-10px] blur-[3px]"></div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
