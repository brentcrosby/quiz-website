import { useEffect, useState } from 'react';
import { buildPracticeQuestions, reshuffleQuestion } from '../utils/practiceQuestions.js';

export function PracticeQuickQuizTab({ items, isActive }) {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [total, setTotal] = useState(0);
  const [mastered, setMastered] = useState(0);

  useEffect(() => {
    const prepared = buildPracticeQuestions(items);
    setQueue(prepared);
    setTotal(prepared.length);
    setMastered(0);
    setSelected(null);
    setFeedback(null);
  }, [items]);

  const currentQuestion = queue[0];
  const remaining = queue.length;
  const nextNumber = Math.min(mastered + 1, total || 1);

  const handleSelect = (value) => {
    if (feedback) {
      return;
    }
    setSelected(value);
  };

  const handleSubmit = () => {
    if (!currentQuestion) {
      return;
    }
    if (!selected) {
      alert('Select an answer before submitting.');
      return;
    }
    const isCorrect = selected === currentQuestion.correctAnswer;
    setFeedback({
      status: isCorrect ? 'correct' : 'incorrect',
      correctAnswer: currentQuestion.correctAnswer,
      selected
    });
    if (isCorrect) {
      setMastered((prev) => prev + 1);
    }
  };

  const handleContinue = () => {
    if (!currentQuestion) {
      return;
    }
    setQueue((prev) => {
      if (!prev.length) {
        return prev;
      }
      const [first, ...rest] = prev;
      if (feedback?.status === 'incorrect') {
        return [...rest, reshuffleQuestion(first)];
      }
      return rest;
    });
    setSelected(null);
    setFeedback(null);
  };

  const handleRestart = () => {
    const prepared = buildPracticeQuestions(items);
    setQueue(prepared);
    setTotal(prepared.length);
    setSelected(null);
    setFeedback(null);
    setMastered(0);
  };

  return (
    <section
      id="tab-practice-quick"
      className={`tab-panel stack ${isActive ? 'active' : ''}`}
      role="tabpanel"
      aria-label="Quick Quiz"
      hidden={!isActive}
    >
      {!total ? (
        <p className="empty-state">Create a practice set to start the quick quiz.</p>
      ) : (
        <div className="stack">
          <div className="card inline" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div className="inline" style={{ gap: '12px', flexWrap: 'wrap' }}>
              <span className="pill">Mastered {mastered} / {total}</span>
              <span className="pill">Remaining {remaining}</span>
            </div>
            <button type="button" className="button ghost" onClick={handleRestart}>
              Restart
            </button>
          </div>
          {currentQuestion ? (
            <div className="card question-card">
              <div className="tab-summary">
                <div>
                  <strong>Question {nextNumber}</strong>
                  <span className="muted small" style={{ marginLeft: '8px' }}>
                    {currentQuestion.kind === 'trueFalse' ? 'True/False' : 'Multiple choice'}
                  </span>
                </div>
              </div>
              <h2 className="title" style={{ fontSize: '1.3rem' }}>
                {currentQuestion.prompt}
              </h2>
              <div className="options">
                {currentQuestion.options.map((option) => {
                  const isSelected = selected === option.value;
                  const optionClass = feedback
                    ? option.isCorrect
                      ? 'correct'
                      : isSelected
                        ? 'incorrect'
                        : ''
                    : '';
                  return (
                    <label key={option.id} className={optionClass}>
                      <input
                        type="radio"
                        name="quick-quiz-option"
                        value={option.value}
                        checked={isSelected}
                        onChange={(event) => handleSelect(event.target.value)}
                        disabled={!!feedback}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
              {feedback ? (
                <div
                  className="notice"
                  style={{
                    border: `1px solid ${feedback.status === 'correct' ? 'var(--ok)' : 'var(--danger)'}`,
                    color: feedback.status === 'correct' ? 'var(--ok)' : 'var(--danger)'
                  }}
                >
                  {feedback.status === 'correct' ? (
                    <strong>Correct!</strong>
                  ) : (
                    <>
                      <strong>Incorrect.</strong> Correct answer: <strong>{feedback.correctAnswer}</strong>
                    </>
                  )}
                </div>
              ) : null}
              <div className="inline" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                {feedback ? (
                  <button type="button" className="button" onClick={handleContinue}>
                    Continue
                  </button>
                ) : (
                  <button type="button" className="button" onClick={handleSubmit}>
                    Submit Answer
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card center stack">
              <div className="title" style={{ fontSize: '1.4rem', textAlign: 'center' }}>
                All questions cleared!
              </div>
              <div className="muted" style={{ textAlign: 'center' }}>
                Start again to keep the material fresh.
              </div>
              <button type="button" className="button" onClick={handleRestart}>
                Restart Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
