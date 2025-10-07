import plotly.graph_objects as go
from datetime import datetime, timedelta
import calendar
import requests
import os


def fetch_MLB(year):
    """Fetch MLB schedule from their API"""
    url = f"https://statsapi.mlb.com/api/v1/seasons?sportId=1&season={year}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if data['seasons']:
            season = data['seasons'][0]
            phases = []
            
            if 'springStartDate' in season and 'springEndDate' in season:
                phases.append((
                    'Spring Training',
                    season['springStartDate'],
                    season['springEndDate']
                ))
            
            if 'regularSeasonStartDate' in season and 'lastDate1stHalf' in season:
                phases.append((
                    'Regular Season<br>(1st Half)',
                    season['regularSeasonStartDate'],
                    season['lastDate1stHalf']
                ))
            
            if 'allStarDate' in season:
                phases.append((
                    'All-Star Game',
                    season['allStarDate'],
                    (datetime.strptime(season['allStarDate'], "%Y-%m-%d") + timedelta(hours=23)).strftime("%Y-%m-%d")
                ))

            if 'firstDate2ndHalf' in season and 'regularSeasonEndDate' in season:
                phases.append((
                    'Regular Season<br>(2nd Half)',
                    season['firstDate2ndHalf'],
                    season['regularSeasonEndDate']
                ))
            
            if 'postSeasonStartDate' in season and 'postSeasonEndDate' in season:
                phases.append((
                    'World Series',
                    season['postSeasonStartDate'],
                    season['postSeasonEndDate']
                ))
            
            return phases
    except Exception as e:
        print(f"Error fetching MLB data: {e}")
        return None

def get_league_data(current_year):
    """Get schedule data for all leagues"""
    data = {
        'League': ['NBA', 'NHL', 'NFL', 'MLB'],
        'Phases': []
    }
    
    mlb_phases = fetch_MLB(current_year)
    year = 12
    
    data['Phases'].append([
        ('Pre Season', 10.0, 10.5), 
        ('Regular Season', 10.5, 4.25 + year), 
        ('The Finals', 4.5 + year, 6.5 + year)
    ])
    
    data['Phases'].append([
        ('Pre Season', 9.75, 10.2), 
        ('Regular Season', 10.2, 4.5 + year), 
        ('Stanley Cup', 4.5 + year, 6.5 + year)
    ])
    
    data['Phases'].append([
        ('Pre Season', 8.0, 9.0), 
        ('Regular Season', 9.0, 1.2 + year), 
        ('Super Bowl', 1.5 + year, 2.5 + year)
    ])
    
    if mlb_phases:
        print("✓ Using live MLB data from API")
        data['Phases'].append(mlb_phases)
    else:
        print("✗ Using fallback MLB data (API unavailable)")
        data['Phases'].append([
            ('Spring Training', 2.75, 4.0), 
            ('Regular Season', 4.0, 10.25), 
            ('World Series', 10.0, 11.25)
        ])
    
    return data

def plot_season(fig, league, phases, colors, season_offset=0, opacity=0.7, season_name=""):
    """Plot season phases as horizontal bars on a plotly figure."""
    for phase_name, start, end in phases:
        if isinstance(start, float) and isinstance(end, float):
            start_adjusted = start + season_offset
            end_adjusted = end + season_offset

            start_day = int((start_adjusted - 1) % 1 * 30) + 1
            end_day = int((end_adjusted - 1) % 1 * 30) + 1
            start_month = int((start_adjusted - 1) % 12 + 1)
            start_year = int((start_adjusted - 1) // 12 + (datetime.now().year - 1))
            end_month = int((end_adjusted - 1) % 12 + 1)
            end_year = int((end_adjusted - 1) // 12 + (datetime.now().year - 1))
            start_label = f"{start_day} {calendar.month_abbr[start_month]}"
            end_label = f"{end_day} {calendar.month_abbr[end_month]}"
        else:
            start_date = datetime.strptime(start, "%Y-%m-%d")
            end_date = datetime.strptime(end, "%Y-%m-%d")
            def add_months(dt, months):
                year = dt.year + (dt.month - 1 + months) // 12
                month = (dt.month - 1 + months) % 12 + 1
                day = min(dt.day, calendar.monthrange(year, month)[1])
                return datetime(year, month, day)
            start_date_offset = add_months(start_date, season_offset-12)
            end_date_offset = add_months(end_date, season_offset-12)
            start_adjusted = start_date_offset.month + (start_date_offset.day - 1) / 30 + (start_date_offset.year - (datetime.now().year - 1)) * 12
            end_adjusted = end_date_offset.month + (end_date_offset.day - 1) / 30 + (end_date_offset.year - (datetime.now().year - 1)) * 12
            start_label = start_date_offset.strftime("%d %b")
            end_label = end_date_offset.strftime("%d %b")

        fig.add_trace(go.Bar(
            x=[end_adjusted - start_adjusted],
            y=[league],
            base=[start_adjusted],
            orientation='h',
            name=season_name,
            marker=dict(color=colors[league], opacity=opacity, line=dict(color='black', width=0.5)),
            text=phase_name.replace('<br>', ' '),  # Remove line breaks for mobile
            textposition='inside',
            insidetextanchor='middle', 
            textfont=dict(size=8, color='black'),  # Smaller text
            showlegend=bool(season_name),
            customdata=[[start_label, end_label]],
            hovertemplate=(
                f'<b>{league}</b><br>{phase_name}'
                f'<br>From: {start_label}<br>To: {end_label}'
                '<extra></extra>'
            )
        ))

def create_sports_timeline():
    """Create mobile-optimized interactive sports timeline visualization"""
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    current_day = now.day
    current_month_str = calendar.month_name[current_month]
    
    data = get_league_data(current_year)
    
    colors = {
        'NBA': "#C98613", 
        'NHL': "#A2AAAD", 
        'NFL': "#82CD32", 
        'MLB': "#217EE1"
    }
    
    fig = go.Figure()

    for i, league in enumerate(data['League']):
        phases = data['Phases'][i]
        plot_season(fig, league, phases, colors, season_offset=0, opacity=0.3, season_name="Previous<br>Season")
        plot_season(fig, league, phases, colors, season_offset=12, opacity=0.7, season_name="Current<br>Season")
        plot_season(fig, league, phases, colors, season_offset=24, opacity=0.5, season_name="Next<br>Season")
    
    today_x = now.month + (now.day - 1) / 30 + 12
    fig.add_shape(type="line",
        xref="x", yref="paper",
        x0=today_x, y0=0, x1=today_x, y1=1.05,
        line=dict(
            color="red",
            width=2,
            dash="dash",
        )
    )
    fig.add_annotation(
        x=today_x,
        y=1,
        yref='paper',
        yanchor='bottom',
        text=f"Today: {current_month_str} {current_day}",
        showarrow=False,
        yshift=15,
        font=dict(size=10)  # Smaller font for mobile
    )

    fig.add_vline(x=13, line_color="brown", line_width=2,
                  annotation_text=f"Start {current_year}",
                  annotation_position="top",
                  annotation_font_size=10)
    fig.add_vline(x=25, line_color="brown", line_width=2,
                  annotation_text=f"Start {current_year+1}",
                  annotation_position="top",
                  annotation_font_size=10)
    
    month_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] * 3
    tick_positions = list(range(1, 37))
    
    fig.update_layout(
        title=dict(
            text='Sports League Timeline',
            font=dict(size=16),  # Smaller title
            x=0.5,
            xanchor='center'
        ),
        xaxis=dict(
            title=f'Years {current_year-1}, {current_year}, {current_year + 1}',
            tickmode='array',
            tickvals=tick_positions,
            ticktext=month_labels,
            range=[1, 36],
            showgrid=True,
            gridcolor='lightgray',
            gridwidth=1,
            tickfont=dict(size=10),  
            title_font=dict(size=12)
        ),
        yaxis=dict(
            title='League',
            categoryorder='array',
            categoryarray=['MLB', 'NFL', 'NHL', 'NBA'],
            title_font=dict(size=12),
            tickfont=dict(size=10)
        ),
        barmode='overlay',
        height=450,  
        width=900,
        plot_bgcolor='white',
        showlegend=False,
        margin=dict(l=80, r=20, t=60, b=80),
        autosize=False,
        # xaxis_rangeslider_visible=False
    )
    
    # Update traces for better mobile display
    fig.update_traces(
        textfont=dict(size=9),
        hovertemplate=(
            '<b>%{y}</b><br>%{text}'
            '<br>From: %{customdata[0]}<br>To: %{customdata[1]}'
            '<extra></extra>'
        )
    )
    
    return fig

def generate_css():
    """Generate CSS stylesheet"""
    return '''
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 10px;
}

.container {
    max-width: 100%;
    margin: 0 auto;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    overflow: hidden;
}

header {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
    padding: 20px;
    text-align: center;
}

header h1 {
    font-size: 1.8em;
    margin-bottom: 8px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

header p {
    font-size: 1em;
    opacity: 0.9;
}

nav {
    background: #2c3e50;
    padding: 0;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1px;
}

nav a {
    color: white;
    text-decoration: none;
    padding: 12px 15px;
    display: inline-block;
    transition: background 0.3s;
    font-weight: 600;
    font-size: 0.9em;
    flex: 1;
    min-width: 80px;
    text-align: center;
}

nav a:hover {
    background: #34495e;
}

.content {
    padding: 20px;
}

.section {
    margin-bottom: 40px;
}

.section h2 {
    font-size: 1.5em;
    margin-bottom: 15px;
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 8px;
}

.timeline-container {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    cursor: grab;
}

.timeline-container:active {
    cursor: grabbing;
}

/* Custom scrollbar for webkit browsers */
.timeline-container::-webkit-scrollbar {
    height: 8px;
}

.timeline-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.timeline-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

.timeline-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* Make the plotly chart container wide enough for the full timeline */
#timeline-plot {
    min-width: 800px; /* Force minimum width */
    width: 100%;
    height: 400px;
}

.league-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    margin-top: 20px;
}

.league-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.3s, box-shadow 0.3s;
    border-top: 4px solid;
}

.league-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.league-card.mlb {
    border-top-color: #217EE1;
}

.league-card.nba {
    border-top-color: #C98613;
}

.league-card.nfl {
    border-top-color: #82CD32;
}

.league-card.nhl {
    border-top-color: #A2AAAD;
}

.league-card h3 {
    font-size: 1.4em;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.league-icon {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
    font-size: 0.9em;
}

.mlb .league-icon {
    background: #217EE1;
}

.nba .league-icon {
    background: #C98613;
}

.nfl .league-icon {
    background: #82CD32;
}

.nhl .league-icon {
    background: #A2AAAD;
}

.league-card p {
    color: #666;
    line-height: 1.5;
    margin-bottom: 12px;
    font-size: 0.9em;
}

.project-list {
    list-style: none;
    margin-top: 12px;
}

.project-list li {
    padding: 8px 0;
    border-bottom: 1px solid #eee;
    color: #555;
    font-size: 0.9em;
}

.project-list li:last-child {
    border-bottom: none;
}

.btn {
    display: inline-block;
    padding: 10px 20px;
    background: #3498db;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    margin-top: 12px;
    transition: background 0.3s;
    font-weight: 600;
    font-size: 0.9em;
}

.btn:hover {
    background: #2980b9;
}

footer {
    background: #2c3e50;
    color: white;
    text-align: center;
    padding: 20px;
    margin-top: 30px;
    font-size: 0.9em;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin: 20px 0;
}

.stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.stat-card h4 {
    font-size: 1.8em;
    margin-bottom: 8px;
}

.stat-card p {
    opacity: 0.9;
    color: white;
    font-size: 0.9em;
}

.timeline-container {
    position: relative;
}

/* Fade effects to indicate scrollability */
.timeline-container::before,
.timeline-container::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 30px;
    pointer-events: none;
    z-index: 2;
    transition: opacity 0.3s;
}

.timeline-container::before {
    left: 0;
    background: linear-gradient(to right, rgba(248,249,250,1) 0%, rgba(248,249,250,0) 100%);
}

.timeline-container::after {
    right: 0;
    background: linear-gradient(to left, rgba(248,249,250,1) 0%, rgba(248,249,250,0) 100%);
}

/* Show/hide fade based on scroll position */
.timeline-container.scroll-start::after,
.timeline-container.scroll-middle::before,
.timeline-container.scroll-middle::after,
.timeline-container.scroll-end::before {
    opacity: 1;
}

.timeline-container:not(.scroll-start):not(.scroll-middle):not(.scroll-end)::before,
.timeline-container:not(.scroll-start):not(.scroll-middle):not(.scroll-end)::after {
    opacity: 0;
}

/* Tablet and Desktop Styles */
@media (min-width: 768px) {
    body {
        padding: 20px;
    }
    
    .container {
        max-width: 1400px;
        border-radius: 20px;
    }
    
    header {
        padding: 30px;
    }
    
    header h1 {
        font-size: 2.5em;
    }
    
    header p {
        font-size: 1.1em;
    }
    
    nav a {
        padding: 15px 25px;
        font-size: 1em;
        flex: none;
    }
    
    .content {
        padding: 30px;
    }
    
    .section h2 {
        font-size: 1.8em;
    }
    
    .league-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 25px;
    }
    
    .stats-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
    }
    
    .timeline-container {
        padding: 20px;
    }
}

@media (min-width: 1024px) {
    .league-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    nav a {
        padding: 20px 30px;
    }
}
'''

def generate_js():
    """Generate JavaScript file"""
    return '''

// Smooth scrolling for navigation links
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active state to navigation
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('nav a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Mobile menu toggle for small screens
function initMobileMenu() {
    const nav = document.querySelector('nav');
    if (window.innerWidth < 768) {
        nav.style.flexWrap = 'wrap';
    }
}

// Initialize mobile features
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    
    // Re-initialize on resize
    window.addEventListener('resize', initMobileMenu);
});

// Update scroll indicators based on position
function updateScrollIndicators() {
    const container = document.querySelector('.timeline-container');
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    container.classList.remove('scroll-start', 'scroll-middle', 'scroll-end');
    
    if (scrollLeft === 0) {
        container.classList.add('scroll-start');
    } else if (scrollLeft + clientWidth >= scrollWidth - 10) {
        container.classList.add('scroll-end');
    } else {
        container.classList.add('scroll-middle');
    }
}

// Initialize scroll indicators
document.addEventListener('DOMContentLoaded', function() {
    const timelineContainer = document.querySelector('.timeline-container');
    timelineContainer.addEventListener('scroll', updateScrollIndicators);
    updateScrollIndicators(); // Initial check
});

console.log('Sports Hub initialized! 🏆');

'''

def generate_html(current_year):
    """Generate HTML file"""
    return f'''

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sports Analytics Hub</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>🏆 Sports Analytics Hub</h1>
            <p>Your central dashboard for sports data, analytics, and insights</p>
        </header>
        
        <nav>
            <a href="#timeline">Timeline</a>
            <a href="#projects">Projects</a>
            <a href="#mlb">MLB</a>
            <a href="#nba">NBA</a>
            <a href="#nfl">NFL</a>
            <a href="#nhl">NHL</a>
        </nav>
        
        <div class="content">
            <!-- Timeline Section -->
            <section id="timeline" class="section">
                <h2>📅 League Season Timeline</h2>
                <div class="timeline-container">
                    <div id="timeline-plot"></div>
                </div>
            </section>
            
            <!-- Quick Stats -->
            <section class="section">
                <h2>📊 Quick Stats</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>4</h4>
                        <p>Major Leagues Tracked</p>
                    </div>
                    <div class="stat-card">
                        <h4>{current_year}</h4>
                        <p>Current Season</p>
                    </div>
                    <div class="stat-card">
                        <h4>Live</h4>
                        <p>Real-time Updates</p>
                    </div>
                    <div class="stat-card">
                        <h4>∞</h4>
                        <p>Insights Generated</p>
                    </div>
                </div>
            </section>
            
            <!-- League Projects Section -->
            <section id="projects" class="section">
                <h2>🚀 League Projects</h2>
                <div class="league-grid">
                    <!-- MLB Card -->
                    <div class="league-card mlb" id="mlb">
                        <h3>
                            <span class="league-icon">⚾</span>
                            MLB Projects
                        </h3>
                        <p>Exploring baseball analytics, player statistics, and game predictions for Major League Baseball.</p>
                        <ul class="project-list">
                            <li>📈 Player Performance Analytics</li>
                            <li>🎯 Win Probability Calculator</li>
                            <li>📊 Team Statistics Dashboard</li>
                            <li>🔮 Season Predictions Model</li>
                        </ul>
                        <a href="#" class="btn">View MLB Projects →</a>
                    </div>
                    
                    <!-- NBA Card -->
                    <div class="league-card nba" id="nba">
                        <h3>
                            <span class="league-icon">🏀</span>
                            NBA Projects
                        </h3>
                        <p>Basketball analytics covering player efficiency, shot analysis, and championship predictions.</p>
                        <ul class="project-list">
                            <li>🎯 Shot Chart Visualization</li>
                            <li>📊 Player Efficiency Rating</li>
                            <li>🏆 Playoff Bracket Predictor</li>
                            <li>📈 Real-time Game Analytics</li>
                        </ul>
                        <a href="#" class="btn">View NBA Projects →</a>
                    </div>
                    
                    <!-- NFL Card -->
                    <div class="league-card nfl" id="nfl">
                        <h3>
                            <span class="league-icon">🏈</span>
                            NFL Projects
                        </h3>
                        <p>Football analytics including game simulations, fantasy predictions, and team performance metrics.</p>
                        <ul class="project-list">
                            <li>🎮 Game Outcome Simulator</li>
                            <li>👤 Fantasy Football Optimizer</li>
                            <li>📊 Offensive vs Defensive Stats</li>
                            <li>🏆 Super Bowl Predictions</li>
                        </ul>
                        <a href="#" class="btn">View NFL Projects →</a>
                    </div>
                    
                    <!-- NHL Card -->
                    <div class="league-card nhl" id="nhl">
                        <h3>
                            <span class="league-icon">🏒</span>
                            NHL Projects
                        </h3>
                        <p>Hockey analytics with goalie performance tracking, team comparisons, and playoff forecasting.</p>
                        <ul class="project-list">
                            <li>🥅 Goalie Performance Tracker</li>
                            <li>📊 Team Power Rankings</li>
                            <li>🔥 Hot Streak Analyzer</li>
                            <li>🏆 Stanley Cup Predictor</li>
                        </ul>
                        <a href="#" class="btn">View NHL Projects →</a>
                    </div>
                </div>
            </section>
        </div>
        
        <footer>
            <p>&copy; {current_year} Sports Analytics Hub | Built with Python & Plotly</p>
            <p style="margin-top: 10px; opacity: 0.8;">Data updated in real-time from official league APIs</p>
        </footer>
    </div>
    
    <script src="timeline-data.js"></script>
    <script src="script.js"></script>
</body>
</html>

'''

if __name__ == "__main__":
    # Create the timeline visualization
    print("Generating sports timeline...")
    fig = create_sports_timeline()
    current_year = datetime.now().year
    
    # Get plotly JSON data
    plotly_json = fig.to_json()
    
    today_x = datetime.now().month + (datetime.now().day - 1) / 30 + 12
    
    # Create timeline-data.js with the plotly data
    timeline_js = f'''
    
// Timeline data generated from Python
const timelineData = {plotly_json};

// Render the plot with fixed dimensions for horizontal scrolling
Plotly.newPlot('timeline-plot', timelineData.data, timelineData.layout, {{
    responsive: false,  // Disable responsive for fixed width
    scrollZoom: true,   // Allow zooming by scrolling
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    modeBarButtonsToAdd: [],
    modeBarButtons: [['zoom2d', 'resetScale2d']]
}});

// Add touch-friendly panning
let isDragging = false;
let startX;
let scrollLeft;

const timelineContainer = document.querySelector('.timeline-container');
const plotElement = document.getElementById('timeline-plot');

timelineContainer.addEventListener('mousedown', (e) => {{
    isDragging = true;
    startX = e.pageX - timelineContainer.offsetLeft;
    scrollLeft = timelineContainer.scrollLeft;
    timelineContainer.style.cursor = 'grabbing';
}});

timelineContainer.addEventListener('mouseleave', () => {{
    isDragging = false;
    timelineContainer.style.cursor = 'grab';
}});

timelineContainer.addEventListener('mouseup', () => {{
    isDragging = false;
    timelineContainer.style.cursor = 'grab';
}});

timelineContainer.addEventListener('mousemove', (e) => {{
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - timelineContainer.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast factor
    timelineContainer.scrollLeft = scrollLeft - walk;
}});

// Touch events for mobile
timelineContainer.addEventListener('touchstart', (e) => {{
    startX = e.touches[0].pageX - timelineContainer.offsetLeft;
    scrollLeft = timelineContainer.scrollLeft;
}});

timelineContainer.addEventListener('touchmove', (e) => {{
    if (!e.touches || e.touches.length !== 1) return;
    e.preventDefault();
    const x = e.touches[0].pageX - timelineContainer.offsetLeft;
    const walk = (x - startX);
    timelineContainer.scrollLeft = scrollLeft - walk;
}});

// Handle window resize - maintain fixed width
window.addEventListener('resize', function() {{
    Plotly.Plots.resize('timeline-plot');
}});

// Auto-scroll to current date on load
setTimeout(() => {{
    const todayX = {today_x};
    const container = document.querySelector('.timeline-container');
    const plotWidth = plotElement.offsetWidth;
    const scrollPosition = (todayX / 36) * plotWidth - (container.offsetWidth / 2);
    container.scrollLeft = Math.max(0, scrollPosition);
}}, 1000);

'''
    # Create directories if needed
    os.makedirs('.', exist_ok=True)
    
    # Write all files
    print("Creating HTML file...")
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(generate_html(current_year))
    
    print("Creating CSS file...")
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(generate_css())
    
    print("Creating JavaScript files...")
    with open('script.js', 'w', encoding='utf-8') as f:
        f.write(generate_js())
    
    with open('timeline-data.js', 'w', encoding='utf-8') as f:
        f.write(timeline_js)
    
    print("\n" + "="*60)
    print("✓ Sports Hub website created successfully!")
    print("="*60)
    print("\nFiles generated:")
    print("  📄 index.html       - Main HTML structure")
    print("  🎨 styles.css       - All styling")
    print("  ⚙️  script.js        - Interactive features")
    print("  📊 timeline-data.js - Plotly chart data")
    print("\n" + "="*60)
    print("Open index.html in your browser to view your sports hub.")
    print("\nFeatures:")
    print("  • Smooth scrolling navigation")
    print("  • Animated cards on scroll")
    print("  • Active navigation highlighting")
    print("  • Responsive Plotly timeline")
    print("  • Modular, maintainable code structure")