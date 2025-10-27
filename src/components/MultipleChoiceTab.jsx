import { useEffect, useMemo, useState } from 'react';
import { shuffle } from '../utils/shuffle.js';

const initialQuizState = {
  status: 'idle',
  questions: [],
  index: 0,
  score: 0,
  reveal: false,
  selected: null
};

function buildQuestions(items, questionTotal, optionsPerQuestion) {
  const order = shuffle(items.map((_, index) => index)).slice(0, questionTotal);
  return order.map((itemIndex, idx) => {
    const item = items[itemIndex];
    const distractors = shuffle(
      items.filter((_, index) => index !== itemIndex)
    ).slice(0, optionsPerQuestion - 1);
    const options = shuffle([item, ...distractors]).map((option, optionIndex) => ({
      id: `${idx}-${optionIndex}`,
      label: option.def,
      isCorrect: option.def === item.def
    }));
    return {
      id: item.id ?? itemIndex,
      prompt: item.term,
      correct: item.def,
      options
    };
  });
}

export function MultipleChoiceTab({ items, isActive }) {
  const [questionCount, setQuestionCount] = useState(5);
  const [optionsCount, setOptionsCount] = useState(4);
  const [quiz, setQuiz] = useState(initialQuizState);

  const maxQuestions = items.length ? Math.min(50, items.length) : 3;
  const questionOptions = useMemo(() => {
    const values = [];
    for (let i = 3; i <= maxQuestions; i += 1) {
      values.push(i);
    }
    if (items.length > 0 && items.length < 3 && !values.includes(items.length)) {
      values.push(items.length);
    }
    return values.length ? values : [1];
  }, [items.length, maxQuestions]);

  useEffect(() => {
    if (!items.length) {
      setQuiz(initialQuizState);
      return;
    }
    setQuestionCount((prev) => {
      const fallback = items.length >= 3 ? 3 : items.length;
      if (!prev) {
        return fallback || 3;
      }
      return Math.min(prev, Math.max(fallback, Math.min(50, items.length)));
    });
    setOptionsCount((prev) => {
      if (items.length < 2) {
        return Math.min(items.length, prev);
      }
      return Math.min(Math.max(prev, 2), items.length);
    });
  }, [items.length]);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    if (quiz.status === 'running' && quiz.index >= quiz.questions.length) {
      setQuiz((prev) => ({ ...prev, status: 'finished' }));
    }
  }, [isActive, quiz]);

  const startQuiz = () => {
    if (items.length < 2) {
      alert('Add at least two items to start a quiz.');
      return;
    }
    const total = Math.max(1, Math.min(questionCount || items.length, items.length));
    const perQuestion = Math.max(2, Math.min(optionsCount || 4, items.length));
    const questions = buildQuestions(items, total, perQuestion);
    setQuiz({
      status: 'running',
      questions,
      index: 0,
      score: 0,
      reveal: false,
      selected: null
    });
  };

  const handleSelect = (value) => {
    setQuiz((prev) => ({
      ...prev,
      selected: value
    }));
  };

  const handleReveal = () => {
    setQuiz((prev) => {
      if (prev.status !== 'running') {
        return prev;
      }
      return { ...prev, reveal: true };
    });
  };

  const handleNext = () => {
    setQuiz((prev) => {
      if (prev.status !== 'running') {
        return prev;
      }
      const currentQuestion = prev.questions[prev.index];
      if (!prev.reveal) {
        return { ...prev, reveal: true };
      }
      const isCorrect = prev.selected === currentQuestion.correct;
      const nextScore = prev.score + (isCorrect ? 1 : 0);
      const nextIndex = prev.index + 1;
      if (nextIndex >= prev.questions.length) {
        return {
          ...prev,
          score: nextScore,
          status: 'finished'
        };
      }
      return {
        ...prev,
        score: nextScore,
        index: nextIndex,
        selected: null,
        reveal: false
      };
    });
  };

  const handleReset = () => {
    setQuiz(initialQuizState);
  };

  const handleRestart = () => {
    startQuiz();
  };

  const currentQuestion =
    quiz.status === 'running' ? quiz.questions[quiz.index] : undefined;

  return (
    <section
      id="tab-mc"
      className={`tab-panel stack ${isActive ? 'active' : ''}`}
      role="tabpanel"
      aria-label="Multiple Choice"
      hidden={!isActive}
    >
      {!items.length ? (
        <p className="empty-state">Add a few study terms to practice multiple choice.</p>
      ) : (
        <>
          <div className="card inline" style={{ justifyContent: 'space-between', gap: '12px' }}>
            <div className="inline" style={{ gap: '12px', flexWrap: 'wrap' }}>
              <label>
                Questions
                <select
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                >
                  {questionOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Options per question
                <select
                  value={optionsCount}
                  onChange={(event) => setOptionsCount(Number(event.target.value))}
                >
                  {[2, 3, 4, 5].map((value) => (
                    <option key={value} value={value} disabled={value > items.length}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="inline">
              <button type="button" className="button" onClick={startQuiz}>
                Start
              </button>
              <button type="button" className="button ghost" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>
          <div className="stack">
            {quiz.status === 'idle' && (
              <div className="notice">
                Press Start to generate randomized multiple-choice questions from your set.
              </div>
            )}
            {quiz.status === 'running' && currentQuestion && (
              <div className="card question-card">
                <div className="tab-summary">
                  <div>
                    <strong>
                      Q{quiz.index + 1}/{quiz.questions.length}
                    </strong>{' '}
                    <span className="muted">Match the definition</span>
                  </div>
                  <span className="pill">Score {quiz.score}</span>
                </div>
                <h2 className="title" style={{ fontSize: '1.4rem' }}>
                  {currentQuestion.prompt}
                </h2>
                <div className="options">
                  {currentQuestion.options.map((option) => {
                    const isSelected = quiz.selected === option.label;
                    const optionClass =
                      quiz.reveal && option.isCorrect
                        ? 'correct'
                        : quiz.reveal && isSelected && !option.isCorrect
                          ? 'incorrect'
                          : '';
                    return (
                      <label key={option.id} className={optionClass}>
                        <input
                          type="radio"
                          name="mc-option"
                          value={option.label}
                          checked={isSelected}
                          onChange={(event) => handleSelect(event.target.value)}
                          disabled={quiz.reveal}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="inline" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="button ghost" onClick={handleReveal}>
                    Reveal
                  </button>
                  <button type="button" className="button" onClick={handleNext}>
                    {quiz.index + 1 === quiz.questions.length ? 'Finish' : 'Next'}
                  </button>
                </div>
              </div>
            )}
            {quiz.status === 'finished' && (
              <div className="card center stack">
                <div className="title" style={{ fontSize: '1.6rem' }}>
                  Quiz Complete
                </div>
                <div className="subtitle" style={{ textAlign: 'center' }}>
                  Score:{' '}
                  <strong>
                    {quiz.score} / {quiz.questions.length}
                  </strong>
                </div>
                <div className="inline" style={{ justifyContent: 'center' }}>
                  <button type="button" className="button" onClick={handleRestart}>
                    Try Again
                  </button>
                  <button type="button" className="button ghost" onClick={handleReset}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

