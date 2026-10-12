import { useEffect, useMemo, useState } from 'react'
import subjectData from './data.js'

const STORAGE_KEY = 'studyflow-data-v2'
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

const defaultSyllabus = subjectData.map((subject) => ({
  ...subject,
  chapters: subject.chapters.map((chapter, index) => ({
    name: chapter,
    status: index % 3 === 0 ? 'green' : index % 2 === 0 ? 'yellow' : 'red',
    reviewDates: [
      'Today',
      'D+2',
      'D+5',
      'D+7',
      'D+14'
    ]
  }))
}))

function getStatusColor(status) {
  const map = {
    red: '#ef4444',
    yellow: '#facc15',
    green: '#22c55e',
    orange: '#f97316'
  }
  return map[status] || '#94a3b8'
}

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

function buildPlan(tasks, examDate) {
  const today = new Date()
  const end = new Date(examDate)
  const diffDays = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)))

  const completed = tasks.filter((task) => task.status === 'green').length
  const pending = tasks.filter((task) => task.status === 'yellow').length
  const blocked = tasks.filter((task) => task.status === 'red').length

  const reviewPlan = [
    { title: '2-3-5-7 Cycle', dates: ['D+2', 'D+5', 'D+7', 'D+12'] },
    { title: 'Standard Recall', dates: ['D+1', 'D+3', 'D+7', 'D+14', 'D+30'] },
    { title: 'Leitner Reset', dates: ['Box 1', 'Box 2', 'Box 3'] }
  ]

  return { diffDays, completed, pending, blocked, reviewPlan }
}

export default function App() {
  const [examDate, setExamDate] = useState('2026-06-15')
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : defaultTasks
  })
  const [subjects, setSubjects] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}-subjects`)
    return saved ? JSON.parse(saved) : defaultSyllabus
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-subjects`, JSON.stringify(subjects))
  }, [subjects])

  const plan = useMemo(() => buildPlan(tasks, examDate), [tasks, examDate])

  const updateTaskStatus = (taskId, nextStatus) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status: nextStatus } : task
      )
    )
  }

  const updateChapterStatus = (subjectIndex, chapterIndex, nextStatus) => {
    setSubjects((current) =>
      current.map((subject, sIndex) => {
        if (sIndex !== subjectIndex) return subject

        return {
          ...subject,
          chapters: subject.chapters.map((chapter, cIndex) =>
            cIndex === chapterIndex ? { ...chapter, status: nextStatus } : chapter
          )
        }
      })
    )
  }

  const addTask = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const title = form.taskTitle.value.trim()
    if (!title) return

    const task = {
      id: Date.now(),
      title,
      category: form.category.value,
      subject: form.subject.value,
      type: form.type.value,
      videoUrl: form.videoUrl.value || '',
      status: form.status.value
    }

    setTasks((current) => [task, ...current])
    form.reset()
  }

  const totalChapters = subjects.reduce((sum, subject) => sum + subject.chapters.length, 0)
  const completedChapters = subjects.reduce(
    (sum, subject) => sum + subject.chapters.filter((chapter) => chapter.status === 'green').length,
    0
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI Study Operating System</p>
          <h1>StudyFlow</h1>
        </div>
        <div className="topbar-badges">
          <span>2-3-5-7</span>
          <span>Spaced</span>
          <span>Leitner</span>
        </div>
      </header>

      <section className="hero-card">
        <div>
          <p className="label">Your exam target</p>
          <h2>{formatShortDate(new Date(examDate))}</h2>
        </div>
        <label className="date-field">
          <span>Update exam date</span>
          <input
            type="date"
            value={examDate}
            onChange={(event) => setExamDate(event.target.value)}
          />
        </label>
      </section>

      <section className="overview-grid">
        <div className="stat-card">
          <span>Days left</span>
          <strong>{plan.diffDays}</strong>
        </div>
        <div className="stat-card">
          <span>Completed tasks</span>
          <strong>{plan.completed}</strong>
        </div>
        <div className="stat-card">
          <span>In progress</span>
          <strong>{plan.pending}</strong>
        </div>
        <div className="stat-card">
          <span>Syllabus done</span>
          <strong>{completedChapters}/{totalChapters}</strong>
        </div>
      </section>

      <main className="main-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>Study queue</h3>
            <span className="muted">Priority tracking</span>
          </div>

          {['JEE', 'HSC', 'Competition', 'Research'].map((group) => {
            const groupTasks = tasks.filter((task) => task.category === group)

            return (
              <div className="task-group" key={group}>
                <h4>{group}</h4>
                {groupTasks.length === 0 ? (
                  <p className="empty">No tasks here yet.</p>
                ) : (
                  groupTasks.map((task) => (
                    <div className="task-card" key={task.id}>
                      <div className="task-head">
                        <span className="chip">{task.subject}</span>
                        {task.videoUrl && (
                          <a href={task.videoUrl} target="_blank" rel="noreferrer">Watch</a>
                        )}
                      </div>

                      <h5>{task.title}</h5>

                      <div className="status-row">
                        {statusOrder.map((status) => {
                          const allowed = group === 'Competition'
                            ? ['red', 'yellow', 'green', 'orange']
                            : ['red', 'yellow', 'green']

                          if (!allowed.includes(status)) return null

                          const active = task.status === status
                          return (
                            <button
                              type="button"
                              key={status}
                              className={`status-pill ${active ? 'active' : ''}`}
                              style={{ background: getStatusColor(status), opacity: active ? 1 : 0.5 }}
                              onClick={() => updateTaskStatus(task.id, status)}
                            >
                              {status}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </section>

        <aside className="panel planner-panel">
          <div className="panel-header">
            <h3>Smart planner</h3>
            <span className="muted">Auto schedule</span>
          </div>

          <div className="planner-block">
            <h4>Revision system</h4>
            <ul>
              <li>2-day review</li>
              <li>5-day review</li>
              <li>7-day review</li>
              <li>14-day review</li>
              <li>30-day final check</li>
            </ul>
          </div>

          <div className="planner-block">
            <h4>Leitner flow</h4>
            <div className="leitner-grid">
              <span>Box 1</span>
              <span>Box 2</span>
              <span>Box 3</span>
            </div>
          </div>

          {plan.reviewPlan.map((cycle) => (
            <div className="planner-block" key={cycle.title}>
              <h4>{cycle.title}</h4>
              <div className="dates-row">
                {cycle.dates.map((date) => (
                  <span key={date}>{date}</span>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </main>

      <section className="panel syllabus-panel">
        <div className="panel-header">
          <h3>FYJC Chapter Tracker</h3>
          <span className="muted">Complete your syllabus smartly</span>
        </div>

        <div className="subject-grid">
          {subjects.map((subject, sIndex) => (
            <div className="subject-card" key={subject.name}>
              <h4>{subject.name}</h4>

              {subject.chapters.map((chapter, cIndex) => (
                <div className="chapter-row" key={`${subject.name}-${chapter.name}`}>
                  <span>{chapter.name}</span>
                  <div className="chapter-statuses">
                    {['red', 'yellow', 'green'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`mini-status ${chapter.status === status ? 'selected' : ''}`}
                        style={{ background: getStatusColor(status), opacity: chapter.status === status ? 1 : 0.28 }}
                        onClick={() => updateChapterStatus(sIndex, cIndex, status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="panel form-panel">
        <div className="panel-header">
          <h3>Add new focus</h3>
        </div>

        <form className="task-form" onSubmit={addTask}>
          <input name="taskTitle" placeholder="Task title" />
          <select name="category" defaultValue="HSC">
            <option value="JEE">JEE</option>
            <option value="HSC">HSC</option>
            <option value="Competition">Competition</option>
            <option value="Research">Research</option>
          </select>
          <input name="subject" placeholder="Subject" defaultValue="Physics" />
          <select name="type" defaultValue="reading">
            <option value="reading">Reading</option>
            <option value="video">Video</option>
            <option value="research">Research</option>
            <option value="competition">Competition</option>
          </select>
          <input name="videoUrl" placeholder="Video link (optional)" />
          <select name="status" defaultValue="red">
            <option value="red">Red</option>
            <option value="yellow">Yellow</option>
            <option value="green">Green</option>
            <option value="orange">Orange</option>
          </select>
          <button type="submit">Add task</button>
        </form>
      </section>
    </div>
  )
}
