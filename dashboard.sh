#!/bin/bash

# Navigate to the correct directory
cd ~/code/cli-ascii-3d

# Create a new tmux session
tmux new-session -d -s cli-ascii-3d

# Function to create a new pane and run cli-ascii-3d with random parameters
create_pane() {
    local boxes=$((RANDOM % 10 + 1))  # Random number of boxes between 1 and 10
    local speed=$(awk -v min=0.1 -v max=5.0 'BEGIN{srand(); print min+rand()*(max-min)}')  # Random speed between 0.1 and 5.0
    local extra_params=""
    
    # 30% chance to add an extra parameter (for future expansions)
    if [ $((RANDOM % 10)) -lt 3 ]; then
        extra_params="--experimental"
    fi

    tmux split-window -t cli-ascii-3d "node index.js -b $boxes -s $speed $extra_params"
    tmux select-layout -t cli-ascii-3d tiled  # Reorganize panes in a tiled layout
}

# Create initial pane with btm
tmux split-window -t cli-ascii-3d "btm"
tmux select-layout -t cli-ascii-3d tiled

# Create 4 panes with cli-ascii-3d
for i in {1..4}; do
    create_pane
done

# Adjust layouts and pane sizes randomly
for i in {1..10}; do
    tmux select-pane -t cli-ascii-3d:.$((RANDOM % 5))  # Select a random pane (including btm)
    tmux resize-pane -t cli-ascii-3d -x $((RANDOM % 60 + 30)) -y $((RANDOM % 30 + 10))  # Resize randomly
done

# Set random pane borders
border_styles=("single" "double" "heavy" "simple" "rounded")
for i in {0..4}; do
    style=${border_styles[$((RANDOM % ${#border_styles[@]}))]}
    tmux select-pane -t cli-ascii-3d:.$i -P "pane-border-style=$style"
done

# Attach to the tmux session
tmux attach-session -t cli-ascii-3d