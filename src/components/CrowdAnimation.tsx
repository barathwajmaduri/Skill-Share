import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WalkingPerson from './WalkingPerson';

const SKILLS = [
  'Java', 'Python', 'React', 'Design', 'Music', 
  'Writing', 'Photography', 'Node.js', 'AI/ML', 
  'Data Science', 'Marketing', 'Sales', 'Cooking',
  'Pottery', 'Yoga', 'Spanish', 'Guitar'
];

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
  x: number;
  y: number; // Vertical position (0-100%)
  scale: number; // Depth (0.5-1.2)
  speed: number; // Movement speed
  color: string;
  direction: 1 | -1; // 1 for right, -1 for left
  delay: number;
}

export default function CrowdAnimation() {
  const [people, setPeople] = useState<Person[]>([]);
  const [bubbles, setBubbles] = useState<{id: number, personId: number, text: string}[]>([]);

  // Initialize crowd
  useEffect(() => {
    const initialPeople: Person[] = Array.from({ length: 25 }).map((_, i) => {
      return {
        id: i,
        x: Math.random() * 100, // Start at random horizontal position
        y: 10 + Math.random() * 80, // Vertical spread
        scale: 0.5 + Math.random() * 0.7, // Depth perception
        speed: 15 + Math.random() * 25, // Duration in seconds to cross screen
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        direction: Math.random() > 0.5 ? 1 : -1,
        delay: Math.random() * -20 // Negative delay to start mid-animation
      };
    });
    setPeople(initialPeople);
  }, []);

  // Randomly generate speech bubbles
  useEffect(() => {
    const interval = setInterval(() => {
      if (people.length === 0) return;
      
      const randomPerson = people[Math.floor(Math.random() * people.length)];
      const randomSkill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
      const newBubble = {
        id: Date.now(),
        personId: randomPerson.id,
        text: randomSkill
      };

      setBubbles(prev => [...prev.slice(-4), newBubble]); // Keep max 5 bubbles

      // Remove bubble after 3 seconds
      setTimeout(() => {
        setBubbles(prev => prev.filter(b => b.id !== newBubble.id));
      }, 3000);

    }, 1500); // New bubble every 1.5s

    return () => clearInterval(interval);
  }, [people]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-earthy-cream/20 pointer-events-none">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-earthy-dark/10 z-0"></div>

      {people.map((person) => {
        // Find active bubble for this person
        const activeBubble = bubbles.find(b => b.personId === person.id);

        return (
          <motion.div
            key={person.id}
            initial={{ x: person.direction === 1 ? '-20vw' : '120vw' }}
            animate={{ x: person.direction === 1 ? '120vw' : '-20vw' }}
            transition={{
              duration: person.speed,
              repeat: Infinity,
              ease: "linear",
              delay: person.delay // Start at different times/positions
            }}
            style={{
              position: 'absolute',
              left: 0,
              top: `${person.y}%`,
              zIndex: Math.floor(person.scale * 100), // Higher scale = higher z-index (closer)
              scale: person.scale,
              opacity: 0.7 + (person.scale * 0.3), // Closer items are more opaque
              filter: `blur(${Math.max(0, (1.2 - person.scale) * 2)}px)` // Further items are blurrier
            }}
            className="flex flex-col items-center"
          >
            {/* Speech Bubble */}
            <AnimatePresence>
              {activeBubble && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: -20 }}
                  exit={{ opacity: 0, scale: 0, y: -10 }}
                  className="absolute -top-12 bg-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-100 whitespace-nowrap z-50"
                >
                  <span className="text-xs font-bold text-slate-700">{activeBubble.text}</span>
                  {/* Bubble Tail */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-slate-100"></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Person Animation */}
            <WalkingPerson 
              id={`crowd-${person.id}`}
              color={person.color}
              speed={person.speed}
              direction={person.direction}
              className="w-12 h-24"
            />
            
            {/* Simple Body/Shadow */}
            <div className="w-10 h-1.5 bg-black/10 rounded-full mt-[-5px] blur-[2px]"></div>
          </motion.div>
        );
      })}
    </div>
  );
}
