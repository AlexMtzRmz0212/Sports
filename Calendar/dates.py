import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime
import calendar

# Clear terminal 
import os
os.system('cls' if os.name == 'nt' else 'clear')

now = datetime.now()
current_year = now.year
current_month = now.month
current_month_str = calendar.month_name[current_month]

year = 12
data = {
    'League': ['NBA', 'NHL', 'NFL', 'MLB'],
    'Phases': [
        [ # NBA
            # Early September to Mid September
            ('Pre\nSeason', 10.0, 10.5), 
            # Mid September to Early April
            ('Regular Season', 10.5, 4.25 + year), 
            # Early April to Mid June
            ('The Finals', 4.5 + year, 6.5 + year)
            ],
        [ # NHL
            ('Pre\nSeason', 9.75, 10.2), 
            ('Regular Season', 10.2, 4.5 + year), 
            ('Stanley Cup', 4.5 + year, 6.5 + year)
        ],
        [ # NFL
            ('Pre\nSeason', 8.0, 9.0), 
            ('Regular Season', 9.0, 1.2 + year), 
            ('Super\nBowl', 1.5 + year, 2.5 + year)
        ],
        [ # MLB
            ('Spring\nTraining', 2.75, 4.0), 
            ('Regular Season', 4.0, 10.25), 
            ('World\nSeries', 10.0, 11.25)
        ]
    ]
}

# --- Plotting ---
fig, ax = plt.subplots(figsize=(16, 5.5))
colors = {'NBA': "#C98613", 'NHL': "#A2AAAD", 'NFL': "#82CD32", 'MLB': "#217EE1A0"}
bar_height = 1

# Main loop to draw two seasons for each league
for i, league in enumerate(data['League']):
    phases = data['Phases'][i]
    y_center = i * 2  # Calculate a central y-position for the league group

    # --- Plot Previous Season ---
    for phase_name, start, end in phases:
        ax.barh(y=y_center, width=end - start, left=start, height=bar_height,
                color=colors[league], edgecolor='black', alpha=0.3)
        ax.text(start + (end - start) / 2, y_center, phase_name,
                ha='center', va='center', color='black', fontweight='bold', fontsize=9)

    # --- Plot Current Season ---
    for phase_name, start, end in phases:
        start_next, end_next = start + 12, end + 12
        ax.barh(y=y_center, width=end_next - start_next, left=start_next, height=bar_height,
                color=colors[league], edgecolor='black', alpha=0.5)
        ax.text(start_next + (end_next - start_next) / 2, y_center, phase_name,
                ha='center', va='center', color='black', fontweight='bold', fontsize=9)


# --- Formatting the Chart ---
ax.set_yticks([i * 2 for i in range(len(data['League']))])
ax.set_yticklabels(data['League'], fontsize=16, weight='bold')
ax.invert_yaxis()

tick_positions = range(1, 37)
tick_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] * 3
ax.set_xticks(tick_positions)
ax.set_xticklabels(tick_labels)
ax.set_xlim(2, 31)
ax.set_ylim(len(data['League']) * 2 - 1, -2.5) # (down,up)

# Add annotations for calendar years
y = -0.5  # Position for year annotations
y_offset = 0.1  # Offset for the next year label
x=13
ax.axvline(x=x, color='brown', linestyle='-', linewidth=2)
ax.text(x + 0.15, y-y_offset, f'Start of {current_year} →', color='grey', ha='left', fontsize=12, style='italic')
ax.text(x - 0.15, y-y_offset, f'← End of {current_year - 1}', color='grey', ha='right', fontsize=12, style='italic')

x=25
ax.axvline(x=x, color='brown', linestyle='-', linewidth=2)
ax.text(x + 0.15, y-y_offset, f'Start of {current_year+1} →', color='grey', ha='left', fontsize=12, style='italic')
ax.text(x - 0.15, y-y_offset, f'← End of {current_year}', color='grey', ha='right', fontsize=12, style='italic')

x = now.month + (now.day - 1) / 30 + 12
ax.axvline(x=x, color='red', linestyle='--', linewidth=2)
ax.text(x - 0.15, y-1, 'Today:', color='black', ha='right', fontsize=12, style='italic')
ax.text(x + 0.15, y-1, f'{current_month_str} {now.day}, {current_year}', color='black', ha='left', fontsize=12, style='italic')

# --- Final Touches ---
plt.xlabel(f'Years {current_year-1}, {current_year}, {current_year + 1}', fontsize=12)
plt.ylabel('League', fontsize=14, weight='bold')
plt.title('Timeline of Major Sports Leagues', fontsize=18, pad=10)
plt.grid(axis='x', linestyle='--', alpha=0.7)

# Create a custom legend
legend_elements = [mpatches.Patch(facecolor=colors[league], edgecolor='black', label=league) for league in data['League']]
plt.legend(handles=legend_elements, loc='center', bbox_to_anchor=(0.131, 0.94),
          ncol=len(data['League']), fancybox=True, shadow=True, title="Leagues")

plt.tight_layout(rect=[0.05, 0, 1, 0.95])

# --- Save and Show the plot ---
plt.savefig('./Calendar/sports_leagues_dual_timeline.png', dpi=300, bbox_inches='tight')

print("Plot saved as sports_leagues_dual_timeline.png")
# To display the plot in an interactive window, uncomment the following line:
# plt.show()