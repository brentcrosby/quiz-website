import { useEffect, useMemo, useState } from 'react';
import { buildPracticeQuestions } from '../utils/practiceQuestions.js';

export function PracticeTestTab({ items, isActive }) {
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const prepared = buildPracticeQuestions(items);
    setQuestions(prepared);
    setResponses({});
    setSubmitted(false);
    setResult(null);
  }, [items]);

  const incorrectIds = useMemo(() => {
    if (!result) {
      return new Set();
    }
    return new Set(result.incorrect.map((entry) => entry.id));
  }, [result]);

  const handleSelect = (questionId, value) => {
    if (submitted) {
      return;
    }
    setResponses((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    if (!questions.length) {
      return;
    }
    const unanswered = questions.filter((question) => !(question.id in responses));
    if (unanswered.length) {
      alert('Please answer all questions before submitting.');
      return;
    }
    const incorrect = [];
    let score = 0;
    questions.forEach((question) => {
      const selection = responses[question.id];
      const isCorrect = selection === question.correctAnswer;
      if (isCorrect) {
        score += 1;
      } else {
        incorrect.push({
          id: question.id,
          prompt: question.prompt,
          selected: selection ?? null,
          correct: question.correctAnswer
        });
      }
    });
    setResult({
      score,
      total: questions.length,
      incorrect
    });
    setSubmitted(true);
  };

  const handleReset = () => {
    setResponses({});
    setSubmitted(false);
    setResult(null);
  };

  const handleRetake = () => {
    const reshuffled = buildPracticeQuestions(items);
    setQuestions(reshuffled);
    setResponses({});
    setSubmitted(false);
    setResult(null);
  };

  const percent = result ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <section
      id="tab-practice-test"
      className={`tab-panel stack ${isActive ? 'active' : ''}`}
      role="tabpanel"
      aria-label="Practice Test"
      hidden={!isActive}
    >
      {!questions.length ? (
        <p className="empty-state">Add a few practice questions to start testing.</p>
      ) : (
        <div className="stack">
          {submitted && result ? (
            <div className="card stack">
              <div className="title" style={{ fontSize: '1.4rem' }}>
                Score: {result.score} / {result.total} ({percent}%)
              </div>
              {result.incorrect.length ? (
                <div className="stack" style={{ gap: '8px' }}>
                  <strong>Needs Review</strong>
                  <ul className="muted small" style={{ paddingLeft: '18px' }}>
                    {result.incorrect.map((entry) => (
                      <li key={entry.id}>
                        {entry.prompt} – correct answer: <strong>{entry.correct}</strong>{' '}
                        <span>(you chose {entry.selected ?? 'no answer'})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="muted small">Perfect score! Excellent work.</div>
              )}
            </div>
          ) : null}
          {questions.map((question, index) => {
            const selection = responses[question.id];
            const isCorrect = submitted ? selection === question.correctAnswer : null;
            const questionStatus = submitted
              ? isCorrect
                ? 'correct'
                : 'incorrect'
              : 'ungraded';
            return (
              <div className="card question-card" key={question.id}>
                <div className="tab-summary">
                  <div>
                    <strong>
                      Question {index + 1}
                    </strong>
                    <span className="muted small" style={{ marginLeft: '8px' }}>
                      {question.kind === 'trueFalse' ? 'True/False' : 'Multiple choice'}
                    </span>
                  </div>
                  {submitted ? (
                    <span className="pill">
                      {questionStatus === 'correct' ? 'Correct' : 'Incorrect'}
                    </span>
                  ) : null}
                </div>
                <h2 className="title" style={{ fontSize: '1.25rem' }}>
                  {question.prompt}
                </h2>
                <div className="options">
                  {question.options.map((option) => {
                    const isSelected = selection === option.value;
                    const optionClass = submitted
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
                          name={`practice-test-${question.id}`}
                          value={option.value}
                          checked={isSelected}
                          onChange={(event) => handleSelect(question.id, event.target.value)}
                          disabled={submitted}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
                {submitted && incorrectIds.has(question.id) ? (
                  <div className="muted small">
                    Correct answer: <strong>{question.correctAnswer}</strong>
                  </div>
                ) : null}
              </div>
            );
          })}
          <div className="inline" style={{ justifyContent: 'flex-end', gap: '8px' }}>
            {submitted ? (
              <>
                <button type="button" className="button" onClick={handleRetake}>
                  Retake Test
                </button>
                <button type="button" className="button ghost" onClick={handleReset}>
                  Clear Answers
                </button>
              </>
            ) : (
              <button type="button" className="button" onClick={handleSubmit}>
                Submit Test
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
