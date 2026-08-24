import { ArrowRight, Check, Phone, X } from 'lucide-react'
import EventStatusPanel from './EventStatusPanel'

const eventBriefs = {
  'PAPER PRESENTATION': {
    venue:'Classroom', duration:'2 hours', team:'2 members', capacity:'30 teams', selection:'Faculty abstract evaluation',
    description:'Present research ideas, technical concepts, innovations or solutions before a faculty judging panel. The event rewards technical understanding, originality, relevance and clarity of communication.',
    rounds:['Submit the team abstract through the participant portal.','Faculty members evaluate every abstract for a total of 20 marks.','The top 30 teams are shortlisted.','Shortlisted teams deliver the final presentation before the judging panel.'],
    evaluation:['Technical understanding','Originality','Relevance','Presentation quality','Communication clarity'],
    requirement:'An abstract must be submitted before faculty evaluation.'
  },
  'BUG HUNT': {
    venue:'JS Hall → Computer Lab', duration:'Multi-round', team:'2 members', capacity:'100 teams', selection:'25-question quiz → Top 50',
    description:'Bug Hunt is an exciting competition where participants identify and find errors or bugs in a given program, code, application, or problem under time pressure.',
    rounds:[
      'Round 1: 25-question online technical quiz (1 mark each, 20s per question) in JS Hall. Top 50 teams qualify.',
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
    requirement:'Every team must bring its own laptop. There is no preliminary shortlist.'
  },
  'SHARK TANK': {
    venue:'JS Hall', duration:'Multi-round', team:'Individual', capacity:'100 participants', selection:'Strict FCFS',
    description:'An individual entrepreneurship and product-pitching competition where each participant must convince the judges of the value and potential of a product or business idea.',
    rounds:['The first 100 valid individual registrations are accepted.','Round 1: every participant receives exactly one minute to pitch and sell the idea.','Judges shortlist the strongest Round 1 performers.','Finalists compete in the final pitching round before the judging panel.'],
    evaluation:['Creativity','Communication','Persuasion','Confidence','Product understanding','Business thinking','Presentation skills'],
    requirement:'Individual participation only. The one-minute Round 1 limit is mandatory.'
  },
  'CRIME MYSTERY': {
    venue:'JS Hall', duration:'Round 1: 30 minutes', team:'4 members', capacity:'100 teams → Top 20', selection:'FCFS + performance shortlist',
    description:'A team investigation and deduction challenge testing observation, logical reasoning, analytical thinking and teamwork through clues, evidence and witness statements.',
    rounds:['Round 1: up to 100 teams complete a 25-question mystery quiz in 30 minutes.','Teams are ranked by observation, reasoning and deduction performance.','The top 20 teams advance to Round 2.','Round 2 uses a detailed clue-and-evidence mystery; the best teams proceed to the final challenge.'],
    evaluation:['Observation','Logical reasoning','Analytical thinking','Deduction','Teamwork','Accuracy'],
    requirement:'Exactly four members per team.'
  },
  'IPL AUCTION': {
    venue:'Assigned auction arena', duration:'Two auction rounds + final', team:'4 members', capacity:'80 teams', selection:'Strict FCFS',
    description:'A strategic cricket-auction simulation where teams use a fixed virtual budget and competitive bidding to assemble the strongest squad.',
    rounds:['The first 80 valid teams are accepted, subject to department limits.','Round 1: registered teams participate in the opening auction phase.','Round 2: qualifying teams continue to the next auction phase.','Qualifying teams advance to the final auction, where the winner is decided by the event scoring rules.'],
    evaluation:['Strategic thinking','Decision-making','Budget management','Team coordination','Cricket knowledge','Real-time bidding'],
    requirement:'Maximum four teams per department; exactly four members per team.'
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
