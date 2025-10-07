import plotly.graph_objects as go
from datetime import datetime, timedelta
import calendar
import requests


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
            
            # Spring Training
            if 'springStartDate' in season and 'springEndDate' in season:
                phases.append((
                    'Spring Training',
                    season['springStartDate'],
                    season['springEndDate']
                ))
            
            # Regular Season (split into 1st and 2nd half)
            if 'regularSeasonStartDate' in season and 'lastDate1stHalf' in season:
                phases.append((
                    'Regular Season<br>(1st Half)',
                    season['regularSeasonStartDate'],
                    season['lastDate1stHalf']
                ))
            
            # All-Star Game indicator could be added here

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
            
            # Postseason
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
    
    # Try to fetch MLB data from API
    mlb_phases = fetch_MLB(current_year)
    
    # Fallback to hardcoded data if API fails
    year = 12  # Offset for displaying across years
    
    # NBA (hardcoded for now - can be replaced with NBA API later)
    data['Phases'].append([
        ('Pre Season', 10.0, 10.5), 
        ('Regular Season', 10.5, 4.25 + year), 
        ('The Finals', 4.5 + year, 6.5 + year)
    ])
    
    # NHL (hardcoded for now - can be replaced with NHL API later)
    data['Phases'].append([
        ('Pre Season', 9.75, 10.2), 
        ('Regular Season', 10.2, 4.5 + year), 
        ('Stanley Cup', 4.5 + year, 6.5 + year)
    ])
    
    # NFL (hardcoded for now - can be replaced with NFL API later)
    data['Phases'].append([
        ('Pre Season', 8.0, 9.0), 
        ('Regular Season', 9.0, 1.2 + year), 
        ('Super Bowl', 1.5 + year, 2.5 + year)
    ])
    
    # MLB - use API data if available, otherwise fallback
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
    """
    Plot season phases as horizontal bars on a plotly figure.
    
    Parameters:
    - fig: plotly graph_objects figure
    - league: str, league name
    - phases: list of tuples (phase_name, start_month, end_month) where months are 1-12
    - colors: dict mapping league names to colors
    - season_offset: int, months offset from current season (0=current, -12=previous, +12=next)
    - opacity: float, opacity level for the bars
    - season_name: str, name of the season for legend and hover
    """
    for phase_name, start, end in phases:
        # Check if start and end are floats (month floats), otherwise use as-is
        if isinstance(start, float) and isinstance(end, float):
            start_adjusted = start + season_offset
            end_adjusted = end + season_offset

            # Format start and end as month/year strings
            start_day = int((start_adjusted - 1) % 1 * 30) + 1
            end_day = int((end_adjusted - 1) % 1 * 30) + 1
            start_month = int((start_adjusted - 1) % 12 + 1)
            start_year = int((start_adjusted - 1) // 12 + (datetime.now().year - 1))
            end_month = int((end_adjusted - 1) % 12 + 1)
            end_year = int((end_adjusted - 1) // 12 + (datetime.now().year - 1))
            start_label = f"{start_day} {calendar.month_abbr[start_month]} {start_year}"
            end_label = f"{end_day} {calendar.month_abbr[end_month]} {end_year}"
        else:
            # Parse start and end as date strings, convert to datetime
            start_date = datetime.strptime(start, "%Y-%m-%d")
            end_date = datetime.strptime(end, "%Y-%m-%d")
            # Apply season_offset (in months)
            def add_months(dt, months):
                year = dt.year + (dt.month - 1 + months) // 12
                month = (dt.month - 1 + months) % 12 + 1
                day = min(dt.day, calendar.monthrange(year, month)[1])
                return datetime(year, month, day)
            start_date_offset = add_months(start_date, season_offset-12)
            end_date_offset = add_months(end_date, season_offset-12)
            # Convert to month float for plotting
            start_adjusted = start_date_offset.month + (start_date_offset.day - 1) / 30 + (start_date_offset.year - (datetime.now().year - 1)) * 12
            end_adjusted = end_date_offset.month + (end_date_offset.day - 1) / 30 + (end_date_offset.year - (datetime.now().year - 1)) * 12
            # Format labels
            start_label = start_date_offset.strftime("%d %b %Y")
            end_label = end_date_offset.strftime("%d %b %Y")

        fig.add_trace(go.Bar(
            x=[end_adjusted - start_adjusted],
            y=[league],
            base=[start_adjusted],
            orientation='h',
            name=season_name,
            marker=dict(color=colors[league], opacity=opacity, line=dict(color='black', width=1)),
            text=phase_name,
            textposition='inside',
            insidetextanchor='middle', 
            textfont=dict(size=10, color='black'),
            showlegend=bool(season_name),  # Only show legend if season_name is provided
            hovertemplate=(
                f'<b>{league}</b><br>{phase_name}'
                f'<br>From: {start_label}<br>To: {end_label}'
            )
        ))
def create_sports_timeline():
    """Create interactive sports timeline visualization"""
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    current_day = now.day
    current_month_str = calendar.month_name[current_month]
    
    # Get league data (with API integration)
    data = get_league_data(current_year)
    
    colors = {
        'NBA': "#C98613", 
        'NHL': "#A2AAAD", 
        'NFL': "#82CD32", 
        'MLB': "#217EE1"
    }
    
    # Create figure
    fig = go.Figure()

    # Add bars for each league and phase
    for i, league in enumerate(data['League']):
        phases = data['Phases'][i]
        
        # Plot Previous Season (lighter opacity)
        plot_season(fig, league, phases, colors, season_offset=0, opacity=0.3, season_name="Previous<br>Season")

        # Plot Current Season (higher opacity)
        plot_season(fig, league, phases, colors, season_offset=12, opacity=0.7, season_name="Current<br>Season")

        # Plot Next Season (lighter opacity)
        plot_season(fig, league, phases, colors, season_offset=24, opacity=0.5, season_name="Next<br>Season")

    # Add vertical line for today
    today_x = now.month + (now.day - 1) / 30 + 12
    fig.add_vline(x=today_x, line_dash="dash", line_color="red", line_width=2,
                  annotation_text=f"Today: {current_month_str} {current_day}, {current_year}",
                  annotation_position="top")
    
    # Add vertical lines for year boundaries
    fig.add_vline(x=13, line_color="brown", line_width=2,
                  annotation_text=f"Start of {current_year}",
                  annotation_position="top")
    fig.add_vline(x=25, line_color="brown", line_width=2,
                  annotation_text=f"Start of {current_year+1}",
                  annotation_position="top")
    
    # Create month labels
    month_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] * 3
    tick_positions = list(range(1, 37))
    
    # Update layout
    fig.update_layout(
        title=dict(
            text='Timeline of Major Sports Leagues',
            font=dict(size=24),
            x=0.5,
            xanchor='center'
        ),
        xaxis=dict(
            title=f'Years {current_year-1}, {current_year}, {current_year + 1}',
            tickmode='array',
            tickvals=tick_positions,
            ticktext=month_labels,
            range=[2, 31],
            showgrid=True,
            gridcolor='lightgray',
            gridwidth=1
        ),
        yaxis=dict(
            title='League',
            categoryorder='array',
            categoryarray=['MLB', 'NFL', 'NHL', 'NBA']
        ),
        barmode='overlay',
        height=600,
        width=1400,
        plot_bgcolor='white',
        showlegend=False,
        margin=dict(l=100, r=50, t=100, b=100)
    )
    
    return fig

if __name__ == "__main__":
    # Create the visualization
    fig = create_sports_timeline()
    
    # Generate HTML
    html_content = fig.to_html(include_plotlyjs='cdn')
    
    # Save to index.html
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("\n" + "="*50)
    print("✓ index.html has been created successfully!")
    print("="*50)
    print("Open it in your browser to see the interactive sports league timeline.")