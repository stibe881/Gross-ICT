import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
      {/* Moving Gradient Blobs */}
      <motion.div 
        animate={{ 
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        style={{ willChange: "transform" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[80px]"
      />
      
      <motion.div 
        animate={{ 
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.5, 1],
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        style={{ willChange: "transform" }}
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-500/5 rounded-full blur-[100px]"
      />

      <motion.div 
        animate={{ 
          x: [0, 50, 0],
          y: [0, -50, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ 
          duration: 18, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
        style={{ willChange: "transform" }}
        className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-purple-500/5 rounded-full blur-[60px]"
      />
    </div>
  );
}
