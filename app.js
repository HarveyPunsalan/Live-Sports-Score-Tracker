// ── Grab HTML elements ──
const searchInput     = document.getElementById('search-input')
const searchBtn       = document.getElementById('search-btn')
const statusMsg       = document.getElementById('status-msg')
const teamProfile     = document.getElementById('team-profile')
const teamBadge       = document.getElementById('team-badge')
const teamName        = document.getElementById('team-name')
const teamSport       = document.getElementById('team-sport')
const teamCountry     = document.getElementById('team-country')
const teamStadium     = document.getElementById('team-stadium')
const resultsSection  = document.getElementById('results-section')
const lastResults     = document.getElementById('last-results')
const upcomingMatches = document.getElementById('upcoming-matches')

// ── Main search function ──
async function searchTeam() {
    const query = searchInput.value.trim()
    if (!query) return

    // Reset everything
    statusMsg.textContent = 'Searching...'
    statusMsg.style.display = 'block'
    teamProfile.classList.add('hidden')
    resultsSection.classList.add('hidden')
    lastResults.innerHTML = ''
    upcomingMatches.innerHTML = ''

    try {
        // FETCH 1 — search for the team
        const teamRes  = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`)
        const teamData = await teamRes.json()

        // If no team found
        if (!teamData.teams) {
            statusMsg.textContent = 'No team found. Try a different name!'
            return
        }

        // Grab the first result
        const team = teamData.teams[0]

        // Show team profile
        displayTeamProfile(team)

        // FETCH 2 — last 5 results using team ID
        const lastRes  = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${team.idTeam}`)
        const lastData = await lastRes.json()

        // FETCH 3 — upcoming matches using same team ID
        const nextRes  = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${team.idTeam}`)
        const nextData = await nextRes.json()

        // Display both sections
        displayLastResults(lastData.results, team.strTeam)
        displayUpcoming(nextData.events)

        // Hide status, show results
        statusMsg.style.display = 'none'
        resultsSection.classList.remove('hidden')

    } catch (error) {
        statusMsg.textContent = 'Something went wrong. Check your internet!'
        console.error(error)
    }
}

// ── Display team profile ──
function displayTeamProfile(team) {
    teamBadge.src = team.strTeamBadge
        ? team.strTeamBadge.replace('http://', 'https://')
        : ''

    // Hide badge if it fails to load
    teamBadge.onerror = () => teamBadge.style.display = 'none'
    teamBadge.onload  = () => teamBadge.style.display = 'block'

    teamName.textContent    = team.strTeam
    teamSport.textContent   = `🏅 ${team.strSport}`
    teamCountry.textContent = `🌍 ${team.strCountry}`
    teamStadium.textContent = `🏟️ ${team.strStadium || 'Stadium unknown'}`

    teamProfile.classList.remove('hidden')
}

// ── Display last 5 results ──
function displayLastResults(results, searchedTeam) {
    if (!results) {
        lastResults.innerHTML = '<p class="no-data">No recent results found.</p>'
        return
    }

    results.forEach(match => {
        const homeScore = parseInt(match.intHomeScore)
        const awayScore = parseInt(match.intAwayScore)
        const isHome    = match.strHomeTeam.toLowerCase().includes(searchedTeam.toLowerCase())

        // Figure out win/loss/draw from searched team's perspective
        let result = 'draw'
        if (isHome && homeScore > awayScore)  result = 'win'
        else if (!isHome && awayScore > homeScore) result = 'win'
        else if (isHome && homeScore < awayScore)  result = 'loss'
        else if (!isHome && awayScore < homeScore) result = 'loss'

        const card = document.createElement('div')
        card.classList.add('match-card', result)

        card.innerHTML = `
      <div class="match-teams">
        <span class="team-label">${match.strHomeTeam}</span>
        <span class="score">${match.intHomeScore} - ${match.intAwayScore}</span>
        <span class="team-label">${match.strAwayTeam}</span>
      </div>
      <div class="match-meta">
        <span>${match.strLeague}</span>
        <span>${match.dateEvent}</span>
      </div>
      <span class="result-badge ${result}">${result.toUpperCase()}</span>
    `

        lastResults.appendChild(card)
    })
}

// ── Display upcoming matches ──
function displayUpcoming(events) {
    if (!events) {
        upcomingMatches.innerHTML = '<p class="no-data">No upcoming matches scheduled.</p>'
        return
    }

    events.forEach(match => {
        const card = document.createElement('div')
        card.classList.add('match-card', 'upcoming')

        card.innerHTML = `
      <div class="match-teams">
        <span class="team-label">${match.strHomeTeam}</span>
        <span class="vs">VS</span>
        <span class="team-label">${match.strAwayTeam}</span>
      </div>
      <div class="match-meta">
        <span>${match.strLeague}</span>
        <span>📅 ${match.dateEvent}${match.strTime ? ' — ' + match.strTime : ''}</span>
      </div>
    `

        upcomingMatches.appendChild(card)
    })
}

// ── Event listeners ──
searchBtn.addEventListener('click', searchTeam)
searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchTeam()
})