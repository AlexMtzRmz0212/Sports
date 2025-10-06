import plotly.graph_objects as go
from datetime import datetime
import calendar

# Get current date information
now = datetime.now()
current_year = now.year
current_month = now.month
current_day = now.day
current_month_str = calendar.month_name[current_month]



year = 12
data = {
    'League': ['NBA', 'NHL', 'NFL', 'MLB'],
    'Phases': [
        [ # NBA
            ('Pre Season', 10.0, 10.5), 
            ('Regular Season', 10.5, 4.25 + year), 
            ('The Finals', 4.5 + year, 6.5 + year)
        ],
        [ # NHL
            ('Pre Season', 9.75, 10.2), 
            ('Regular Season', 10.2, 4.5 + year), 
            ('Stanley Cup', 4.5 + year, 6.5 + year)
        ],
        [ # NFL
            ('Pre Season', 8.0, 9.0), 
            ('Regular Season', 9.0, 1.2 + year), 
            ('Super Bowl', 1.5 + year, 2.5 + year)
        ],
        [ # MLB
            ('Spring Training', 2.75, 4.0), 
            ('Regular Season', 4.0, 10.25), 
            ('World Series', 10.0, 11.25)
        ]
    ]
}

colors = {'NBA': "#C98613", 'NHL': "#A2AAAD", 'NFL': "#82CD32", 'MLB': "#217EE1"}

# Create figure
fig = go.Figure()

# Add bars for each league and phase
for i, league in enumerate(data['League']):
    phases = data['Phases'][i]
    y_position = len(data['League']) - i - 1  # Invert y-axis
    
    # Plot Previous Season (lighter opacity)
    for phase_name, start, end in phases:
        fig.add_trace(go.Bar(
            x=[end - start],
            y=[league],
            base=[start],
            orientation='h',
            name=f'{league} - {phase_name} (Previous)',
            marker=dict(color=colors[league], opacity=0.3, line=dict(color='black', width=1)),
            text=phase_name,
            textposition='inside',
            textfont=dict(size=10, color='black'),
            showlegend=False,
            hovertemplate=f'<b>{league}</b><br>{phase_name}<br>Start: Month {start:.1f}<br>End: Month {end:.1f}<extra></extra>'
        ))
    
    # Plot Current Season (higher opacity)
    for phase_name, start, end in phases:
        start_next, end_next = start + 12, end + 12
        fig.add_trace(go.Bar(
            x=[end_next - start_next],
            y=[league],
            base=[start_next],
            orientation='h',
            name=f'{league} - {phase_name} (Current)',
            marker=dict(color=colors[league], opacity=0.7, line=dict(color='black', width=1)),
            text=phase_name,
            textposition='inside',
            textfont=dict(size=10, color='black'),
            showlegend=False,
            hovertemplate=f'<b>{league}</b><br>{phase_name}<br>Start: Month {start_next:.1f}<br>End: Month {end_next:.1f}<extra></extra>'
        ))

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

# Generate HTML
html_content = fig.to_html(include_plotlyjs='cdn')

# Save to index.html
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("index.html has been created successfully!")
print(f"Open it in your browser to see the interactive sports league timeline.")