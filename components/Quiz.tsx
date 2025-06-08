import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2 } from 'lucide-react';
import { QuizLoadingAnimation } from './QuizLoadingAnimation';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizProps {
  onQuizComplete: (score: number, total: number) => void;
}

const topics = [
  'Algebra',
  'Calculus',
  'Geometry',
  'Statistics',
  'Linear Algebra',
  'Differential Equations',
];

const questionTypes = [
  'Multiple Choice',
  'True/False',
  'Fill in the Blank',
  'Problem Solving',
];

export function Quiz({ onQuizComplete }: QuizProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const generateQuiz = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: selectedTopic,
          questionType: selectedType,
          numberOfQuestions: 5,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      setQuestions(data.questions);
      setUserAnswers(new Array(data.questions.length).fill(-1));
    } catch (error) {
      console.error('Error generating quiz:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return score + (userAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {!questions.length ? (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Create Your Quiz</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Topic</label>
              <Select onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Question Type</label>
              <Select onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose question type" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generateQuiz}
              disabled={!selectedTopic || !selectedType || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                'Generate Quiz'
              )}
            </Button>
          </div>
          {isGenerating && <QuizLoadingAnimation />}
        </Card>
      ) : (
        <div className="space-y-6">
          {!showResults ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Question {currentQuestion + 1} of {questions.length}
                </h3>
                <div className="text-sm text-gray-500">
                  Score: {calculateScore()}/{currentQuestion + 1}
                </div>
              </div>
              <Card className="p-6">
                <h4 className="text-xl font-semibold mb-4">
                  {questions[currentQuestion].question}
                </h4>
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, index) => (
                    <Button
                      key={index}
                      variant={userAnswers[currentQuestion] === index ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleAnswer(index)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </Card>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(prev => prev - 1)}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => {
                    if (currentQuestion === questions.length - 1) {
                      setShowResults(true);
                      onQuizComplete(calculateScore(), questions.length);
                    } else {
                      setCurrentQuestion(prev => prev + 1);
                    }
                  }}
                >
                  {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
            </>
          ) : (
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4">Quiz Results</h3>
              <p className="text-lg mb-4">
                Your score: {calculateScore()} out of {questions.length}
              </p>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={index} className="border-t pt-4">
                    <p className="font-medium mb-2">{question.question}</p>
                    <p className="text-sm text-gray-600">
                      Your answer: {question.options[userAnswers[index]]}
                    </p>
                    <p className="text-sm text-gray-600">
                      Correct answer: {question.options[question.correctAnswer]}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Explanation: {question.explanation}
                    </p>
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => {
                  setQuestions([]);
                  setCurrentQuestion(0);
                  setUserAnswers([]);
                  setShowResults(false);
                }}
                className="mt-6"
              >
                Start New Quiz
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 