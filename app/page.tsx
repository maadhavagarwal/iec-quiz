"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { quizQuestions, Question } from "../lib/quizData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ArrowRight, RotateCcw, Sparkles, ExternalLink } from "lucide-react";
import confetti from 'canvas-confetti';

// Helper to shuffle and pick N items
function getRandomQuestions(n: number): Question[] {
  const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

export default function Home() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  
  const [result, setResult] = useState({
    department1: "",
    department2: "",
  });
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  
  // Registration form states
  const [hasRegistered, setHasRegistered] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: "",
    email: "",
    phone: ""
  });
  
  // Question transition states
  const [isQuestionTransitioning, setIsQuestionTransitioning] = useState(false);
  const [questionFadeClass, setQuestionFadeClass] = useState("");
  
  // Enhanced reveal states
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [showDepartment, setShowDepartment] = useState(false);
  const [particleState, setParticleState] = useState("normal");

  // Confetti animation functions - optimized for mobile
  const triggerConfetti = () => {
    // Check if mobile device
    const isMobile = window.innerWidth < 768;
    // IEC-themed confetti colors
    const colors = ['#ff7f2e', '#28359e', '#ffffff', '#fbbf24', '#34d399'];
    
    // Main burst - fewer particles on mobile
    confetti({
      particleCount: isMobile ? 50 : 100,
      spread: isMobile ? 50 : 70,
      origin: { y: 0.6 },
      colors: colors,
      scalar: isMobile ? 0.8 : 1.2,
      gravity: 1,
      drift: 0,
      ticks: isMobile ? 200 : 300
    });

    // Side bursts - only on desktop
    if (!isMobile) {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: colors
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: colors
        });
      }, 150);

      // Final cascade - fewer particles on mobile
      setTimeout(() => {
        confetti({
          particleCount: isMobile ? 15 : 30,
          spread: isMobile ? 90 : 120,
          origin: { y: 0.4 },
          colors: colors,
          scalar: isMobile ? 0.6 : 0.8
        });
      }, 300);
    }
  };

  useEffect(() => {
    setIsClient(true);
    setActiveQuestions(getRandomQuestions(10));
    
    // Set random starting positions for particles
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle) => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      (particle as HTMLElement).style.setProperty('--start-x', `${x - window.innerWidth/2}px`);
      (particle as HTMLElement).style.setProperty('--start-y', `${y - window.innerHeight/2}px`);
    });
  }, []);

  // Cycle through analysis messages
  useEffect(() => {
    if (isLoading) {
      const analysisMessages = [
        "🔍 Analyzing your responses...",
        "🧠 Processing your preferences...",
        "✨ Matching you with departments...",
        "🎯 Finding your perfect fit...",
        "⚡ Calculating compatibility scores...",
        "🚀 Almost there...",
      ];
      
      let messageIndex = 0;
      setAnalysisMessage(analysisMessages[0]);
      
      const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % analysisMessages.length;
        setAnalysisMessage(analysisMessages[messageIndex]);
      }, 1200); // Change message every 1.2 seconds

      return () => clearInterval(messageInterval);
    }
  }, [isLoading]);

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!emailRegex.test(registrationForm.email)) {
      alert("Please enter a valid email address.");
      return;
    }
    
    if (!phoneRegex.test(registrationForm.phone)) {
      alert("Please enter exactly 10 digits for the phone number.");
      return;
    }

    if (registrationForm.name && registrationForm.email && registrationForm.phone) {
      setHasRegistered(true);
    }
  };

  const handleAnswer = (
    weights: { [key: string]: number },
    answerText: string
  ) => {
    // Start the fade out animation
    setIsQuestionTransitioning(true);
    setQuestionFadeClass("question-fade-out");

    // Wait for fade out to complete, then update question and fade in
    setTimeout(() => {
      const newScores = { ...scores };
      setSelectedAnswers([...selectedAnswers, answerText]);

      for (const department in weights) {
        newScores[department] =
          (newScores[department] || 0) + weights[department];
      }

      setScores(newScores);

      if (currentQuestion < activeQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        
        // Start fade in animation for the new question
        setQuestionFadeClass("question-fade-in");
        
        // Reset transition state after fade in completes
        setTimeout(() => {
          setIsQuestionTransitioning(false);
          setQuestionFadeClass("");
        }, 400); // Duration of fade-in animation
      } else {
        // Immediately show the result screen with loading state
        setShowResult(true);
        setIsLoading(true);
        setParticleState("gathering");
        setIsQuestionTransitioning(false);
        setQuestionFadeClass("");
        calculateResult(newScores);
      }
    }, 300); // Duration of fade-out animation
  };

  const calculateResult = async (finalScores: { [key: string]: number }) => {
    if (Object.keys(finalScores).length === 0) {
      setResult({
        department1: "No clear result",
        department2: "",
      });
      setIsLoading(false);
      setParticleState("normal");
      return;
    }

    const sortedScores = Object.entries(finalScores).sort(
      (a, b) => b[1] - a[1]
    );
    
    const bestDepartment1 = sortedScores.length > 0 ? sortedScores[0][0] : "None";
    const bestDepartment2 = sortedScores.length > 1 ? sortedScores[1][0] : "";

    try {
      // Log to Google Sheets behind the scenes
      await fetch("/api/log-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...registrationForm,
          departments: [bestDepartment1, bestDepartment2].filter(Boolean),
        }),
      });
    } catch (error) {
      console.error("Failed to log to sheets", error);
    }

    // Reveal the department names after analysis
    setTimeout(() => {
      setResult({
        department1: bestDepartment1,
        department2: bestDepartment2,
      });
      setIsLoading(false);
      setParticleState("scattering");
      setShowDepartment(true);
      
      // Trigger confetti animation when result is revealed
      setTimeout(() => {
        triggerConfetti();
      }, 200); // Small delay to let the result render first
    }, 2500); // Let analysis run for 2.5 seconds
  };

  const restartQuiz = () => {
    setActiveQuestions(getRandomQuestions(10));
    setCurrentQuestion(0);
    setScores({});
    setSelectedAnswers([]);
    setShowResult(false);
    setResult({ department1: "", department2: "" });
    setIsLoading(false);
    setShowDepartment(false);
    setParticleState("normal");
    setHasRegistered(false);
    setRegistrationForm({ name: "", email: "", phone: "" });
    setIsQuestionTransitioning(false);
    setQuestionFadeClass("");
  };

  const progressPercentage = activeQuestions.length > 0 
    ? (currentQuestion / activeQuestions.length) * 100 
    : 0;

  return (
    <div className={`min-h-[100svh] swirling-gradient-bg ${isLoading ? 'analyzing' : ''}`}>

      {isClient && (
        <div className={`particle-container ${particleState}`}>
          {Array.from({ length: window.innerWidth < 768 ? 200 : 500 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="content-layer quiz-main-container flex items-center justify-center min-h-screen py-2 px-2 sm:py-4 sm:px-4">
        <div className="quiz-content-wrapper max-w-4xl w-full mx-auto">
          {/* Header Section - optimized for mobile */}
          <div className="text-center mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 animate-fade-in-up">
              {/* IEC Department Classifier */}
            </h1>
            <div className="flex justify-center mb-3 sm:mb-4">
              <Image 
                src="/iec-logo.svg" 
                alt="IEC Logo" 
                className="mb-2 sm:mb-4 w-1/2 sm:w-1/3 mx-auto" 
                width={90}
                height={50}
              />
            </div>
            <p className="text-xs sm:text-sm md:text-lg text-white/80 max-w-2xl mx-auto animate-slide-in-left px-3 leading-relaxed">
              Discover your perfect department match through our intelligent
              assessment system
            </p>
          </div>

          {!hasRegistered ? (
            <Card className="quiz-card shadow-lg mx-4">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Register to Start</h2>
                  <p className="text-sm text-gray-600">Enter your details to discover your ideal department match.</p>
                </div>
                
                <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</label>
                    <Input
                      id="name"
                      required
                      value={registrationForm.name}
                      onChange={(e) => setRegistrationForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full bg-gray-800 text-white border-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={registrationForm.email}
                      onChange={(e) => setRegistrationForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="w-full bg-gray-800 text-white border-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number *</label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      maxLength={10}
                      pattern="^\d{10}$"
                      title="Please enter exactly 10 digits"
                      value={registrationForm.phone}
                      onChange={(e) => {
                        // Only allow numbers to be typed
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) {
                          setRegistrationForm(prev => ({ ...prev, phone: val }));
                        }
                      }}
                      placeholder="9876543210"
                      className="w-full bg-gray-800 text-white border-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2">
                    Start Quiz <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress Section */}
              {!showResult && activeQuestions.length > 0 && (
                <div className="quiz-progress-container mb-2">
                  <div className="quiz-progress-labels flex justify-between text-sm">
                    <span className="quiz-progress-label">
                      Question {currentQuestion + 1} of {activeQuestions.length}
                    </span>
                    <span className="quiz-progress-label">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="quiz-progress-bar h-1">
                    <Progress value={progressPercentage} className="progress-fill h-1" />
                  </div>
                </div>
              )}

              {/* Main Quiz Card */}
              <Card className="quiz-card shadow-lg">
                <CardContent className="p-0">
                  {!showResult && activeQuestions.length > 0 && (
                    <div className={`quiz-question-section py-3 px-4 ${questionFadeClass} ${isQuestionTransitioning ? 'question-transitioning' : ''}`}>
                      <h2 className="quiz-question-title text-lg font-medium">
                        {activeQuestions[currentQuestion].question}
                      </h2>
                    </div>
                  )}

                  {showResult ? (
                    <div className="quiz-results-section p-4">
                      {isLoading ? (
                        <div className="quiz-loading analyzing flex flex-col items-center justify-center py-3 sm:py-4">
                          <div className="relative">
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 animate-spin" />
                            <div className="absolute inset-0 bg-gradient-radial from-orange-400/20 to-transparent rounded-full animate-ping" />
                          </div>
                          <p className="quiz-loading-text text-xs sm:text-sm mt-2">{analysisMessage}</p>
                        </div>
                      ) : (
                        <>
                          <div className="quiz-results-badge flex items-center gap-1 text-xs">
                            <Sparkles className="w-3 h-3 text-orange-400" />
                            <span className="quiz-results-badge-text">Your Top Matches</span>
                          </div>

                          {showDepartment && (
                            <div className="mt-4 dramatic-reveal flex flex-col gap-3 items-center">
                              <div className="bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-blue-500/20 rounded-xl p-4 w-full">
                                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-1 font-semibold text-center">Top Match</h3>
                                <h2 className="quiz-results-department text-2xl md:text-3xl font-bold text-center text-blue-700">
                                  {result.department1}
                                </h2>
                              </div>
                              
                              {result.department2 && (
                                <div className="bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-xl p-4 w-full">
                                  <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold text-center">Second Match</h3>
                                  <h2 className="text-xl md:text-2xl font-bold text-center text-gray-700">
                                    {result.department2}
                                  </h2>
                                </div>
                              )}
                            </div>
                          )}

                          {showDepartment && (
                            <div className="flex flex-col gap-3 mt-6">
                              <a
                                href="https://docs.google.com/forms/d/e/1FAIpQLSfnARpDBxadEtTac59wKLipd_57upfdZfvdNyNfFhIOnr8o4w/viewform"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                              >
                                <Button
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 shadow-lg transform transition hover:-translate-y-1"
                                >
                                  Register Now <ExternalLink className="w-5 h-5 ml-2" />
                                </Button>
                              </a>
                              
                              <Button
                                onClick={restartQuiz}
                                className="quiz-results-restart-button delayed-reveal text-sm py-2"
                                variant="outline"
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Take Quiz Again
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    activeQuestions.length > 0 && (
                      <div className={`quiz-answers-section p-2 grid ${isQuestionTransitioning ? 'question-transitioning' : ''}`}>
                        {activeQuestions[currentQuestion].answers.map((answer, index) => (
                          <button
                            key={index}
                            onClick={() => !isQuestionTransitioning && handleAnswer(answer.weights, answer.text)}
                            disabled={isQuestionTransitioning}
                            className="quiz-answer-option flex items-center justify-between py-3 px-4 sm:py-2 sm:px-3 hover:bg-gray-100/10 active:bg-gray-100/15 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed relative"
                          >
                            <span className="quiz-answer-text text-sm pr-8 text-left">{answer.text}</span>
                            <ArrowRight className="quiz-answer-arrow w-4 h-4 absolute right-3" />
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Footer */}
          <div className="text-center text-white/60 text-xs mt-4">
            Discover your perfect department match
          </div>
        </div>
      </div>
    </div>
  );
}
