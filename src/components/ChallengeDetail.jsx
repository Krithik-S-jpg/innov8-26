import { ArrowRight, Check, Phone, X } from 'lucide-react'
import EventStatusPanel from './EventStatusPanel'

const eventBriefs = {
  'PAPER PRESENTATION': {
    venue:'JS Hall / Seminar Hall', duration:'5 mins presentation + 2-3 mins Q&A', team:'1 - 2 players', capacity:'Top 15 teams shortlisted', selection:'Abstract screening by 25.08.2026',
    description:'Present research ideas, recent trending tech topics, innovations or solutions before a judging panel. Selection is based on abstract screening.',
    rounds:[
      'Round 1: Abstract screening (online submission by 25.08.2026).',
      'Round 2: Final presentation (5 mins presentation + 2-3 mins Q&A).'
    ],
    domains:[
      'AI for Smart Business Solutions',
      'FinTech and Digital Banking',
      'Smart and Sustainable Communities',
      'Cybersecurity and Digital Trust'
    ],
    evaluation:['Innovation', 'Clarity', 'PPT Quality', 'Q&A Response'],
    requirement:'PPT presentation and hard copies of Abstract & PPT must be submitted on game day.',
    coordinator: { name: 'Yuga Bhargavi .E', phone: '9361858688' }
  },
  'BUG HUNT': {
    venue:'JS Hall → Computer Lab', duration:'Multi-round', team:'2 members', capacity:'100 teams', selection:'25-question quiz → Top 30',
    description:'Bug Hunt is an exciting competition where participants identify and find errors or bugs in a given program, code, application, or problem under time pressure.',
    rounds:[
      'Round 1: 25-question online technical quiz (1 mark each, 20s per question) in JS Hall. Top 30 teams qualify.',
      'Round 2: Practical debugging challenge in the Computer Lab across Easy, Medium, and Hard levels (1 hour total).',
      'Tie-Breaker Round: Hard-level coding challenge with strict time constraint if scores are tied.',
      'Top 3 finalists selected based on bugs solved, marks scored, and time taken.'
    ],
    evaluation:['Number of bugs solved','Marks scored','Time taken','Error identification','Logic & syntax accuracy'],
    requirement:'Only one login/phone permitted per team. Registered email ID mandatory.',
    coordinator: { name: 'MANASA', phone: '8668160427' }
  },
  'PROMPT2PRODUCT': {
    venue:'JS Hall', duration:'Multi-round', team:'2 members', capacity:'100 teams', selection:'Strict FCFS',
    description:'Use AI prompting, creativity and problem-solving to transform a given challenge or idea into a practical product concept.',
    rounds:['Teams are accepted strictly by registration timestamp until capacity is reached.','Round 1: interpret the challenge and develop the initial prompted solution.','Round 2: refine implementation, usability and product thinking.','Finals: present the completed product concept and working outcome.'],
    evaluation:['Prompting ability','Creativity','Problem-solving','Product thinking','Practicality','Presentation'],
    requirement:'Every team must bring its own laptop. There is no preliminary shortlist.',
    coordinator: { name: 'Hariharan. A', phone: '9123512048' }
  },
  'SHARK TANK': {
    venue:'JS Hall', duration:'2 Dynamic Rounds', team:'Individual / Team', capacity:'100+ participants', selection:'Strict FCFS',
    description:'An interactive business and entrepreneurship challenge where participants transform ideas into business concepts, adapt to unexpected topics, and convince judges that their approach is worth backing.',
    rounds:[
      'Round 1: Pick, Prepare & Pitch — Randomly pick a chit containing a product, service, or business idea. Get 5 minutes to prepare, present a 2-3 minute pitch, and face judges Q&A.',
      'Shortlisted participants move to Round 2.',
      'Round 2: Expect the Unexpected — Receive a new, diverse concept unrelated to Round 1. Develop a fresh business approach, deliver a bold pitch, and defend your idea in judges Q&A.'
    ],
    evaluation:['Creativity & Innovation', 'Business Viability', 'Strategic Thinking', 'Problem-Solving', 'Market Understanding', 'Communication & Presentation', 'Confidence & Adaptability', 'Response to Judges Questions'],
    requirement:'FCFS Registration (100+ participants). Participants must think fast, adapt smart, and present clear business thinking.',
    coordinator: { name: 'Tejazwini', phone: '9361967947' }
  },
  'CRIME MYSTERY': {
    venue:'JS Hall', duration:'Round 1: 30 minutes', team:'4 members', capacity:'100 teams → Top 20', selection:'FCFS + performance shortlist',
    description:'A team investigation and deduction challenge testing observation, logical reasoning, analytical thinking and teamwork through clues, evidence and witness statements.',
    rounds:[
      'Round 1: up to 100 teams complete a 25-question mystery quiz in 30 minutes.',
      'Teams are ranked by observation, reasoning and deduction performance.',
      'The top 20 teams advance to Round 2.',
      'Round 2 uses a detailed clue-and-evidence mystery; the best teams proceed to the final challenge.'
    ],
    evaluation:['Observation', 'Logical reasoning', 'Analytical thinking', 'Deduction', 'Teamwork', 'Accuracy'],
    requirement:'Exactly four members per team.',
    coordinator: { name: 'Harini Saminathan', phone: '8098163256' }
  },
  'IPL AUCTION': {
    venue:'Assigned auction arena', duration:'Single round', team:'4 members', capacity:'80 teams', selection:'Strict FCFS',
    description:'IPL Auction is a strategic competition where teams compete through bidding to build their strongest possible squad from the available 120-player pool within a 120 CR budget.',
    rounds:[
      'The first 80 valid teams are accepted, subject to department limits.',
      'Players are presented one by one with their rating and base price.',
      'Teams place competitive bids from their 120 CR virtual purse to acquire at least 11 players.',
      'Top 3 winners are selected based on team rating, amount spent, and squad fitness.'
    ],
    evaluation:['Strategic thinking', 'Decision-making', 'Budget management', 'Team coordination', 'Cricket knowledge', 'Real-time bidding'],
    requirement:'Maximum four teams per department; exactly four members per team. Each team starts with 120 CR budget and must acquire at least 11 players.',
    coordinator: { name: 'Hariprasad', phone: '8838081556' }
  }
}

export default function ChallengeDetail({ challenge, onClose, onRegister, registrationStatus, statusLoading, onRefreshStatus }) {
  const brief = eventBriefs[challenge.name]
  return (
    <div className="overlay challenge-detail">
      <button className="close" onClick={onClose}><X /></button>
      <div className="detail-watermark">{challenge.symbol}</div>
      <div className="detail-shell">
        <header>
          <small>CHALLENGE {challenge.n} / {challenge.category}</small>
          <h2>{challenge.name}</h2>
          <p>{brief.description}</p>
        </header>
        <EventStatusPanel status={registrationStatus} loading={statusLoading} onRefresh={onRefreshStatus} />
        <div className="detail-meta">
          <div><span>TEAM</span><strong>{brief.team}</strong></div>
          <div><span>VENUE</span><strong>{brief.venue}</strong></div>
          <div><span>DURATION</span><strong>{brief.duration}</strong></div>
          <div><span>CAPACITY</span><strong>{brief.capacity}</strong></div>
          <div><span>SELECTION</span><strong>{brief.selection}</strong></div>
        </div>
        <div className="detail-content">
          <section>
            <small>ROUND PROTOCOL</small>
            <ol>
              {brief.rounds.map((round, index) => (
                <li key={round}>
                  <i>{String(index + 1).padStart(2, '0')}</i>
                  <p>{round}</p>
                </li>
              ))}
            </ol>
            {brief.domains && (
              <div style={{ marginTop: '32px' }}>
                <small>DOMAINS</small>
                <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {brief.domains.map(domain => (
                    <li key={domain} style={{ padding: '12px 14px', border: '1px solid #ffffff1b', background: '#0c0c0e', color: '#e0e0e0', font: '500 11px JetBrains Mono', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#e32748', fontSize: '10px' }}>◈</span>
                      <span>{domain}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <aside>
            <small>EVALUATION FOCUS</small>
            <ul>
              {brief.evaluation.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="event-requirement">
              <span>IMPORTANT REQUIREMENT</span>
              <p>{brief.requirement}</p>
            </div>
            {brief.coordinator && (
              <div className="event-requirement" style={{ marginTop: '16px', borderColor: '#00f3ff', background: '#00f3ff12' }}>
                <span>EVENT COORDINATOR</span>
                <p style={{ margin: '6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <strong style={{ color: '#fff', fontFamily: 'Barlow Condensed', fontSize: '16px' }}>{brief.coordinator.name}</strong>
                  <a href={`tel:${brief.coordinator.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#00f3ff', textDecoration: 'none', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
                    <Phone size={12} />
                    <span>{brief.coordinator.phone}</span>
                  </a>
                </p>
              </div>
            )}
          </aside>
        </div>
        <footer>
          <div><span>REGISTRATION</span><strong>{registrationStatus?.registered ? '● CONFIRMED' : '● OPEN'}</strong></div>
          {registrationStatus?.registered ? (
            <button className="primary registered-button" type="button" onClick={onRefreshStatus}>
              <Check size={16} /> ALREADY REGISTERED
            </button>
          ) : (
            <button className="primary" onClick={onRegister}>
              REGISTER FOR THIS CHALLENGE <ArrowRight size={16} />
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
