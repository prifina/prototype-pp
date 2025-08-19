import { Button } from "@/components/ui/button";

interface SuggestedQuestionsProps {
  onQuestionSelect: (question: string) => void;
  questions: string[];
}

const SuggestedQuestions = ({
  onQuestionSelect,
  questions,
}: SuggestedQuestionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8 justify-center">
      {questions.map((question, index) => (
        <Button
          key={index}
          variant="outline"
          className="text-left h-auto p-4 max-w-sm border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          onClick={() => onQuestionSelect(question)}
        >
          <span className="text-sm text-gray-700 leading-relaxed">
            {question}
          </span>
        </Button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;
