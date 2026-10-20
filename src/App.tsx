import React, { useState, useEffect } from 'react';
import { QuestionNode } from './types';
import { generateBalanced20Quiz, AREA_LABELS } from './data/curriculum';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Flame,
  Scale,
  Sparkles,
  Trophy,
  AlertTriangle,
  Share2,
  Check,
  Award,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type AppScreen = 'start' | 'quiz' | 'results';
type QuestionState = 'answering' | 'correct' | 'wrong_theory' | 'remediation_done';

interface RankInfo {
  title: string;
  verdict: string;
  badge: string;
  subtitle: string;
  colorClass: string;
}

function getRankByScore(accuracyPct: number, points: number): RankInfo {
  if (accuracyPct >= 90) {
    return {
      title: 'GENIO DE LAS LEYES',
      verdict: '¡SÍ PODRÍAS SER ABOGADO EN COLOMBIA (Y DE LOS PELIGROSOS)!',
      badge: 'NIVEL GENIO · 90%+ DE PRECISIÓN',
      subtitle:
        'No solo tendrías Tarjeta Profesional: pondrías a sudar a cualquier contraparte en audiencia. No te meten un gol ni en letra chiquita.',
      colorClass: 'bg-black text-[#80FF44] border-[#80FF44]',
    };
  }
  if (accuracyPct >= 70) {
    return {
      title: 'AVANZADO · APROBADO CON TARJETA EN MANO',
      verdict: '¡SÍ PODRÍAS SER ABOGADO EN COLOMBIA!',
      badge: 'NIVEL AVANZADO · PASAS EL CORTE',
      subtitle:
        'Superaste el umbral oficial para ejercer en Colombia. Sabes cuándo demandar, cómo defenderte y qué trampas evitar en los juzgados.',
      colorClass: 'bg-green-800 text-white border-black',
    };
  }
  if (accuracyPct >= 50) {
    return {
      title: 'CASI ABOGADO · TE FALTÓ UN PELO PROCESAL',
      verdict: 'SOBREVIVES AL PLEITO, PERO TE VENCEN LOS TÉRMINOS',
      badge: 'NIVEL INTERMEDIO · EN RIESGO',
      subtitle:
        'Tienes buena intuición para los casos, pero un par de detalles técnicos te dejarían sin Tarjeta Profesional por ahora.',
      colorClass: 'bg-amber-500 text-black border-black',
    };
  }
  return {
    title: 'ABOGADO DE TIKTOK · PELIGRO EN EL JUZGADO',
    verdict: 'NO PODRÍAS SER ABOGADO EN COLOMBIA (TODAVÍA)',
    badge: 'NIVEL NOVATO · NECESITAS APODERADO',
    subtitle: `Sumaste ${points} PTS aprendiendo a los golpes. Si hoy firmaras un contrato o fueras a audiencia, saldrías embargado. ¡Desquítate con tus errores!`,
    colorClass: 'bg-[#910a0a] text-white border-black',
  };
}

export function App() {
  const [screen, setScreen] = useState<AppScreen>('start');
  const [questions, setQuestions] = useState<QuestionNode[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [qState, setQState] = useState<QuestionState>('answering');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Remediation interactive state when user gets a question wrong
  const [remediationOption, setRemediationOption] = useState<string | null>(null);
  const [remediationWrong, setRemediationWrong] = useState(false);

  // Points & Streak system
  const [points, setPoints] = useState(0);
  const [lastEarnedPoints, setLastEarnedPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [missedQuestions, setMissedQuestions] = useState<QuestionNode[]>([]);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

  const startNew20Quiz = () => {
    const newQuiz = generateBalanced20Quiz();
    setQuestions(newQuiz);
    setCurrentIndex(0);
    setQState('answering');
    setSelectedOption(null);
    setRemediationOption(null);
    setRemediationWrong(false);
    setMissedQuestions([]);
    setFirstTryCorrectCount(0);
    setPoints(0);
    setLastEarnedPoints(0);
    setStreak(0);
    setBestStreak(0);
    setCopiedShare(false);
    setScreen('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startMistakesReview = () => {
    if (missedQuestions.length === 0) return;
    setQuestions([...missedQuestions]);
    setCurrentIndex(0);
    setQState('answering');
    setSelectedOption(null);
    setRemediationOption(null);
    setRemediationWrong(false);
    setMissedQuestions([]);
    setFirstTryCorrectCount(0);
    setStreak(0);
    setCopiedShare(false);
    setScreen('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setSelectedOption(null);
    setRemediationOption(null);
    setRemediationWrong(false);
  }, [currentIndex]);

  const currentQ = questions[currentIndex];

  const handleVerifyAnswer = () => {
    if (!selectedOption || !currentQ) return;

    if (selectedOption === currentQ.correctOptionId) {
      const nextStreak = streak + 1;
      // Base 100 pts + 25 pts bonus per consecutive streak hit (after the 1st)
      const streakBonus = (nextStreak - 1) * 25;
      const earned = 100 + streakBonus;

      setPoints((prev) => prev + earned);
      setLastEarnedPoints(earned);
      setStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));
      setFirstTryCorrectCount((prev) => prev + 1);
      setQState('correct');
    } else {
      setStreak(0);
      setLastEarnedPoints(0);
      setMissedQuestions((prev) =>
        prev.some((q) => q.id === currentQ.id) ? prev : [...prev, currentQ]
      );
      setQState('wrong_theory');
    }
  };

  const handleVerifyRemediation = (optId: string) => {
    setRemediationOption(optId);
    if (optId === currentQ.remediation.correctId) {
      setRemediationWrong(false);
      setPoints((prev) => prev + 25);
      setQState('remediation_done');
    } else {
      setRemediationWrong(true);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setQState('answering');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
      });
      setScreen('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const accuracyPct =
    questions.length > 0
      ? Math.round((firstTryCorrectCount / questions.length) * 100)
      : 0;
  const rank = getRankByScore(accuracyPct, points);

  const getShareMessage = () => {
    const appUrl = window.location.href.split('#')[0];
    return `⚖️ ¿Podrías ser un abogado en Colombia? Hice el reto de 20 casos reales y este fue mi veredicto:\n\n🏛️ Nivel: ${rank.title}\n📋 Veredicto: ${rank.verdict}\n🎯 Puntaje: ${points} PTS (${firstTryCorrectCount}/${questions.length} casos acertados · ${accuracyPct}%)\n🔥 Mejor racha: x${bestStreak}\n\n¿Qué tanto sabes de leyes en Colombia? Haz la prueba aquí 👇\n${appUrl}`;
  };

  const handleShareLinkedIn = () => {
    const shareText = getShareMessage();
    const appUrl = window.location.href.split('#')[0];

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 4000);
    }

    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(appUrl)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="grid-bg" />

      {/* MINIMALIST TICIO HEADER */}
      <header className="sticky top-0 z-40 bg-[#faf8f4]/95 backdrop-blur border-b-4 border-black">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => setScreen('start')}
            className="flex items-center gap-2.5 bg-white border-3 border-black px-3 py-1.5 shadow-[4px_4px_0px_#910a0a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#910a0a] transition-all cursor-pointer"
          >
            <img src="./Branding/ticio.svg" alt="Ticio" className="h-6 w-6" />
            <span className="display-font text-base md:text-lg font-black tracking-widest">
              TICIO<span className="text-[#910a0a]">RETO</span>
            </span>
          </button>

          {screen === 'quiz' && currentQ && (
            <div className="flex-1 max-w-md mx-2">
              <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-1">
                <span>
                  Caso {currentIndex + 1} de {questions.length}
                </span>
                <span className="text-[#910a0a]">
                  {Math.round(((currentIndex + 1) / questions.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 bg-white border-2 border-black overflow-hidden">
                <div
                  className="h-full bg-[#910a0a] transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      ((currentIndex + 1) / questions.length) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div
              className={`border-3 border-black px-2.5 py-1 text-xs font-black display-font uppercase flex items-center gap-1 transition-all ${
                streak > 0
                  ? 'bg-black text-[#80FF44] shadow-[3px_3px_0px_#910a0a]'
                  : 'bg-[#faf8f4] text-black/50'
              }`}
              title="Acierta casos seguidos para multiplicar tus puntos"
            >
              <Flame
                className={`w-4 h-4 ${
                  streak > 0 ? 'text-[#80FF44] fill-[#80FF44]' : 'text-black/40'
                }`}
              />
              <span>Racha x{streak}</span>
            </div>

            <div className="bg-white border-3 border-black px-3 py-1 shadow-[3px_3px_0px_#0a0a0a] flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#910a0a]" />
              <span className="display-font font-black text-xs md:text-sm">
                {points} PTS
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* SCREEN 1: VIRAL CHALLENGE LANDING */}
      {screen === 'start' && (
        <main className="flex-1 flex flex-col justify-center px-4 py-10">
          <div className="max-w-3xl mx-auto w-full space-y-8">
            <div className="brutal-card p-6 md:p-12 bg-white space-y-6">
              <h1 className="display-font text-3xl sm:text-5xl font-black uppercase leading-[1.06]">
                ¿Podrías ser un{' '}
                <span className="bg-black text-[#faf8f4] px-3 py-1 inline-block transform -rotate-1 text-[#80FF44] mt-1">
                  Abogado en Colombia?
                </span>
              </h1>

              <p className="text-base md:text-lg font-medium text-black/85 leading-relaxed border-l-4 border-[#910a0a] pl-4">
                En Colombia ya no basta con graduarse para ejercer: tienes que
                superar el temido Examen de Estado. Ponemos frente a ti{' '}
                <strong>20 casos de la vida real</strong> (arriendos, despidos,
                herencias, tutelas, deudas y negocios) para descubrir{' '}
                <strong>qué tanto sabes realmente de leyes</strong> y si te
                darían la Tarjeta Profesional hoy mismo.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-[#faf8f4] border-2 border-black">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-4 h-4 text-[#910a0a]" />
                    <span className="display-font text-xs font-black uppercase text-[#910a0a]">
                      20 Casos Cotidianos
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-black/80">
                    Situaciones reales donde un mal consejo cuesta millones o la
                    libertad. Tú decides qué hacer.
                  </p>
                </div>

                <div className="p-4 bg-[#faf8f4] border-2 border-black">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Flame className="w-4 h-4 text-[#910a0a]" />
                    <span className="display-font text-xs font-black uppercase text-[#910a0a]">
                      Puntos y Racha
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-black/80">
                    Gana <strong>100 PTS</strong> por acierto + multiplicador de
                    racha. Si fallas, te explicamos el truco legal al instante.
                  </p>
                </div>

                <div className="p-4 bg-[#faf8f4] border-2 border-black">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Award className="w-4 h-4 text-[#910a0a]" />
                    <span className="display-font text-xs font-black uppercase text-[#910a0a]">
                      Tu Veredicto Final
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-black/80">
                    Descubre tu título al final y compártelo en LinkedIn para
                    retar a tus amigos y colegas.
                  </p>
                </div>
              </div>

              {/* Rank preview bar */}
              <div className="bg-[#faf8f4] border-2 border-black p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <span className="uppercase text-black/70">
                  ¿En qué nivel quedarás hoy?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 bg-red-100 border border-black">
                    Abogado de TikTok
                  </span>
                  <span className="px-2 py-0.5 bg-amber-200 border border-black">
                    Casi Abogado
                  </span>
                  <span className="px-2 py-0.5 bg-green-200 border border-black">
                    Avanzado (Aprobado)
                  </span>
                  <span className="px-2 py-0.5 bg-black text-[#80FF44] border border-black font-black">
                    Genio de las Leyes
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={startNew20Quiz}
                  className="brutal-btn w-full py-4 text-base md:text-lg"
                >
                  <Play className="w-5 h-5 mr-2.5 fill-white" />
                  <span>Descubrir si Podría Ser Abogado (20 Casos)</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* SCREEN 2: ACTIVE QUIZ (ALL CASE INFO VISIBLE + THEORY ONLY ON ERROR) */}
      {screen === 'quiz' && currentQ && (
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
          {/* Case & Question Card — ALWAYS VISIBLE */}
          <div className="brutal-card p-6 md:p-8 bg-white space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-3 py-1 text-xs font-black display-font uppercase">
                  Caso #{currentIndex + 1}
                </span>
                <span className="bg-[#faf8f4] text-black px-2.5 py-1 text-xs font-bold border border-black">
                  Nivel: {currentQ.difficulty}
                </span>
              </div>

              {/* Show area only AFTER answering so it doesn't give hints beforehand */}
              {qState !== 'answering' && (
                <span className="bg-[#910a0a] text-white px-2.5 py-1 text-xs font-bold uppercase border border-black">
                  {AREA_LABELS[currentQ.moduleId] || currentQ.moduleId}
                </span>
              )}
            </div>

            {/* Full Case Text ("Supuesto de Hecho") */}
            <div className="bg-[#faf8f4] p-4 md:p-6 border-3 border-black">
              <div className="text-xs font-black uppercase tracking-widest text-[#910a0a] mb-2 flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                <span>El Caso que Llega a tu Oficina</span>
              </div>
              <p className="text-sm md:text-base leading-relaxed font-medium text-black whitespace-pre-line">
                {currentQ.caseText}
              </p>
            </div>

            {/* Question Stem */}
            <div className="pt-1">
              <h2 className="display-font text-lg md:text-xl font-black leading-snug text-black">
                {currentQ.questionText}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isLocked = qState !== 'answering';
                const isCorrectOpt = opt.id === currentQ.correctOptionId;

                let cardStyle = '';
                if (qState === 'answering' && isSelected) {
                  cardStyle = 'selected';
                } else if (qState !== 'answering') {
                  if (isCorrectOpt) cardStyle = 'correct';
                  else if (isSelected && !isCorrectOpt) cardStyle = 'wrong';
                }

                return (
                  <button
                    key={opt.id}
                    disabled={isLocked}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`option-card w-full text-left p-4 md:p-5 flex items-start gap-3.5 ${cardStyle} ${
                      isLocked ? 'disabled cursor-default' : ''
                    }`}
                  >
                    <span
                      className={`display-font font-black text-sm w-8 h-8 flex items-center justify-center border-2 border-black shrink-0 mt-0.5 ${
                        qState !== 'answering' && isCorrectOpt
                          ? 'bg-green-700 text-white'
                          : isSelected
                          ? 'bg-[#910a0a] text-white'
                          : 'bg-[#faf8f4] text-black'
                      }`}
                    >
                      {opt.id}
                    </span>

                    <div className="flex-1">
                      <p className="text-sm md:text-base font-semibold leading-snug">
                        {opt.text}
                      </p>

                      {/* Option-specific feedback shown after answering */}
                      {qState !== 'answering' &&
                        (isSelected || isCorrectOpt) &&
                        opt.feedback && (
                          <div
                            className={`mt-3 p-3 text-xs md:text-sm font-medium border-l-4 ${
                              isCorrectOpt
                                ? 'bg-green-100/90 border-green-700 text-green-950'
                                : 'bg-red-100/90 border-red-700 text-red-950'
                            }`}
                          >
                            {opt.feedback}
                          </div>
                        )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Submit Button */}
            {qState === 'answering' && (
              <div className="pt-3 flex justify-end">
                <button
                  disabled={!selectedOption}
                  onClick={handleVerifyAnswer}
                  className="brutal-btn px-8 py-4 text-sm md:text-base w-full sm:w-auto"
                >
                  <span>Tomar Decisión Legal</span>
                </button>
              </div>
            )}
          </div>

          {/* STATE A: USER ANSWERED CORRECTLY -> FAST FORWARD */}
          {qState === 'correct' && (
            <div className="brutal-card-black bg-green-50 border-green-800 p-6 animate-slide-up space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-700 shrink-0" />
                  <div>
                    <h3 className="display-font text-lg md:text-xl font-black uppercase text-green-950">
                      ¡Ganaste el Caso!
                    </h3>
                    <span className="text-xs font-bold uppercase text-green-800">
                      Fundamento: {currentQ.norma}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {streak > 1 && (
                    <span className="bg-[#910a0a] text-white font-black display-font text-xs px-2.5 py-1 border-2 border-black flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-white" />
                      Racha x{streak}
                    </span>
                  )}
                  <span className="bg-black text-[#80FF44] font-black display-font text-xs px-3 py-1 border-2 border-black">
                    +{lastEarnedPoints} PTS
                  </span>
                </div>
              </div>

              <p className="text-sm md:text-base font-medium text-black/90 bg-white p-4 border-2 border-black">
                {currentQ.legalExplanation}
              </p>

              <div className="flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="brutal-btn bg-green-700 px-8 py-3.5 text-sm md:text-base w-full sm:w-auto"
                >
                  <span>
                    {currentIndex + 1 < questions.length
                      ? 'Siguiente Caso'
                      : 'Ver Mi Veredicto Final'}
                  </span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* STATE B: USER ANSWERED WRONG -> SHOW THEORY LESSON + INTERACTIVE REMEDIATION */}
          {(qState === 'wrong_theory' || qState === 'remediation_done') && (
            <div className="brutal-card bg-white border-black p-6 md:p-8 animate-slide-up space-y-6">
              {/* Alert Header */}
              <div className="bg-[#910a0a] text-white p-4 border-3 border-black flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <XCircle className="w-7 h-7 text-white shrink-0" />
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#80FF44] block">
                      ¡Perdiste el Pleito! · Así Funciona la Ley en Colombia
                    </span>
                    <h3 className="display-font text-base md:text-lg font-black uppercase">
                      {currentQ.lessonCard.title}
                    </h3>
                  </div>
                </div>
                <span className="bg-black text-white px-2.5 py-1 text-xs font-bold border border-white">
                  {currentQ.lessonCard.norma}
                </span>
              </div>

              {/* Theory Breakdown (Only shown because the user missed the question!) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
                  <BookOpen className="w-4 h-4 text-[#910a0a]" />
                  <span>Lo que todo abogado en Colombia debe saber aquí:</span>
                </div>

                <p className="text-sm md:text-base font-medium leading-relaxed bg-[#faf8f4] p-4 border-l-4 border-black">
                  {currentQ.lessonCard.summary}
                </p>

                <div className="grid gap-2.5">
                  {currentQ.lessonCard.keyPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-[#faf8f4] border-2 border-black"
                    >
                      <span className="bg-black text-white font-black text-xs w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                        0{idx + 1}
                      </span>
                      <p className="text-xs md:text-sm font-semibold leading-snug">
                        {pt}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Mental Rule / Tip */}
                <div className="bg-black text-white p-4 border-3 border-[#910a0a] flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-[#80FF44] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#80FF44] block mb-0.5">
                      El Truco Legal para No Olvidarlo
                    </span>
                    <p className="text-xs md:text-sm font-semibold">
                      {currentQ.lessonCard.analogyOrTip}
                    </p>
                  </div>
                </div>

                {/* Application to the Specific Case */}
                <div className="p-4 bg-green-50 border-2 border-green-800 text-xs md:text-sm">
                  <strong className="uppercase text-green-900 block mb-1">
                    Por qué se resolvía así:
                  </strong>
                  {currentQ.legalExplanation}
                </div>
              </div>

              {/* Interactive Micro-Check to unlock Next Question (Brilliant / Duolingo style) */}
              <div className="pt-4 border-t-3 border-black space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#910a0a]" />
                  <h4 className="display-font text-sm md:text-base font-black uppercase">
                    Salva +25 PTS respondiendo esta rápida para seguir:
                  </h4>
                </div>

                <p className="text-sm md:text-base font-bold text-black">
                  {currentQ.remediation.prompt}
                </p>

                <div className="space-y-2.5">
                  {currentQ.remediation.options.map((ropt) => {
                    const isSel = remediationOption === ropt.id;
                    const isRight =
                      qState === 'remediation_done' &&
                      ropt.id === currentQ.remediation.correctId;

                    return (
                      <button
                        key={ropt.id}
                        disabled={qState === 'remediation_done'}
                        onClick={() => handleVerifyRemediation(ropt.id)}
                        className={`option-card w-full text-left p-3.5 flex items-center gap-3 ${
                          isRight
                            ? 'correct'
                            : isSel && remediationWrong
                            ? 'wrong'
                            : isSel
                            ? 'selected'
                            : ''
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${
                            isRight
                              ? 'bg-green-700'
                              : isSel
                              ? 'bg-[#910a0a]'
                              : 'bg-white'
                          }`}
                        >
                          {(isSel || isRight) && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-xs md:text-sm font-bold">
                          {ropt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {remediationWrong && (
                  <p className="text-xs font-bold text-[#910a0a] bg-red-50 p-2.5 border border-[#910a0a]">
                    Mira el Truco Legal de arriba e intenta con la otra opción.
                  </p>
                )}

                {qState === 'remediation_done' && (
                  <div className="bg-green-100 border-2 border-green-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
                    <div className="text-xs md:text-sm font-semibold text-green-950">
                      <strong className="uppercase block text-green-900">
                        ¡Regla Aprendida! (+25 PTS)
                      </strong>
                      {currentQ.remediation.explanation}
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      className="brutal-btn bg-black px-6 py-3 text-xs md:text-sm shrink-0"
                    >
                      <span>
                        {currentIndex + 1 < questions.length
                          ? 'Siguiente Caso'
                          : 'Ver Mi Veredicto Final'}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* SCREEN 3: FINAL RESULTS, RANK TITLE & LINKEDIN SHARE */}
      {screen === 'results' && (
        <main className="flex-1 flex flex-col justify-center px-4 py-10">
          <div className="max-w-3xl mx-auto w-full brutal-card p-6 md:p-10 bg-white space-y-6 animate-slide-up">
            {/* Rank Title Banner */}
            <div className={`p-6 border-3 ${rank.colorClass} space-y-2.5`}>
              <div className="inline-flex items-center gap-2 bg-white text-black px-2.5 py-0.5 text-[11px] font-black display-font uppercase border border-black">
                <Trophy className="w-3.5 h-3.5 text-[#910a0a]" />
                <span>{rank.badge}</span>
              </div>
              <div className="text-xs font-black uppercase tracking-wider opacity-90">
                Veredicto: {rank.verdict}
              </div>
              <h2 className="display-font text-2xl sm:text-4xl font-black uppercase leading-tight">
                Título: {rank.title}
              </h2>
              <p className="text-xs sm:text-sm font-semibold opacity-95 leading-relaxed">
                {rank.subtitle}
              </p>
            </div>

            {/* Score & Streak Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 bg-[#faf8f4] border-2 border-black text-center">
                <span className="text-[11px] font-bold uppercase text-black/60 block">
                  Puntaje Total
                </span>
                <span className="display-font text-2xl md:text-3xl font-black text-[#910a0a]">
                  {points} PTS
                </span>
              </div>

              <div className="p-4 bg-[#faf8f4] border-2 border-black text-center">
                <span className="text-[11px] font-bold uppercase text-black/60 block">
                  Casos Ganados
                </span>
                <span className="display-font text-2xl md:text-3xl font-black text-black">
                  {firstTryCorrectCount}/{questions.length}
                </span>
              </div>

              <div className="p-4 bg-[#faf8f4] border-2 border-black text-center">
                <span className="text-[11px] font-bold uppercase text-black/60 block">
                  Nivel de Leyes
                </span>
                <span className="display-font text-2xl md:text-3xl font-black text-green-700">
                  {accuracyPct}%
                </span>
              </div>

              <div className="p-4 bg-[#faf8f4] border-2 border-black text-center">
                <span className="text-[11px] font-bold uppercase text-black/60 block">
                  Mejor Racha
                </span>
                <span className="display-font text-2xl md:text-3xl font-black text-black flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 text-[#910a0a] fill-[#910a0a]" />
                  x{bestStreak}
                </span>
              </div>
            </div>

            {/* LinkedIn Share Card */}
            <div className="p-5 bg-[#faf8f4] border-3 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="display-font text-xs font-black uppercase text-[#0A66C2] block">
                  ¿Y tus colegas podrían ser abogados en Colombia?
                </span>
                <p className="text-xs md:text-sm font-semibold text-black/80">
                  Comparte tu título de <strong>{rank.title}</strong> ({points}{' '}
                  PTS) en LinkedIn y rétalos a superar tu puntaje.
                </p>
              </div>

              <button
                onClick={handleShareLinkedIn}
                className="bg-[#0A66C2] text-white border-3 border-black px-5 py-3 font-black display-font text-xs md:text-sm uppercase shadow-[4px_4px_0px_#0a0a0a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0a0a0a] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-[#80FF44]" />
                    <span>¡Texto Copiado · Abriendo LinkedIn!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Compartir en LinkedIn</span>
                  </>
                )}
              </button>
            </div>

            {missedQuestions.length > 0 && (
              <div className="p-5 bg-red-50 border-3 border-black space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-[#910a0a]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    Casos que te hicieron perder puntos ({missedQuestions.length}):
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs md:text-sm font-semibold">
                  {missedQuestions.map((mq) => (
                    <li
                      key={mq.id}
                      className="flex items-center justify-between gap-2 bg-white p-2 border border-black"
                    >
                      <span>{mq.title}</span>
                      <span className="text-[11px] font-bold text-[#910a0a]">
                        {mq.norma}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {missedQuestions.length > 0 && (
                <button
                  onClick={startMistakesReview}
                  className="brutal-btn flex-1 py-4 text-sm md:text-base"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  <span>Desquitarme con mis {missedQuestions.length} Errores</span>
                </button>
              )}

              <button
                onClick={startNew20Quiz}
                className="brutal-btn-secondary flex-1 py-4 text-sm md:text-base"
              >
                <Play className="w-5 h-5 mr-2" />
                <span>Jugar de Nuevo (20 Casos al Azar)</span>
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;


