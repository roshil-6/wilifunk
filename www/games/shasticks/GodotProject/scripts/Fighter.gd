extends CharacterBody2D
class_name Fighter

# Expose settings to Godot Inspector
@export var is_player_1: bool = true
@export var speed: float = 300.0
@export var jump_velocity: float = -600.0
@export var max_health: int = 100

var health: int = max_health
var is_facing_right: bool = true

enum State { IDLE, WALK, JUMP, ATTACK, HIT, KO }
var current_state: State = State.IDLE

# Get gravity from project settings
var gravity: int = ProjectSettings.get_setting("physics/2d/default_gravity")

# Ensure these nodes exist in your Fighter.tscn!
@onready var anim_player = $AnimationPlayer
@onready var sprite = $Sprite2D
@onready var hurtbox = $Hurtbox # Area2D for receiving hits
@onready var attack_hitbox = $Hitbox # Area2D for dealing hits

func _ready():
	if is_player_1:
		is_facing_right = true
	else:
		is_facing_right = false
		sprite.flip_h = true
	
	# Ensure hitbox collision is disabled at the start
	# The AnimationPlayer will enable/disable the CollisionShape2D during punch animations
	attack_hitbox.monitoring = true

func _physics_process(delta: float) -> void:
	if current_state == State.KO:
		return

	# Add gravity
	if not is_on_floor():
		velocity.y += gravity * delta

	if current_state in [State.HIT, State.ATTACK]:
		# Let physics (knockback/gravity) happen, but lock player movement input
		move_and_slide()
		return

	# Setup your Input Map in Project Settings
	var left_action = "p1_left" if is_player_1 else "p2_left"
	var right_action = "p1_right" if is_player_1 else "p2_right"
	var jump_action = "p1_jump" if is_player_1 else "p2_jump"
	var punch_action = "p1_punch" if is_player_1 else "p2_punch"
	var kick_action = "p1_kick" if is_player_1 else "p2_kick"

	# Handle Jump
	if Input.is_action_just_pressed(jump_action) and is_on_floor():
		velocity.y = jump_velocity
		change_state(State.JUMP)

	# Handle Attacks
	if Input.is_action_just_pressed(punch_action) and is_on_floor():
		perform_attack("punch")
		return
	elif Input.is_action_just_pressed(kick_action) and is_on_floor():
		perform_attack("kick")
		return

	# Handle Movement
	var direction := Input.get_axis(left_action, right_action)
	if direction:
		velocity.x = direction * speed
		is_facing_right = direction > 0
		sprite.flip_h = !is_facing_right
		
		# Flips the hitbox position dynamically based on direction
		attack_hitbox.scale.x = 1 if is_facing_right else -1
		
		if is_on_floor() and current_state != State.JUMP:
			change_state(State.WALK)
	else:
		velocity.x = move_toward(velocity.x, 0, speed)
		if is_on_floor() and current_state != State.JUMP:
			change_state(State.IDLE)

	move_and_slide()

func change_state(new_state: State):
	if current_state == new_state: return
	current_state = new_state
	
	match current_state:
		State.IDLE:
			anim_player.play("idle")
		State.WALK:
			anim_player.play("walk")
		State.JUMP:
			anim_player.play("jump")

func perform_attack(attack_type: String):
	change_state(State.ATTACK)
	velocity.x = 0 # stop sliding
	anim_player.play(attack_type)
	
	# IMPORTANT: Your 'punch' and 'kick' animations in AnimationPlayer 
	# must have a Call Method Track that calls 'end_attack()' at the end of the animation!

func end_attack():
	change_state(State.IDLE)
	
func take_damage(amount: int, knockback_x: float):
	if current_state == State.KO: return
	
	health -= amount
	velocity.x = knockback_x
	velocity.y = -200 # Slight cinematic juggle
	
	if health <= 0:
		health = 0
		change_state(State.KO)
		anim_player.play("ko")
	else:
		change_state(State.HIT)
		anim_player.play("hit")
		# Important: Your 'hit' animation must call 'end_hit_stun()' at the end!

func end_hit_stun():
	if current_state != State.KO:
		change_state(State.IDLE)
