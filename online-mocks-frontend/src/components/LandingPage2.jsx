import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-indigo-700 to-blue-600 flex flex-col items-center justify-center p-6">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1.5 }}
        >
          {/* Geometric shapes */}
          <svg
            viewBox="0 0 1440 900"
            className="absolute w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Triangles */}
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.polygon
                key={`triangle-${i}`}
                points="0,0 60,100 120,0"
                fill="rgba(255, 255, 255, 0.3)"
                className="origin-center"
                initial={{
                  x: Math.random() * 1440,
                  y: Math.random() * 900,
                  rotate: Math.random() * 360,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: [
                    Math.random() * 900,
                    Math.random() * 900,
                    Math.random() * 900,
                  ],
                  x: [
                    Math.random() * 1440,
                    Math.random() * 1440,
                    Math.random() * 1440,
                  ],
                  rotate: [0, 180, 360],
                  scale: [
                    Math.random() * 0.5 + 0.5,
                    Math.random() * 0.7 + 0.3,
                    Math.random() * 0.5 + 0.5,
                  ],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: Math.random() * 20 + 15,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Circles */}
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.circle
                key={`circle-${i}`}
                r="40"
                fill="rgba(176, 196, 255, 0.2)"
                initial={{
                  cx: Math.random() * 1440,
                  cy: Math.random() * 900,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  cx: [
                    Math.random() * 1440,
                    Math.random() * 1440,
                    Math.random() * 1440,
                  ],
                  cy: [
                    Math.random() * 900,
                    Math.random() * 900,
                    Math.random() * 900,
                  ],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: Math.random() * 20 + 10,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Hexagons */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.polygon
                key={`hexagon-${i}`}
                points="50,0 100,25 100,75 50,100 0,75 0,25"
                fill="rgba(200, 210, 255, 0.15)"
                initial={{
                  x: Math.random() * 1440,
                  y: Math.random() * 900,
                  scale: Math.random() + 0.5,
                  rotate: Math.random() * 360,
                }}
                animate={{
                  rotate: [0, 180, 360],
                  scale: [
                    Math.random() + 0.5,
                    Math.random() + 1,
                    Math.random() + 0.5,
                  ],
                  x: [
                    Math.random() * 1440,
                    Math.random() * 1440,
                    Math.random() * 1440,
                  ],
                  y: [
                    Math.random() * 900,
                    Math.random() * 900,
                    Math.random() * 900,
                  ],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: Math.random() * 25 + 20,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Squares */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.rect
                key={`square-${i}`}
                width="80"
                height="80"
                fill="rgba(150, 170, 255, 0.15)"
                initial={{
                  x: Math.random() * 1440,
                  y: Math.random() * 900,
                  rotate: Math.random() * 360,
                  scale: Math.random() * 0.6 + 0.4,
                }}
                animate={{
                  rotate: [0, 90, 180, 270, 360],
                  scale: [
                    Math.random() * 0.6 + 0.4,
                    Math.random() * 0.8 + 0.6,
                    Math.random() * 0.6 + 0.4,
                  ],
                  x: [
                    Math.random() * 1440,
                    Math.random() * 1440,
                    Math.random() * 1440,
                  ],
                  y: [
                    Math.random() * 900,
                    Math.random() * 900,
                    Math.random() * 900,
                  ],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: Math.random() * 25 + 15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </svg>
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        className="max-w-4xl w-full text-center space-y-12 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="space-y-4">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Online Mock Placements
          </motion.h1>
          <motion.p
            className="text-xl text-gray-200 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Prepare for your career with realistic interview simulations
          </motion.p>
        </div>

        <motion.div
          className="flex flex-col sm:flex-row gap-5 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <Link to="/hr-login">
            <button className="h-14 px-8 text-lg font-medium rounded-md bg-indigo-500 text-white shadow-lg hover:bg-indigo-400 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50">
              HR Login
            </button>
          </Link>
          <Link to="/volunteer-login">
            <button className="h-14 px-8 text-lg font-medium rounded-md border-2 border-indigo-300 text-white bg-transparent hover:bg-indigo-800/30 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50">
              Volunteer Login
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
