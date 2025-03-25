import React, { useRef, useState } from 'react';

const UitspraakZinnenApp = () => {
  const [zinnen, setZinnen] = useState(['', '', '', '', '']);
  const [reeks, setReeks] = useState([]);
  const [huidigeZinIndex, setHuidigeZinIndex] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [herkenningActief, setHerkenningActief] = useState(false);
  const recognitionRef = useRef(null);

  const startOefening = () => {
    const geldigeZinnen = zinnen.filter((z) => z.trim() !== '');
    if (geldigeZinnen.length === 0) {
      setFeedback('Vul eerst zinnen in.');
      return;
    }
    const indices = geldigeZinnen.map((_, i) => zinnen.indexOf(geldigeZinnen[i]));
    setReeks(shuffle(indices));
    setFeedback('');
    setTimeout(() => kiesNieuweZin(indices), 0);
  };

  const shuffle = (array) => {
    return array
      .map((a) => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map((a) => a[1]);
  };

  const kiesNieuweZin = (nieuweReeks = reeks) => {
    if (nieuweReeks.length === 0) {
      const geldigeIndices = zinnen.map((z, i) => z.trim() !== '' ? i : null).filter(i => i !== null);
      const reshuffled = shuffle(geldigeIndices);
      setReeks(reshuffled);
      setHuidigeZinIndex(reshuffled[0]);
      setReeks(reshuffled.slice(1));
    } else {
      setHuidigeZinIndex(nieuweReeks[0]);
      setReeks(nieuweReeks.slice(1));
    }
  };

  const spreekVoorbeeldZin = (zin) => {
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(zin);
    utterance.lang = 'nl-NL';
    utterance.rate = 0.8; // Langzamer spreken
    synth.speak(utterance);
  };

  const beoordeelUitspraak = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      setFeedback('Spraakherkenning niet ondersteund in deze browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'nl-NL';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    setHerkenningActief(true);
    setFeedback('🎤 Spreek de zin uit...');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const doel = zinnen[huidigeZinIndex].toLowerCase().trim();
      const score = transcript === doel ? 10 :
                    transcript.includes(doel) || doel.includes(transcript) ? 4 + Math.floor(Math.random() * 2) :
                    Math.floor(Math.random() * 3) + 1; // Strenger beoordelen

      const voldoende = score >= 6;
      setFeedback(`🎯 Herkend: "${transcript}" — ${voldoende ? `✅ Goed gedaan (${score}/10)` : `❌ Onvoldoende (${score}/10). Luister en probeer opnieuw.`}`);
      setHerkenningActief(false);

      recognition.stop();

      if (voldoende) {
        setTimeout(() => {
          kiesNieuweZin();
        }, 1500);
      } else {
        spreekVoorbeeldZin(zinnen[huidigeZinIndex]);
        setTimeout(() => {
          beoordeelUitspraak();
        }, 4000);
      }
    };

    recognition.onerror = (event) => {
      console.error('Spraakherkenning fout:', event);
      setFeedback('❗ Er ging iets mis met spraakherkenning.');
      setHerkenningActief(false);
      recognition.stop();
    };

    recognition.onend = () => {
      setHerkenningActief(false);
    };

    recognition.start();
  };

  const handleInputChange = (index, value) => {
    const nieuw = [...zinnen];
    nieuw[index] = value;
    setZinnen(nieuw);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Voer 5 korte Nederlandse zinnen in</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {zinnen.map((zin, i) => (
          <textarea
            key={i}
            value={zin}
            onChange={(e) => handleInputChange(i, e.target.value)}
            placeholder={`Zin ${i + 1}`}
            rows={2}
            style={{ padding: '0.5rem', fontSize: '1rem' }}
          />
        ))}
      </div>
      <button onClick={startOefening} style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '1rem' }}>
        Start oefening
      </button>

      {huidigeZinIndex !== null && (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Spreek uit:</h3>
          <p style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>{zinnen[huidigeZinIndex]}</p>
          <button
            onClick={beoordeelUitspraak}
            disabled={herkenningActief}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '1rem' }}
          >
            {herkenningActief ? '🎤 Luistert...' : '🎙️ Start opname'}
          </button>
          {feedback && <p style={{ marginTop: '1rem' }}>{feedback}</p>}
        </div>
      )}
    </div>
  );
};

export default UitspraakZinnenApp;
