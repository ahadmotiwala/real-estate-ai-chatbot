import { useMemo, useState } from 'react';
import { Bot, Building2, MessageCircle, Send, ShieldCheck, UserRound } from 'lucide-react';
import projects from '../data/projects.json';

const welcome = {
  role: 'assistant',
  text: 'Assalam-o-alaikum! 👋 Welcome. I can help you explore property options in Karachi, explain project details, and connect you with our team when you’re ready. Are you looking for a home to live in or a property for investment?',
  quickReplies: ['For my family', 'For investment', 'Just exploring']
};

function makeReply(message, stage, answers) {
  const text = message.toLowerCase();
  if (stage === 'purpose') {
    const purpose = /invest|investment|return|rental/.test(text) ? 'Investment' :
      /family|live|own|self|reside|home/.test(text) ? 'Personal use' : 'Exploring';
    return {
      reply: 'Got it — ' + purpose.toLowerCase() + '. What budget range would you feel comfortable with? An approximate range is completely fine.',
      stage: 'budget',
      answers: { ...answers, purpose }
    };
  }
  if (stage === 'budget') {
    return {
      reply: 'Thanks. Which area or society would you prefer? If you’re flexible, just say “open to options” and I’ll help compare suitable projects.',
      stage: 'location',
      answers: { ...answers, budget: message }
    };
  }
  if (stage === 'location') {
    return {
      reply: 'Understood. When are you hoping to buy — within 3 months, 3–6 months, 6–12 months, or later?',
      stage: 'timeline',
      answers: { ...answers, location: message }
    };
  }
  if (stage === 'timeline') {
    return {
      reply: 'Thanks, I’ve noted your preferences. Would you like me to share project options here, or would you prefer a sales consultant to contact you? I’ll only ask for your contact details if you choose a follow-up.',
      stage: 'followup',
      answers: { ...answers, timeline: message }
    };
  }
  if (stage === 'followup') {
    if (/consultant|contact|call|whatsapp|yes|team/.test(text)) {
      return {
        reply: 'Absolutely. What name should I use? After that, I’ll ask for a phone number and confirm your permission before marking this for follow-up.',
        stage: 'name',
        answers
      };
    }
    return {
      reply: 'No problem. I can keep helping here. Ask about location, property type, payment plan, or delivery timeline. Note: this demo uses fictional sample projects, so real prices and availability are not available yet.',
      stage: 'general',
      answers
    };
  }
  if (stage === 'name') {
    return {
      reply: 'Thanks, ' + message + '. Please share the best phone number for a consultant to contact you. This demo does not send or store your details yet.',
      stage: 'phone',
      answers: { ...answers, name: message }
    };
  }
  if (stage === 'phone') {
    return {
      reply: 'Thank you. Before anyone contacts you, please confirm: may our sales consultant contact you about relevant property options? (Yes / No). This prototype does not transmit or save this information.',
      stage: 'consent',
      answers: { ...answers, phone: message }
    };
  }
  if (stage === 'consent') {
    if (/^yes\b|yes|agree|okay|ok/.test(text)) {
      return {
        reply: 'Permission noted for this demo. No information has actually been saved or sent. Once connected to a secure lead database, the team can receive your preferences and chat summary.',
        stage: 'done',
        answers: { ...answers, consent: 'yes' }
      };
    }
    return {
      reply: 'Of course — we won’t request follow-up. You can continue asking questions here. No contact details have been saved or sent by this demo.',
      stage: 'done',
      answers: { ...answers, consent: 'no' }
    };
  }
  if (/price|cost|payment|installment|installment|qist|قیمت|قسط/.test(text)) {
    return {
      reply: 'I don’t have verified prices or payment schedules yet, and I don’t want to give you incorrect information. I can note your preferred unit type and budget, then the team can confirm details once verified inventory is added.',
      stage,
      answers
    };
  }
  if (/project|option|available|show|property|flat|apartment|پروجیکٹ|فلیٹ/.test(text)) {
    const demoNames = projects.map(p => p.name).join(' and ');
    return {
      reply: 'The workspace currently contains only fictional placeholders: ' + demoNames + '. They are not real listings. We should replace them with your verified projects before using this with customers. What unit type are you looking for — 2-bed lounge, 2-bed DD, or 3-bed?',
      stage: 'unit',
      answers
    };
  }
  if (stage === 'unit') {
    return {
      reply: 'Noted: ' + message + '. Which budget range and preferred delivery timeline should I use to narrow the options?',
      stage: 'budget',
      answers: { ...answers, unitType: message }
    };
  }
  return {
    reply: 'I can help with project details, unit types, budget, preferred location, payment plans, and delivery timelines. The sample inventory is fictional at the moment, so I won’t invent prices or availability. What would you like to explore first?',
    stage,
    answers
  };
}

export default function App() {
  const [messages, setMessages] = useState([welcome]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState('purpose');
  const [answers, setAnswers] = useState({});
  const [language, setLanguage] = useState('English');
  const [showInventory, setShowInventory] = useState(false);

  const summary = useMemo(() => Object.entries(answers).filter(([, v]) => v).map(([k, v]) => k + ': ' + v), [answers]);

  function sendMessage(value = input) {
    const clean = value.trim();
    if (!clean) return;
    const result = makeReply(clean, stage, answers);
    setMessages(prev => [...prev, { role: 'user', text: clean }, { role: 'assistant', text: result.reply }]);
    setStage(result.stage);
    setAnswers(result.answers);
    setInput('');
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><Building2 size={21} /></div>
        <div>
          <p className="eyebrow">REAL ESTATE ASSISTANT</p>
          <h1>Property Guide</h1>
          <p className="muted">A calmer way to find the right property.</p>
        </div>
        <div className="sidebar-card">
          <div className="status-line"><span className="status-dot" /> Prototype ready</div>
          <h2>Built around trust</h2>
          <p>No invented prices, no pressure, and no sales follow-up without permission.</p>
        </div>
        <button className="side-link" onClick={() => setShowInventory(v => !v)}><Building2 size={17} /> {showInventory ? 'Hide sample inventory' : 'View sample inventory'}</button>
        <div className="sidebar-foot"><ShieldCheck size={16} /> Demo mode · No data is saved</div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="agent-id"><div className="avatar"><Bot size={19} /></div><div><strong>Property Guide</strong><span><i /> Online demo</span></div></div>
          <label className="language-select">Language
            <select value={language} onChange={e => setLanguage(e.target.value)}>
              <option>English</option><option>Urdu</option><option>Roman Urdu</option>
            </select>
          </label>
        </header>

        <div className="chat-layout">
          <div className="chat-column">
            <div className="welcome-heading"><span className="tiny-label">YOUR PROPERTY JOURNEY</span><h2>Let’s find what fits you.</h2><p>Ask freely. We’ll take it one step at a time.</p></div>
            <div className="messages" aria-live="polite">
              {messages.map((message, i) => <div className={'message-row ' + message.role} key={i}>
                <div className="message-avatar">{message.role === 'assistant' ? <Bot size={17} /> : <UserRound size={17} />}</div>
                <div className="message-content"><div className="bubble">{message.text}</div>
                  {i === 0 && <div className="quick-replies">{welcome.quickReplies.map(reply => <button key={reply} onClick={() => sendMessage(reply)}>{reply}</button>)}</div>}
                </div>
              </div>)}
            </div>
            <form className="composer" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." aria-label="Type your message" />
              <button type="submit" aria-label="Send message" disabled={!input.trim()}><Send size={17} /></button>
            </form>
            <p className="privacy-note"><ShieldCheck size={13} /> This is a prototype. Messages and contact details are not stored.</p>
          </div>

          <aside className="details-panel">
            {showInventory ? <><span className="tiny-label">INVENTORY</span><h3>Sample projects</h3><p className="panel-note">These are fictional placeholders, not real listings.</p>{projects.map(p => <article className="project-card" key={p.id}><span className="demo-tag">DEMO DATA</span><h4>{p.name}</h4><p>{p.society}</p><div className="project-meta"><span>{p.payment_plan_months}-month plan (example)</span><span>{p.delivery_months}-month delivery (example)</span></div></article>)}</> :
              <><span className="tiny-label">CONVERSATION SNAPSHOT</span><h3>What we know so far</h3><p className="panel-note">Your preferences will appear here as the chat progresses.</p>
              {summary.length ? <ul className="summary-list">{summary.map(item => <li key={item}>{item}</li>)}</ul> : <div className="empty-state"><MessageCircle size={22} /><p>Your preferences will appear here.</p></div>}
              <div className="trust-card"><ShieldCheck size={19} /><div><strong>Customer-first by design</strong><p>Project details first. Questions only when useful. Contact only with permission.</p></div></div>
              </>}
          </aside>
        </div>
        <footer className="page-footer">Private prototype · Replace demo inventory with verified project data before launch.</footer>
      </section>
    </main>
  );
}