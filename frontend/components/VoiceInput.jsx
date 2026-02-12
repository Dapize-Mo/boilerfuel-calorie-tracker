import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * VoiceInput - Voice recognition component for logging meals
 * Uses Web Speech API for voice-to-text
 * @param {function} onResult - Callback with transcribed text
 * @param {string} placeholder - Placeholder text
 */
export default function VoiceInput({ onResult, placeholder = 'Try saying: "2 scrambled eggs and toast"' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          setTranscript(transcriptText);

          // If final result, send to callback
          if (event.results[current].isFinal) {
            onResult(transcriptText);
            setTranscript('');
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-600 dark:text-yellow-400 text-sm">
        <p className="font-semibold mb-1">🎤 Voice input not supported</p>
        <p>Your browser doesn't support voice recognition. Try Chrome or Edge.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Button */}
      <div className="flex flex-col items-center gap-4">
        <motion.button
          onClick={isListening ? stopListening : startListening}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gradient-to-br from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600'
          } shadow-lg`}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="listening"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-white"
              >
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="4" height="12" rx="1" />
                  <rect x="14" y="6" width="4" height="12" rx="1" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-white"
              >
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Listening pulse effect */}
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.75 }}
              />
            </>
          )}
        </motion.button>

        <div className="text-center">
          <p className="text-sm font-semibold text-theme-text-primary">
            {isListening ? 'Listening...' : 'Tap to speak'}
          </p>
          <p className="text-xs text-theme-text-tertiary mt-1">
            {placeholder}
          </p>
        </div>
      </div>

      {/* Live Transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-xl"
          >
            <p className="text-xs text-theme-text-tertiary mb-1">You said:</p>
            <p className="text-sm font-medium text-theme-text-primary">
              {transcript}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Usage Tips */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-600 dark:text-blue-400">
        <p className="font-semibold mb-1">💡 Tips for better recognition:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Speak clearly and at a normal pace</li>
          <li>Mention quantity and food name (e.g., "3 chicken tenders")</li>
          <li>You can say multiple items in one go</li>
        </ul>
      </div>
    </div>
  );
}
