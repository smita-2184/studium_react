import { Quiz } from '../components/Quiz';

export default function QuizPage() {
  const handleQuizComplete = (score: number, total: number) => {
    console.log(`Quiz completed! Score: ${score}/${total}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Math Quiz Generator</h1>
        <Quiz onQuizComplete={handleQuizComplete} />
      </div>
    </div>
  );
} 