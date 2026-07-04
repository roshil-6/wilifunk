extends Node
class_name FightManager

@export var p1: Fighter
@export var p2: Fighter

# Assign these via the Godot Editor Inspector
@export var ui_p1_health_bar: ProgressBar
@export var ui_p2_health_bar: ProgressBar
@export var ui_timer_label: Label
@export var ui_winner_label: Label

var time_left: int = 60
var is_game_over: bool = false
var timer: Timer

func _ready():
	# Create a 1-second repeating timer for the countdown
	timer = Timer.new()
	timer.wait_time = 1.0
	timer.autostart = true
	timer.timeout.connect(_on_timer_tick)
	add_child(timer)
	
	if ui_winner_label:
		ui_winner_label.visible = false

func _process(delta: float):
	if is_game_over: return
	
	# Update UI Bars
	if ui_p1_health_bar and p1:
		ui_p1_health_bar.value = p1.health
	if ui_p2_health_bar and p2:
		ui_p2_health_bar.value = p2.health
		
	# Check win condition (KO)
	if p1.health <= 0 or p2.health <= 0:
		end_game()

func _on_timer_tick():
	if is_game_over: return
	time_left -= 1
	
	if ui_timer_label:
		ui_timer_label.text = str(time_left)
		
	if time_left <= 0:
		time_left = 0
		end_game()

func end_game():
	is_game_over = true
	timer.stop()
	
	if ui_winner_label:
		ui_winner_label.visible = true
		if p1.health > p2.health:
			ui_winner_label.text = "PLAYER 1 WINS!"
		elif p2.health > p1.health:
			ui_winner_label.text = "PLAYER 2 WINS!"
		else:
			ui_winner_label.text = "DRAW!"
