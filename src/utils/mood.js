export const getMoodTone = (score) => {
  if (score <= 3) {
    return {
      label: 'We are here for you',
      gradient: 'from-blue-500/20 via-sky-500/10 to-cyan-400/20',
      text: 'text-sky-200',
    }
  }

  if (score <= 6) {
    return {
      label: 'You are doing okay',
      gradient: 'from-violet-500/20 via-purple-500/10 to-fuchsia-500/20',
      text: 'text-violet-200',
    }
  }

  return {
    label: 'You are thriving',
    gradient: 'from-blue-400/30 via-indigo-500/15 to-cyan-300/20',
    text: 'text-cyan-100',
  }
}

export const calculateStreak = (entries) => {
  if (!entries.length) {
    return 0
  }

  const days = [...new Set(entries.map((entry) => new Date(entry.createdAt).toDateString()))]
    .map((dateString) => new Date(dateString))
    .sort((a, b) => b - a)

  let streak = 1

  for (let index = 1; index < days.length; index += 1) {
    const previous = days[index - 1]
    const current = days[index]
    const diff = (previous - current) / (1000 * 60 * 60 * 24)

    if (diff === 1) {
      streak += 1
    } else {
      break
    }
  }

  return streak
}

export const averageMood = (entries) => {
  if (!entries.length) {
    return 0
  }

  const total = entries.reduce((sum, item) => sum + Number(item.moodScore || 0), 0)
  return Number((total / entries.length).toFixed(1))
}

export const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
