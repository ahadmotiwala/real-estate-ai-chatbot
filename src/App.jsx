import { useMemo, useState } from 'react';
import { Bot, Building2, MessageCircle, Send, ShieldCheck, UserRound } from 'lucide-react';
import projects from '../data/projects.json';

const propertyTypes = ['2 BR Lounge', '2 BR DD', '3 BR DD'];
const budgets = ['Under PKR 5 million', 'PKR 5–8 million', 'PKR 8–12 million', 'PKR 12–20 million', 'Above PKR 20 million', 'Other / not sure'];
const purposes = ['Investment', 'End Use (for personal purpose)'];
const handovers = ['Ready Soon', 'Within 1 year', '1–2 years', '2–3 years', 'Flexible'];

const welcome = {
  role: 'assistant',
  text: 'Welcome to Rising Star Properties!\n\nTell us what you need and our team will take it from here. Tap below to begin.',
  quickReplies: ['Start my Enquiry']
};

const questionFor = {
  propertyType: { label: 'Property type', prompt: 'Which property type are you interested in?', options: propertyTypes },
  budget: { label: 'Budget (PKR)', prompt: 'What is your approximate budget in PKR?', options: budgets },
  purpose: { label: 'Purpose', prompt: 'Are you looking for investment or for your own use?', options: purposes },
  handover: { label: 'Preferred handover', prompt: 'When would you prefer the property to be handed over?', options: handovers }
};
const steps = ['propertyType', 'budget', 'purpose', 'handover'];

function getQuestion(step) {
  return questionFor[step];
}

function AppMessage({ message, onQuickReply }) {
  return <div className={'message-row ' + message.role}>
    <div className="message-avatar">{message.role === 'assistant' ? <Bot size={17} /> : <UserRound size={17} />}</div>
    <div className="message-content">
      <div className="bubble">{message.text}</div>
      {message.quickReplies?.length > 0 && <div className="quick-replies">{message.quickReplies.map(reply =>
        <button key={reply} onClick={() => onQuickReply(reply)}>{reply}</button>
      )}</div>}
    </div>
  </div>;
}

export default function App() {
  const [messages, setMessages] = useState([welcome]);
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState('welcome');
  const [language, setLanguage] = useState('English');
  const [showInventory, setShowInventory] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [contact, setContact] = useState({ name: '', phone: '', consent: false });
  const [saveStatus, setSaveStatus] = useState('');

  const summary = useMemo(() => Object.entries(answers).map(([key, value]) => {
    const label = questionFor[key]?.label || key;
    return { key, label, value };
  }), [answers]);

  function addAssistant(text, quickReplies = []) {
    setMessages(prev => [...prev, { role: 'assistant', text, quickReplies }]);
  }

  function startEnquiry() {
    if (started) return;
    setStarted(true);
    setStage('propertyType');
    addAssistant(getQuestion('propertyType').prompt, getQuestion('propertyType').options);
  }

  function recordAnswer(step, value) {
    const nextAnswers = { ...answers, [step]: value };
    setAnswers(nextAnswers);
    setMessages(prev => [...prev, { role: 'user', text: value }]);
    const index = steps.indexOf(step);
    if (index >= 0 && index < steps.length - 1) {
      const nextStep = steps[index + 1];
      setStage(nextStep);
      addAssistant(getQuestion(nextStep).prompt, getQuestion(nextStep).options);
      return;
    }
    if (step === 'handover') {
      setStage('complete');
      addAssistant('Thank you! Your preferences are noted in this demo. Would you like to share your contact details so the Rising Star Properties team can follow up? Your details will only be submitted if you give permission.', ['Share contact details', 'Not now']);
      return;
    }
    setStage('general');
  }

  function sendMessage(value = input) {
    const clean = value.trim();
    if (!clean) return;
    setInput('');
    if (stage === 'welcome' && /start/i.test(clean)) {
      startEnquiry();
      return;
    }
    if (stage === 'propertyType' && propertyTypes.includes(clean)) return recordAnswer('propertyType', clean);
    if (stage === 'budget') return recordAnswer('budget', clean);
    if (stage === 'purpose' && purposes.includes(clean)) return recordAnswer('purpose', clean);
    if (stage === 'handover' && handovers.includes(clean)) return recordAnswer('handover', clean);
    if (stage === 'complete' && /share contact/i.test(clean)) {
      setMessages(prev => [...prev, { role: 'user', text: clean }]);
      setShowLeadForm(true);
      addAssistant('Please enter your name and phone number below. Nothing will be submitted unless you check the consent box and press submit.');
      return;
    }
    if (stage === 'complete' && /not now/i.test(clean)) {
      setMessages(prev => [...prev, { role: 'user', text: clean }]);
      addAssistant('No problem. Thank you for enquiring with Rising Star Properties. You can ask another question any time.');
      return;
    }
    if (stage === 'general') {
      setMessages(prev => [...prev, { role: 'user', text: clean }]);
      addAssistant('Thanks for your message. This first version collects your preferences only; it does not yet have verified project details to answer specific price or availability questions. Our project information can be added to the bot next.');
      return;
    }
    if (stage === 'budget') return recordAnswer('budget', clean);
    setMessages(prev => [...prev, { role: 'user', text: clean }]);
    addAssistant('Please choose one of the options above, or type your answer if you selected “Other / not sure”.');
  }

  async function submitLead(event) {
    event.preventDefault();
    setSaveStatus('');
    if (!contact.consent) {
      setSaveStatus('Please confirm permission before submitting your contact details.');
      return;
    }
    if (!contact.name.trim() || !contact.phone.trim()) {
      setSaveStatus('Please enter both your name and phone number.');
      return;
    }
    const payload = {
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      purpose: answers.purpose,
      budget: answers.budget,
      location: 'Scheme 33, Karachi',
      timeline: answers.handover,
      project_interest: answers.propertyType,
      consent: true
    };
    try {
      const response = await fetch('http://127.0.0.1:8000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'The local backend is not available.');
      }
      setSaveStatus('Lead saved to the local database. Your sales team dashboard is not connected yet.');
      setMessages(prev => [...prev, { role: 'user', text: 'Contact details shared with permission' }, { role: 'assistant', text: 'Thank you. Your enquiry has been saved to the local prototype database. The live sales team is not notified yet.' }]);
      setShowLeadForm(false);
    } catch (error) {
      setSaveStatus('Could not save the lead: ' + error.message + ' Start the local backend to enable saving.');
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><Building2 size={21} /></div>
        <div>
          <p className="eyebrow">REAL ESTATE ENQUIRIES</p>
          <h1>Rising Star Properties</h1>
          <p className="muted">Scheme 33, Karachi · Enquiry assistant</p>
        </div>
        <div className="sidebar-card">
          <div className="status-line"><span className="status-dot" /> Prototype mode</div>
          <h2>Simple, respectful qualification</h2>
          <p>We ask about property type, budget, purpose and preferred handover before offering follow-up.</p>
        </div>
        <button className="side-link" onClick={() => setShowInventory(v => !v)}><Building2 size={17} /> {showInventory ? 'Hide sample inventory' : 'View sample inventory'}</button>
        <div className="sidebar-foot"><ShieldCheck size={16} /> Local demo · Do not enter real customer data unless testing locally</div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="agent-id"><div className="avatar"><Bot size={19} /></div><div><strong>Rising Star Properties</strong><span><i /> Enquiry assistant demo</span></div></div>
          <label className="language-select">Language
            <select value={language} onChange={e => setLanguage(e.target.value)}>
              <option>English</option><option>Urdu</option><option>Roman Urdu</option>
            </select>
          </label>
        </header>

        <div className="chat-layout">
          <div className="chat-column">
            <div className="welcome-heading"><span className="tiny-label">SCHEME 33 · KARACHI</span><h2>Welcome to Rising Star Properties.</h2><p>Tell us what you need and our team will take it from here.</p></div>
            <div className="messages" aria-live="polite">
              {messages.map((message, i) => <AppMessage key={i} message={message} onQuickReply={sendMessage} />)}
              {showLeadForm && <form className="lead-form" onSubmit={submitLead}>
                <label>Name<input value={contact.name} onChange={e => setContact(v => ({ ...v, name: e.target.value }))} required maxLength={120} placeholder="Your name" /></label>
                <label>Phone number<input value={contact.phone} onChange={e => setContact(v => ({ ...v, phone: e.target.value }))} required maxLength={40} placeholder="03XX XXXXXXX" /></label>
                <label className="consent-row"><input type="checkbox" checked={contact.consent} onChange={e => setContact(v => ({ ...v, consent: e.target.checked }))} /> I agree that Rising Star Properties may contact me about this enquiry.</label>
                <button type="submit" className="submit-lead">Submit enquiry</button>
                {saveStatus && <p className="save-status">{saveStatus}</p>}
              </form>}
              {saveStatus && !showLeadForm && <p className="save-status">{saveStatus}</p>}
            </div>
            <form className="composer" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." aria-label="Type your message" />
              <button type="submit" aria-label="Send message" disabled={!input.trim()}><Send size={17} /></button>
            </form>
            <p className="privacy-note"><ShieldCheck size={13} /> Contact details are submitted only with consent. Backend must be running to save.</p>
          </div>

          <aside className="details-panel">
            {showInventory ? <><span className="tiny-label">INVENTORY</span><h3>Sample projects</h3><p className="panel-note">Fictional placeholders only, not real listings.</p>{projects.map(p => <article className="project-card" key={p.id}><span className="demo-tag">DEMO DATA</span><h4>{p.name}</h4><p>{p.society}</p><div className="project-meta"><span>Example plan: {p.payment_plan_months} months</span><span>Example delivery: {p.delivery_months} months</span></div></article>)}</> :
              <><span className="tiny-label">ENQUIRY SUMMARY</span><h3>Customer preferences</h3><p className="panel-note">Answers will appear here as the customer completes the enquiry.</p>
              {summary.length ? <ul className="summary-list">{summary.map(item => <li key={item.key}><strong>{item.label}:</strong> {item.value}</li>)}</ul> : <div className="empty-state"><MessageCircle size={22} /><p>Start the enquiry to capture preferences.</p></div>}
              <div className="trust-card"><ShieldCheck size={19} /><div><strong>Customer-first by design</strong><p>Contact details are requested only after the customer chooses follow-up and gives consent.</p></div></div>
              </>}
          </aside>
        </div>
        <footer className="page-footer">Prototype only · Sample projects are fictional · WhatsApp integration is not included.</footer>
      </section>
    </main>
  );
}
