import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'studyflow-data'
const statusOrder = ['red', 'yellow', 'green', 'orange']

const defaultTasks = [
  {
    id: 1,
    title: 'JEE Physics — Kinematics video',
    category: 'JEE',
    type: 'video',
    videoUrl: 'https://www.youtube.com/watch?v=3uU9fL7R5bA',
    status: 'yellow',
    subject: 'Physics'
  },
  {
    id: 2,
    title: 'HSC Chemistry — Chemical Bonding',
    category: 'HSC',
    type: 'reading',
    status: 'red',
    subject: 'Chemistry'
  },
  {
    id: 3,
    title: 'Maths 2 — Differentiation revision set',
    category: 'HSC',
    type: 'reading',
    status: 'green',
    subject: 'Mathematics'
  },
  {
    id: 4,
    title: 'NSEP application submission',
    category: 'Competition',
    type: 'competition',
    status: 'red',
    subject: 'Science'
  },
  {
    id: 5,
    title: 'Research — Study quantum mechanics basics',
    category: 'Research',
    type: 'research',
    status: 'yellow',
    subject: 'Physics'
  }
]

const reviewPatterns = {
  standard: [1, 3, 7, 14, 30],
  spaced: [2, 5, 7, 12]
}

function addDays(date, days) {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

function getStatusColor(status) {
  const map = {
    red: '#ef4444',
    yellow: '#facc15',
    green: '#22c55e',
    orange: '#f97316'
  }
  return map[status] || '#94a3b8'
}

function buildPlan(tasks, examDate) {
  const completeDates = tasks
    .filter((task) => task.status === 'green')
    .map((task) => ({
      title: task.title,
      date: new Date(),
      category: task.category,
      reviewDates: reviewPatterns.standard.map((interval) => addDays(new Date(), interval))
    }))

  const revisionPlan = []
  for (let i = 0; i < Math.min(5, completeDates.length || 1); i += 1) {
    const entry = completeDates[i] || {
      title: 'Upcoming review cycle',
      category: 'General',
      reviewDates: reviewPatterns.standard.map((interval) => addDays(new Date(), interval + i))
    }
    revisionPlan.push(entry)
  }

  const today = new Date()
  const targetDate = new Date(examDate)
  const diffDays = Math.max(0, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)))

  const activeTopics = tasks.filter((task) => task.status !== 'green')
  const summary = [
    { label: 'Total tasks', value: tasks.length },
    { label: 'Completed', value: tasks.filter((task) => task.status === 'green').length },
    { label: 'In progress', value: tasks.filter((task) => task.status === 'yellow').length },
    { label: 'Days left', value: diffDays }
  ]

  return { summary, revisionPlan, activeTopics, diffDays }
}

export default function App() {
  const [examDate, setExamDate] = useState('2026-06-15')
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : defaultTasks
  })
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'HSC',
    subject: 'Physics',
    type: 'reading',
    videoUrl: '',
    status: 'red'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const plan = useMemo(() => buildPlan(tasks, examDate), [tasks, examDate])

  const addTask = (event) => {
    event.preventDefault()
    if (!newTask.title.trim()) return

    const task = {
      id: Date.now(),
      title: newTask.title.trim(),
      category: newTask.category,
      subject: newTask.subject,
      type: newTask.type,
      videoUrl: newTask.videoUrl,
      status: newTask.status || 'red'
    }

    setTasks((current) => [task, ...current])
    setNewTask({
      title: '',
      category: 'HSC',
      subject: 'Physics',
      type: 'reading',
      videoUrl: '',
      status: 'red'
    })
  }

  const updateStatus = (taskId, nextStatus) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status: nextStatus } : task
      )
    )
  }

  const tasksByCategory = {
    JEE: tasks.filter((task) => task.category === 'JEE'),
    HSC: tasks.filter((task) => task.category === 'HSC'),
    Competition: tasks.filter((task) => task.category === 'Competition'),
    Research: tasks.filter((task) => task.category === 'Research')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI Study Operating System</p>
          <h1>StudyFlow</h1>
        </div>
        <div className="topbar-badges">
          <span>2-3-5-7</span>
          <span>Leitner</span>
          <span>Active recall</span>
        </div>
      </header>

      <section className="hero-card">
        <div>
          <p className="label">Exam target</p>
          <h2>{examDate ? formatShortDate(new Date(examDate)) : 'Set your exam date'}</h2>
        </div>
        <label className="date-input">
          <span>Update exam date</span>
          <input
            type="date"
            value={examDate}
            onChange={(event) => setExamDate(event.target.value)}
          />
        </label>
      </section>

      <section className="stats-grid">
        {plan.summary.map((item) => (
          <div className="stat-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <main className="workspace-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>Study queue</h3>
            <span className="muted">Red • Yellow • Green</span>
          </div>

          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
            <div className="category-group" key={category}>
              <h4>{category}</h4>
              {categoryTasks.length === 0 ? (
                <p className="empty">No items here yet.</p>
              ) : (
                categoryTasks.map((task) => (
                  <article className="task-card" key={task.id}>
                    <div className="task-topline">
                      <span className="badge">{task.subject}</span>
                      {task.videoUrl && (
                        <a href={task.videoUrl} target="_blank" rel="noreferrer">
                          Watch video
                        </a>
                      )}
                    </div>

                    <h5>{task.title}</h5>

                    <div className="status-row">
                      {statusOrder
                        .filter((status) => category !== 'Competition' || status !== 'green' || true)
                        .map((status) => {
                          const allowed =
                            category === 'Competition'
                              ? ['red', 'yellow', 'green', 'orange']
                              : ['red', 'yellow', 'green']

                          if (!allowed.includes(status)) return null

                          const active = task.status === status
                          return (
                            <button
                              key={status}
                              type="button"
                              className={`status-pill ${active ? 'active' : ''}`}
                              style={{ background: getStatusColor(status), opacity: active ? 1 : 0.45 }}
                              onClick={() => updateStatus(task.id, status)}
                            >
                              {status}
                            </button>
                          )
                        })}
                    </div>
                  </article>
                ))
              )}
            </div>
          ))}
        </section>

        <aside className="panel planner-panel">
          <div className="panel-header">
            <h3>Smart planner</h3>
            <span className="muted">Auto-generated</span>
          </div>

          <div className="planner-box">
            <h4>Exam countdown</h4>
            <p className="countdown">{plan.diffDays} days left</p>
          </div>

          <div className="planner-box">
            <h4>Spaced repetition</h4>
            <ul>
              {['2-day', '5-day', '7-day', '14-day', '30-day'].map((step) => (
                <li key={step}>{step} review</li>
              ))}
            </ul>
          </div>

          <div className="planner-box">
            <h4>Leitner flow</h4>
            <div className="leitner-grid">
              <span>Box 1</span>
              <span>Box 2</span>
              <span>Box 3</span>
            </div>
          </div>

          <div className="planner-box">
            <h4>Revision schedule</h4>
            {plan.revisionPlan.map((entry) => (
              <div className="revision-item" key={entry.title + entry.category}>
                <strong>{entry.title}</strong>
                <div className="date-list">
                  {entry.reviewDates.map((date, index) => (
                    <span key={`${entry.title}-${index}`}>{formatShortDate(date)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <section className="panel form-panel">
        <div className="panel-header">
          <h3>Add new focus</h3>
        </div>

        <form onSubmit={addTask} className="task-form">
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(event) => setNewTask({ ...newTask, title: event.target.value })}
          />

          <select
            value={newTask.category}
            onChange={(event) => setNewTask({ ...newTask, category: event.target.value })}
          >
            <option value="JEE">JEE</option>
            <option value="HSC">HSC</option>
            <option value="Competition">Competition</option>
            <option value="Research">Research</option>
          </select>

          <input
            type="text"
            placeholder="Subject"
            value={newTask.subject}
            onChange={(event) => setNewTask({ ...newTask, subject: event.target.value })}
          />

          {newTask.category === 'JEE' && (
            <input
              type="url"
              placeholder="Video link"
              value={newTask.videoUrl}
              onChange={(event) => setNewTask({ ...newTask, videoUrl: event.target.value })}
            />
          )}

          <select
            value={newTask.status}
            onChange={(event) => setNewTask({ ...newTask, status: event.target.value })}
          >
            <option value="red">Red</option>
            <option value="yellow">Yellow</option>
            <option value="green">Green</option>
            <option value="orange">Orange</option>
          </select>

          <button type="submit">Add task</button>
        </form>
      </section>

      <section className="panel research-panel">
        <div className="panel-header">
          <h3>Research & long-term growth</h3>
        </div>
        <div className="research-grid">
          <div className="research-card">
            <span className="tiny-label">Goal</span>
            <p>Build a strong foundation for IIT-level thinking while keeping HSC concepts crisp.</p>
          </div>
          <div className="research-card">
            <span className="tiny-label">Method</span>
            <p>Use spaced repetition, active recall, and weekly deep-dive reflection.</p>
          </div>
          <div className="research-card">
            <span className="tiny-label">Output</span>
            <p>Track wins, competitions, and personal learning loops in one dashboard.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
