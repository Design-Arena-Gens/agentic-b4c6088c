'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle2, Target, Bell, Plus, X, Edit2, Trash2, BookOpen } from 'lucide-react'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'

interface ScheduleItem {
  id: string
  title: string
  time: string
  date: string
  description?: string
}

interface Goal {
  id: string
  title: string
  description: string
  progress: number
  dueDate: string
}

interface Assignment {
  id: string
  title: string
  course: string
  dueDate: string
  completed: boolean
  points?: number
}

interface Reminder {
  id: string
  title: string
  date: string
  time: string
}

export default function Dashboard() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])

  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [canvasUrl, setCanvasUrl] = useState('')
  const [canvasToken, setCanvasToken] = useState('')
  const [showCanvasSetup, setShowCanvasSetup] = useState(false)

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboardData')
    if (saved) {
      const data = JSON.parse(saved)
      setScheduleItems(data.scheduleItems || [])
      setGoals(data.goals || [])
      setAssignments(data.assignments || [])
      setReminders(data.reminders || [])
      setCanvasUrl(data.canvasUrl || '')
      setCanvasToken(data.canvasToken || '')
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    const data = {
      scheduleItems,
      goals,
      assignments,
      reminders,
      canvasUrl,
      canvasToken
    }
    localStorage.setItem('dashboardData', JSON.stringify(data))
  }, [scheduleItems, goals, assignments, reminders, canvasUrl, canvasToken])

  // Fetch Canvas assignments
  const fetchCanvasAssignments = async () => {
    if (!canvasUrl || !canvasToken) {
      alert('Please set up Canvas integration first')
      setShowCanvasSetup(true)
      return
    }

    try {
      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ canvasUrl, canvasToken })
      })

      if (response.ok) {
        const data = await response.json()
        const canvasAssignments = data.map((item: any) => ({
          id: `canvas-${item.id}`,
          title: item.name,
          course: item.course_name || 'Canvas Course',
          dueDate: item.due_at || new Date().toISOString(),
          completed: item.submission?.submitted_at ? true : false,
          points: item.points_possible
        }))
        setAssignments(prev => {
          const nonCanvas = prev.filter(a => !a.id.startsWith('canvas-'))
          return [...nonCanvas, ...canvasAssignments]
        })
        alert('Canvas assignments synced successfully!')
      } else {
        alert('Failed to fetch Canvas assignments. Please check your credentials.')
      }
    } catch (error) {
      console.error('Canvas sync error:', error)
      alert('Error syncing with Canvas. Make sure your Canvas URL and token are correct.')
    }
  }

  const addScheduleItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      title: formData.get('title') as string,
      time: formData.get('time') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string
    }
    setScheduleItems([...scheduleItems, newItem])
    setShowScheduleForm(false)
    form.reset()
  }

  const addGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      progress: 0,
      dueDate: formData.get('dueDate') as string
    }
    setGoals([...goals, newGoal])
    setShowGoalForm(false)
    form.reset()
  }

  const addAssignment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      title: formData.get('title') as string,
      course: formData.get('course') as string,
      dueDate: formData.get('dueDate') as string,
      completed: false,
      points: Number(formData.get('points')) || undefined
    }
    setAssignments([...assignments, newAssignment])
    setShowAssignmentForm(false)
    form.reset()
  }

  const addReminder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string
    }
    setReminders([...reminders, newReminder])
    setShowReminderForm(false)
    form.reset()
  }

  const toggleAssignment = (id: string) => {
    setAssignments(assignments.map(a =>
      a.id === id ? { ...a, completed: !a.completed } : a
    ))
  }

  const updateGoalProgress = (id: string, progress: number) => {
    setGoals(goals.map(g =>
      g.id === id ? { ...g, progress } : g
    ))
  }

  const deleteItem = (type: string, id: string) => {
    if (type === 'schedule') setScheduleItems(scheduleItems.filter(i => i.id !== id))
    if (type === 'goal') setGoals(goals.filter(g => g.id !== id))
    if (type === 'assignment') setAssignments(assignments.filter(a => a.id !== id))
    if (type === 'reminder') setReminders(reminders.filter(r => r.id !== id))
  }

  const getDateLabel = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      if (isToday(date)) return 'Today'
      if (isTomorrow(date)) return 'Tomorrow'
      if (isPast(date)) return 'Overdue'
      return format(date, 'MMM d')
    } catch {
      return dateString
    }
  }

  const sortedAssignments = [...assignments].sort((a, b) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  const sortedSchedule = [...scheduleItems].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`)
    const dateB = new Date(`${b.date} ${b.time}`)
    return dateA.getTime() - dateB.getTime()
  })

  const sortedReminders = [...reminders].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`)
    const dateB = new Date(`${b.date} ${b.time}`)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Personal Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your schedule, goals, and assignments</p>
        </header>

        {/* Canvas Integration Section */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Canvas LMS Integration</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {canvasUrl ? 'Connected' : 'Not configured'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCanvasSetup(!showCanvasSetup)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {showCanvasSetup ? 'Hide' : 'Setup'}
              </button>
              {canvasUrl && canvasToken && (
                <button
                  onClick={fetchCanvasAssignments}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Sync Canvas
                </button>
              )}
            </div>
          </div>

          {showCanvasSetup && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Canvas URL (e.g., https://canvas.instructure.com)
                  </label>
                  <input
                    type="text"
                    value={canvasUrl}
                    onChange={(e) => setCanvasUrl(e.target.value)}
                    placeholder="https://your-school.instructure.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Canvas API Token
                  </label>
                  <input
                    type="password"
                    value={canvasToken}
                    onChange={(e) => setCanvasToken(e.target.value)}
                    placeholder="Your Canvas API token"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Generate a token in Canvas: Account → Settings → New Access Token
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Schedule */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Daily Schedule</h2>
              </div>
              <button
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {showScheduleForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            {showScheduleForm && (
              <form onSubmit={addScheduleItem} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <input
                  name="title"
                  placeholder="Event title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="date"
                    type="date"
                    required
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    name="time"
                    type="time"
                    required
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <input
                  name="description"
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Event
                </button>
              </form>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
              {sortedSchedule.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No scheduled events</p>
              ) : (
                sortedSchedule.map(item => (
                  <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getDateLabel(item.date)} at {item.time}
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteItem('schedule', item.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Goals</h2>
              </div>
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {showGoalForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            {showGoalForm && (
              <form onSubmit={addGoal} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <input
                  name="title"
                  placeholder="Goal title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <input
                  name="description"
                  placeholder="Description"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <input
                  name="dueDate"
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add Goal
                </button>
              </form>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
              {goals.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No goals yet</p>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Due: {getDateLabel(goal.dueDate)}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteItem('goal', goal.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress}
                        onChange={(e) => updateGoalProgress(goal.id, Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assignments</h2>
              </div>
              <button
                onClick={() => setShowAssignmentForm(!showAssignmentForm)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {showAssignmentForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            {showAssignmentForm && (
              <form onSubmit={addAssignment} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <input
                  name="title"
                  placeholder="Assignment title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <input
                  name="course"
                  placeholder="Course name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <input
                  name="dueDate"
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <input
                  name="points"
                  type="number"
                  placeholder="Points (optional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Add Assignment
                </button>
              </form>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
              {sortedAssignments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No assignments</p>
              ) : (
                sortedAssignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className={`p-4 rounded-lg hover:shadow-md transition-shadow ${
                      assignment.completed
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={assignment.completed}
                        onChange={() => toggleAssignment(assignment.id)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${
                            assignment.completed
                              ? 'line-through text-gray-500 dark:text-gray-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.course}</p>
                        <div className="flex gap-2 items-center mt-1">
                          <p className={`text-xs ${
                            isPast(parseISO(assignment.dueDate)) && !assignment.completed
                              ? 'text-red-500 font-semibold'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            Due: {getDateLabel(assignment.dueDate)}
                          </p>
                          {assignment.points && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              • {assignment.points} pts
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem('assignment', assignment.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reminders</h2>
              </div>
              <button
                onClick={() => setShowReminderForm(!showReminderForm)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {showReminderForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            {showReminderForm && (
              <form onSubmit={addReminder} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <input
                  name="title"
                  placeholder="Reminder title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="date"
                    type="date"
                    required
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    name="time"
                    type="time"
                    required
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Add Reminder
                </button>
              </form>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
              {sortedReminders.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reminders</p>
              ) : (
                sortedReminders.map(reminder => (
                  <div key={reminder.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{reminder.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getDateLabel(reminder.date)} at {reminder.time}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteItem('reminder', reminder.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
